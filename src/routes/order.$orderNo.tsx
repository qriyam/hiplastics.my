import { RouteError } from "@/components/RouteError";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, XCircle, Download, Loader2, ShieldCheck, Star, ClipboardList, Truck, PackageCheck, Package } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { getOrder, type OrderRow, type OrderItemRow } from "@/lib/shop.functions";
import { money } from "@/lib/cart";
import { site } from "@/lib/site";
import { usePublicData } from "@/hooks/usePublicData";

type OrderSearch = { t?: string; email?: string };

export const Route = createFileRoute("/order/$orderNo")({
  validateSearch: (s: Record<string, unknown>): OrderSearch => ({
    t: typeof s.t === "string" ? s.t : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.orderNo} | ${site.name}` },
      { name: "description", content: "Track your Hiplastics Malaysia order status, payment and delivery details." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: `Order ${params.orderNo} — ${site.name}` },
      { property: "og:description", content: "Order status and invoice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => <RouteError error={error as Error} />,
  component: OrderPage,
});

function OrderPage() {
  const { orderNo } = Route.useParams();
  const { t, email: emailFromSearch } = Route.useSearch();
  const fetchOrder = useServerFn(getOrder);
  const { settings } = usePublicData();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [email, setEmail] = useState(emailFromSearch ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(!!t || !!emailFromSearch);

  async function load(withEmail?: string) {
    setBusy(true); setErr(null);
    const res = await fetchOrder({ data: { orderNo, token: t, email: withEmail } });
    if (res.ok) { setOrder(res.order); setItems(res.items); }
    else setErr(res.error);
    setBusy(false);
  }

  useEffect(() => {
    if (t) load();
    else if (emailFromSearch) load(emailFromSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, emailFromSearch, orderNo]);

  useEffect(() => {
    if (!order || order.payment_method !== "toyyibpay" || order.payment_status !== "pending") return;
    let cancelled = false;
    let attempts = 0;
    const timer = window.setInterval(async () => {
      if (cancelled || attempts >= 6) return;
      attempts += 1;
      const res = await fetchOrder({ data: { orderNo, token: t, email: emailFromSearch } });
      if (!cancelled && res.ok) { setOrder(res.order); setItems(res.items); }
      if (res.ok && res.order.payment_status !== "pending") window.clearInterval(timer);
    }, 3000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [order, orderNo, t, emailFromSearch, fetchOrder]);

  if (!order) {
    return (
      <SiteLayout showContact={false}>
        <section className="section-pad">
          <div className="container-page mx-auto max-w-md">
            <h1 className="text-2xl font-bold text-foreground">Track order {orderNo}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Enter the email used at checkout to view this order.</p>
            <form onSubmit={(e) => { e.preventDefault(); load(email); }} className="mt-5 space-y-3">
              <input required type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm" />
              {err && <p className="text-sm text-destructive">{err}</p>}
              <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} View order
              </button>
            </form>
          </div>
        </section>
      </SiteLayout>
    );
  }

  const paid = order.payment_status === "paid";
  const failed = order.payment_status === "failed";
  const cod = order.payment_method === "cod";
  const cur = order.currency || "MYR";
  const isCancelled = order.status === "cancelled" || order.payment_status === "refunded";
  const stampLabel = isCancelled ? (order.status === "cancelled" ? "Cancelled" : "Refunded") : paid ? "Paid" : null;

  const deliverySteps = [
    { key: "new", label: "Order received" },
    { key: "processing", label: "Packing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
  ] as const;
  // rankOf used to return -1 for any status it didn't recognise (e.g. a
  // status string with different casing), which silently marked every step
  // as "not done" and — combined with the icon issue below — left the
  // circles looking completely blank instead of just muted.
  const rankOf = (s: string) => {
    const i = ["new", "processing", "shipped", "delivered", "completed"].indexOf((s || "").toLowerCase().trim());
    return i === -1 ? 0 : i;
  };
  // Icons were previously looked up indirectly via a `step.icon` component
  // reference stored in the steps array; render them explicitly instead so
  // there's no chance of the reference resolving to nothing in production.
  function StepIcon({ stepKey, className }: { stepKey: (typeof deliverySteps)[number]["key"]; className?: string }) {
    if (stepKey === "new") return <ClipboardList className={className} />;
    if (stepKey === "processing") return <Package className={className} />;
    if (stepKey === "shipped") return <Truck className={className} />;
    return <PackageCheck className={className} />;
  }
  const accentColor = settings.invoice_accent_color || "var(--color-primary)";

  return (
    <SiteLayout>
      <section className="section-pad bg-surface">
        <div className="container-page mx-auto max-w-3xl">
          <div className={`flex items-start gap-3 rounded-lg border p-4 print:hidden ${paid || cod ? "border-primary/40 bg-primary/5" : failed ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}>
            {paid ? <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" /> : failed ? <XCircle className="h-6 w-6 shrink-0 text-destructive" /> : <Clock className="h-6 w-6 shrink-0 text-muted-foreground" />}
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {paid ? "Payment successful — order confirmed" : failed ? "Payment failed" : cod ? "Order received (Cash on delivery)" : "Awaiting payment"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Order <strong className="text-foreground">{order.order_no}</strong> · placed {new Date(order.created_at).toLocaleString()}
              </p>
              {failed && <p className="mt-1 text-sm text-destructive">Your order was not confirmed. Please place the order again or contact us.</p>}
            </div>
          </div>

          {order.status === "completed" && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 print:hidden">
              <div className="flex items-center gap-2 text-amber-900">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <p className="text-sm font-semibold">Order completed! How was it? Your review helps other shoppers.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {items.map((i) => (
                  <Link
                    key={i.id}
                    to="/products/$slug"
                    params={{ slug: i.slug }}
                    hash="reviews"
                    className="inline-flex items-center gap-1.5 rounded-md bg-amber-400 px-3 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-300"
                  >
                    <Star className="h-3.5 w-3.5" /> Rate {i.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Compact printable invoice */}
          <div
            id="invoice"
            style={settings.invoice_accent_color ? ({ "--invoice-accent": settings.invoice_accent_color } as React.CSSProperties) : undefined}
            className="relative mt-6 overflow-hidden bg-white text-black print:mt-0 print:shadow-none"
          >
            <div className="invoice-print-block flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                {settings.logo_url ? <img src={settings.logo_url} alt={settings.name || site.name} className="h-11 w-11 shrink-0 object-contain" /> : <div className="grid h-11 w-11 shrink-0 place-items-center bg-slate-100 text-lg font-bold">{(settings.name || site.name).slice(0, 1)}</div>}
                <div className="min-w-0 text-[10px] leading-4 text-slate-500">
                  <div className="text-sm font-bold text-black">{settings.name || site.name}</div>
                  <div>{settings.address || site.address}</div>
                  <div>{settings.email || site.email} · {settings.phone || site.phone}</div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-2xl font-bold tracking-tight text-black">INVOICE</div>
                <div className="font-mono text-[10px] font-semibold text-slate-600">{order.order_no}</div>
                <div className="text-[10px] text-slate-500">Date: {new Date(order.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            <div className={`invoice-print-block mx-5 mt-3 flex items-center gap-2 border-b pb-2 text-xs font-semibold ${isCancelled ? "border-red-200 text-red-700" : paid || cod ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700"}`}>
              {isCancelled ? <XCircle className="h-4 w-4 shrink-0" /> : paid || cod ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Clock className="h-4 w-4 shrink-0" />}
              {isCancelled ? (order.payment_status === "refunded" ? "Order refunded" : "Order cancelled") : paid ? "Payment successful — order confirmed" : cod ? "Order confirmed — cash on delivery" : "Payment is being verified"}
            </div>

            <div className={`invoice-print-block mx-5 mt-3 border-b pb-3 ${isCancelled ? "border-red-200" : "border-slate-200"}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className={`text-[10px] font-bold uppercase tracking-wide ${isCancelled ? "text-red-700" : "text-slate-700"}`}>{isCancelled ? "Order status" : "Order tracking update"}</div>
                <div className="text-[10px] font-bold uppercase text-slate-700">{isCancelled ? (order.payment_status === "refunded" ? "Refunded" : "Cancelled") : order.status}</div>
              </div>
              {isCancelled ? <div className="text-xs font-semibold text-red-700">{order.payment_status === "refunded" ? "This order has been refunded and will not be delivered." : "This order was cancelled and will not be delivered."}</div> : <div className="flex items-start justify-between text-[9px]">
                {deliverySteps.map((step, idx) => { const done = rankOf(order.status) >= rankOf(step.key) || order.status === "completed"; const lineFilled = done && rankOf(order.status) > rankOf(step.key); return <div key={step.key} className="flex flex-1 items-start"><div className="flex min-w-0 flex-col items-center gap-1 text-center"><div className="grid h-6 w-6 place-items-center rounded-full border" style={done ? { borderColor: accentColor, backgroundColor: accentColor, color: "#fff" } : { borderColor: "#cbd5e1", color: "#94a3b8" }}><StepIcon stepKey={step.key} className="h-3 w-3" /></div><span className={done ? "font-semibold text-black" : "text-slate-400"}>{step.label}</span></div>{idx < deliverySteps.length - 1 && <div className="mx-1 mt-3 h-px flex-1" style={lineFilled ? { backgroundColor: accentColor } : { backgroundColor: "#cbd5e1" }} />}</div>; })}
              </div>}
              {(order.courier || order.tracking_number) && <p className="mt-2 text-[10px] text-slate-600">{order.courier} {order.tracking_number && <>· Tracking <strong>{order.tracking_number}</strong></>}{order.tracking_url && <> · <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Track parcel</a></>}</p>}
              {order.delivery_note && <p className="mt-1 text-[10px] text-slate-500">{order.delivery_note}</p>}
            </div>

            <div className="invoice-print-block grid grid-cols-2 gap-5 border-b border-slate-200 px-5 py-3 text-[10px] leading-4">
              <div><div className="font-bold uppercase tracking-wide text-slate-700">From (Seller)</div><div className="mt-1 font-semibold text-black">{settings.name || site.name}</div><div className="text-slate-500">{settings.address || site.address}</div><div className="text-slate-500">{settings.email || site.email} · {settings.phone || site.phone}</div></div>
              <div className="text-right"><div className="font-bold uppercase tracking-wide text-slate-700">Invoice Details</div><div className="mt-1 text-slate-500">Invoice No. <span className="font-semibold text-black">{order.order_no}</span></div><div className="text-slate-500">Payment <span className="font-semibold uppercase text-black">{order.payment_status}</span></div><div className="text-slate-500">Fulfillment <span className="font-semibold capitalize text-black">{order.status}</span></div></div>
            </div>

            <div className="invoice-print-block grid grid-cols-2 gap-5 border-b border-slate-200 px-5 py-3 text-[10px] leading-4">
              <div><div className="font-bold uppercase tracking-wide text-slate-700">Bill To</div><div className="mt-1 font-semibold text-black">{order.customer_name}</div>{order.company && <div className="text-slate-500">{order.company}</div>}<div className="text-slate-500">{order.address1}{order.address2 ? `, ${order.address2}` : ""}</div><div className="text-slate-500">{order.postcode} {order.city}, {order.state}</div><div className="text-slate-500">{order.customer_phone} · {order.customer_email}</div></div>
              <div className="text-right"><div className="font-bold uppercase tracking-wide text-slate-700">Payment Method</div><div className="mt-1 text-black">{cod ? "Cash on delivery" : "Online (FPX / DuitNow QR)"}</div>{order.transaction_id && <div className="text-slate-500">Ref: {order.transaction_id}</div>}</div>
            </div>

            <div className="invoice-print-block px-5 py-3">
              <table className="w-full table-fixed text-[10px]"><thead><tr className="border-b border-slate-300 text-left font-bold uppercase tracking-wide text-slate-700"><th className="w-[58%] py-1.5">Item</th><th className="w-[10%] py-1.5 text-center">Qty</th><th className="w-[16%] py-1.5 text-right">Unit</th><th className="w-[16%] py-1.5 text-right">Total</th></tr></thead><tbody>{items.map((i) => <tr key={i.id} className="border-b border-slate-200"><td className="break-words py-2 pr-2 text-black">{i.name}</td><td className="py-2 text-center">{i.qty}</td><td className="py-2 text-right">{money(i.unit_price, cur)}</td><td className="py-2 text-right font-semibold">{money(i.line_total, cur)}</td></tr>)}</tbody></table>
              <dl className="ml-auto mt-3 w-56 space-y-1 text-[10px]"><div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{money(order.subtotal, cur)}</dd></div>{Number((order as unknown as { discount?: number }).discount ?? 0) > 0 && <div className="flex justify-between text-slate-700"><dt>Discount</dt><dd>−{money((order as unknown as { discount?: number }).discount ?? 0, cur)}</dd></div>}<div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd>{money(order.shipping, cur)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">SST</dt><dd>{money(order.tax, cur)}</dd></div><div className="flex justify-between border-t border-slate-300 pt-1.5 text-sm font-bold"><dt>Total</dt><dd>{money(order.total, cur)}</dd></div></dl>
            </div>
            <div className="invoice-print-block flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-[9px] text-slate-500"><span>{settings.invoice_footer_note || "Thank you for your purchase."}</span><span className="italic">Best regards, {settings.invoice_signature_name || `${site.name} Team`}</span></div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 print:hidden">
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              <Download className="h-4 w-4" /> Download invoice (PDF)
            </button>
            <Link to="/products" className="inline-flex items-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold">Continue shopping</Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground print:hidden">
            Bookmark this page, or look it up anytime at <Link to="/track" className="font-semibold text-primary underline">Track Your Order</Link> using your order number and email.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
