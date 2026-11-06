import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { enforceRateLimit } from "./rate-limit";

const inquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  company: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(200),
  interest: z.string().trim().min(1).max(120),
  message: z.string().trim().min(5).max(1500),
});

export const createInquiryLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inquirySchema.parse(input))
  .handler(async ({ data }) => {
    enforceRateLimit(`inquiry:${data.email.toLowerCase()}`, 3, 60 * 60_000);
    const { getAdminClient } = await import("@/integrations/hiplastics/admin.server");
    const admin = getAdminClient();
    const { error } = await admin.from("inquiry_leads").insert({ ...data, email: data.email.toLowerCase(), source: "website" });
    if (error) throw new Error("We could not save your enquiry. Please try again or use WhatsApp directly.");
    return { ok: true as const };
  });

export const adminListInquiryLeads = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => z.object({ token: z.string().min(10) }).parse(input))
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/integrations/hiplastics/admin.server");
    const admin = getAdminClient();
    const { data: user, error: userError } = await admin.auth.getUser(data.token);
    if (userError || !user.user) throw new Error("Not authenticated");
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.user.id).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Not authorized");
    const { data: leads, error } = await admin.from("inquiry_leads").select("id, name, company, phone, email, interest, message, status, created_at").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return { leads: leads ?? [] };
  });
