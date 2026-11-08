import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "./auth";
import { syncWishlist } from "./shop.functions";

/**
 * Wishlist / "Save for later". Stored in localStorage, keyed by product
 * slug only — deliberately no server round-trip or DB table, since this is
 * a nice-to-have and every product's full details are already available
 * client-side via usePublicData(). Mirrors the pattern used by CartProvider.
 */

type WishlistCtx = {
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  count: number;
};

const Ctx = createContext<WishlistCtx | null>(null);
const KEY = "hiplastics-wishlist-v1";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const sync = useServerFn(syncWishlist);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setSlugs(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(slugs));
    } catch {
      /* ignore */
    }
  }, [slugs, hydrated]);

  useEffect(() => {
    if (!hydrated || !session?.access_token) return;
    let active = true;
    sync({ data: { access_token: session.access_token, slugs, mode: "merge" } }).then((result) => {
      if (!active || !result.ok) return;
      setSlugs((current) => current.length === result.slugs.length && current.every((slug) => result.slugs.includes(slug)) ? current : result.slugs);
    }).catch(() => undefined);
    return () => { active = false; };
    // Merge local and server selections when a session becomes available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, session?.access_token]);

  const value = useMemo<WishlistCtx>(
    () => ({
      slugs,
      has: (slug) => slugs.includes(slug),
      toggle: (slug) => setSlugs((prev) => {
        const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
        if (session?.access_token) void sync({ data: { access_token: session.access_token, slugs: next, mode: "replace" } }).catch(() => undefined);
        return next;
      }),
      count: slugs.length,
    }),
    [slugs, session?.access_token, sync],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWishlist must be used inside WishlistProvider");
  return c;
}
