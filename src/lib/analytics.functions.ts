import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { enforceRateLimit } from "./rate-limit";

const visitorIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{12,100}$/);

export type AccountWithoutOrder = {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_sign_in_at: string | null;
};

export type AdminAnalytics = {
  today: {
    uniqueVisitors: number;
    pageViews: number;
    signedInVisitors: number;
    topPaths: { path: string; views: number }[];
  };
  accountOnly: AccountWithoutOrder[];
};

/** Public event endpoint. It stores only a daily anonymous visitor aggregate. */
export const recordVisit = createServerFn({ method: "POST" })
  .inputValidator((d: { visitor_id: string; path: string; access_token?: string }) =>
    z.object({
      visitor_id: visitorIdSchema,
      path: z.string().min(1).max(300),
      access_token: z.string().min(10).max(4000).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    enforceRateLimit(`visit:${data.visitor_id}`, 120, 24 * 60 * 60_000);
    const { getAdminClient } = await import("@/integrations/hiplastics/admin.server");
    const admin = getAdminClient();
    let userId: string | null = null;
    if (data.access_token) {
      const { data: auth } = await admin.auth.getUser(data.access_token);
      userId = auth.user?.id ?? null;
    }
    const { error } = await admin.rpc("record_visit", {
      p_visitor_id: data.visitor_id,
      p_path: data.path,
      p_user_id: userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const getAdminAnalytics = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => z.object({ token: z.string().min(10) }).parse(d))
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/integrations/hiplastics/admin.server");
    const admin = getAdminClient();
    const { data: auth, error: authError } = await admin.auth.getUser(data.token);
    if (authError || !auth.user) throw new Error("Not authenticated");
    const { data: role } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Not authorized — admin role required");

    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(new Date());
    const [{ data: visits, error: visitsError }, { data: orderEmails, error: orderError }] = await Promise.all([
      admin.from("visitor_daily").select("visitor_id, page_count, last_path, user_id, last_seen_at").eq("visit_date", today).order("last_seen_at", { ascending: false }),
      admin.from("orders").select("user_id, customer_email").limit(10000),
    ]);
    if (visitsError) throw new Error(visitsError.message);
    if (orderError) throw new Error(orderError.message);

    const orderedUserIds = new Set((orderEmails ?? []).map((o) => o.user_id).filter(Boolean));
    const orderedEmails = new Set((orderEmails ?? []).map((o) => String(o.customer_email || "").trim().toLowerCase()).filter(Boolean));
    const accountOnly: AccountWithoutOrder[] = [];
    for (let page = 1; page <= 10; page++) {
      const { data: users, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(error.message);
      for (const user of users.users) {
        const email = String(user.email || "").trim().toLowerCase();
        if (!email || orderedUserIds.has(user.id) || orderedEmails.has(email)) continue;
        const metadata = (user.user_metadata || {}) as Record<string, unknown>;
        accountOnly.push({
          id: user.id,
          email,
          name: String(metadata.full_name || metadata.name || email.split("@")[0]),
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at ?? null,
        });
      }
      if (users.users.length < 1000) break;
    }

    const pathCounts = new Map<string, number>();
    for (const visit of visits ?? []) pathCounts.set(visit.last_path, (pathCounts.get(visit.last_path) || 0) + Number(visit.page_count || 0));
    return {
      today: {
        uniqueVisitors: visits?.length ?? 0,
        pageViews: (visits ?? []).reduce((sum, v) => sum + Number(v.page_count || 0), 0),
        signedInVisitors: (visits ?? []).filter((v) => Boolean(v.user_id)).length,
        topPaths: Array.from(pathCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([path, views]) => ({ path, views })),
      },
      accountOnly: accountOnly.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    } satisfies AdminAnalytics;
  });
