import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { getCartSnapshot, saveCartSnapshot } from "@/lib/shop.functions";
import { usePublicData } from "@/hooks/usePublicData";

/**
 * Mounted once near the root. Whenever a signed-in customer's cart changes,
 * debounced-saves a snapshot server-side so the abandoned-cart reminder
 * cron (routes/api/public/cart-reminder-cron.ts) can email them if they
 * never come back to check out. Guest (signed-out) carts aren't tracked —
 * there's no email to reach them at, and checkout requires sign-in anyway.
 */
export function CartSnapshotSync() {
  const { items, add, setQty } = useCart();
  const { session } = useAuth();
  const { products } = usePublicData();
  const load = useServerFn(getCartSnapshot);
  const save = useServerFn(saveCartSnapshot);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.access_token || !products.length || hydratedFor.current === session.access_token) return;
    let active = true;
    load({ data: { access_token: session.access_token } }).then((result) => {
      if (!active || !result.ok) return;
      for (const remote of result.items) {
        const local = items.find((item) => item.slug === remote.slug);
        const product = products.find((item) => item.slug === remote.slug);
        if (local) setQty(remote.slug, Math.max(local.qty, remote.qty));
        else if (product) add({ slug: product.slug, name: product.name, price: Number(product.price) || 0, image: product.image_url || product.image_urls?.[0] || "", ...(product.stock === undefined ? {} : { stock: Number(product.stock) || 0 }) }, remote.qty);
      }
      hydratedFor.current = session.access_token;
    }).catch(() => undefined);
    return () => { active = false; };
    // Merge once per authenticated session; subsequent changes are saved below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, products.length, items]);

  useEffect(() => {
    if (!session?.access_token) return;
    if (timer.current) clearTimeout(timer.current);
    // 3s debounce — avoids a server round-trip on every +/- click while the
    // customer is actively adjusting quantities.
    timer.current = setTimeout(() => {
      save({
        data: {
          access_token: session.access_token,
          items: items.map((i) => ({ slug: i.slug, name: i.name, qty: i.qty })),
        },
      }).catch(() => undefined);
    }, 3000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, session?.access_token]);

  return null;
}
