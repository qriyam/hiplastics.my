import { RouteError } from "@/components/RouteError";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, Loader2, Package, CheckCircle2, XCircle, Clock, Star, MapPin } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { RatingStars } from "@/components/RatingStars";
import { useAuth } from "@/lib/auth";
import { myOrders, retryPayment, listSavedAddresses, saveAddress, deleteAddress, type OrderRow, type SavedAddress } from "@/lib/shop.functions";
import { myReviews, updateReview } from "@/lib/reviews.functions";
import { money } from "@/lib/cart";
import { site } from "@/lib/site";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: `My Account | ${site.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: ({ error }) => <RouteError error={error as Error} />,
  component: AccountPage,
});

const STATUS_LABEL: Record<string, string> = {
  new: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

function StatusBadge({ order }: { order: OrderRow }) {
  if (order.payment_status === "refunded")
    return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"><Clock className="h-3 w-3" /> Refunded</span>;
  if (order.status === "cancelled")
    return <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive"><XCircle className="h-3 w-3" /> Cancelled</span>;
  if (order.payment_status === "failed")
    return <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive"><XCircle className="h-3 w-3" /> Payment failed</span>;
  if (order.status === "delivered" || order.status === "completed")
    return <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"><CheckCircle2 className="h-3 w-3" /> {STATUS_LABEL[order.status]}</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground"><Package className="h-3 w-3" /> {STATUS_LABEL[order.status] || order.status}</span>;
}

function AccountPage() {
  const { user, session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const fetchMyOrders = useServerFn(myOrders);
  const retry = useServerFn(retryPayment);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"orders" | "reviews" | "addresses">("orders");
  const [retrying, setRetrying] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { redirect: "/account" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!session?.access_token) return;
    let active = true;
    const loadOrders = async () => {
      const r = await fetchMyOrders({ data: { access_token: session.access_token } });
      if (!active) return;
      if (r.ok) setOrders(r.orders);
      else setErr(r.error);
    };
    const loadAddresses = async () => {
      const r = await listSavedAddresses({ data: { access_token: session.access_token } });
      if (active && r.ok) setAddresses(r.addresses);
    };
    const onFocus = () => { void loadOrders(); };
    const onVisibility = () => { if (document.visibilityState === "visible") void loadOrders(); };
    void loadOrders();
    void loadAddresses();
    const timer = window.setInterval(loadOrders, 30_000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [session?.access_token, fetchMyOrders]);

  if (loading || !user) {
    return (
      <SiteLayout>
        <section className="section-pad flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">My Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-md border border-border p-1">
              <button
                type="button"
                onClick={() => setTab("orders")}
                className={`rounded px-4 py-1.5 text-sm font-semibold transition-colors ${tab === "orders" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                My Orders
              </button>
              <button
                type="button"
                onClick={() => setTab("reviews")}
                className={`rounded px-4 py-1.5 text-sm font-semibold transition-colors ${tab === "reviews" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                My Reviews
              </button>
              <button
                type="button"
                onClick={() => setTab("addresses")}
                className={`rounded px-4 py-1.5 text-sm font-semibold transition-colors ${tab === "addresses" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Addresses
              </button>
            </div>
            <button
              onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>

          {tab === "orders" && (
            <>
              {err && <p className="mt-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}

              {orders === null && !err && (
                <div className="mt-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              )}

              {orders && orders.length === 0 && (
                <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
                  <Link to="/products" className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Browse products</Link>
                </div>
              )}

              {orders && orders.length > 0 && (
                <div className="mt-5 space-y-3">
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
                    >
                      <Link to="/order/$orderNo" params={{ orderNo: o.order_no }} search={{ t: o.access_token }} className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-foreground">{o.order_no}</div>
                          <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge order={o} />
                          <div className="font-bold text-foreground">{money(o.total, o.currency)}</div>
                        </div>
                      </Link>
                      {(o.payment_status === "failed" || o.status === "cancelled") && o.payment_method === "toyyibpay" && <button type="button" disabled={retrying === o.id} onClick={async () => { setRetrying(o.id); const res = await retry({ data: { orderNo: o.order_no, access_token: o.access_token } }); setRetrying(null); if (res.ok) window.location.assign(res.paymentUrl); else setErr(res.error); }} className="mt-3 inline-flex rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60">{retrying === o.id ? "Opening payment…" : "Pay again"}</button>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "reviews" && <MyReviewsPanel accessToken={session?.access_token} />}
          {tab === "addresses" && <SavedAddressesPanel accessToken={session?.access_token} addresses={addresses} onChanged={async () => { if (session?.access_token) { const r = await listSavedAddresses({ data: { access_token: session.access_token } }); if (r.ok) setAddresses(r.addresses); } }} />}
        </div>
      </section>
    </SiteLayout>
  );
}

type AddressForm = Omit<SavedAddress, "id" | "created_at" | "updated_at">;
const emptyAddress: AddressForm = { label: "Home", full_name: "", phone: "", company: "", address1: "", address2: "", city: "", state: "", postcode: "", is_default: false };

function SavedAddressesPanel({ accessToken, addresses, onChanged }: { accessToken?: string; addresses: SavedAddress[] | null; onChanged: () => Promise<void> }) {
  const save = useServerFn(saveAddress);
  const remove = useServerFn(deleteAddress);
  const [form, setForm] = useState<AddressForm>(emptyAddress);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const input = "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

  function edit(address: SavedAddress) {
    setEditingId(address.id);
    setForm({ label: address.label, full_name: address.full_name, phone: address.phone, company: address.company, address1: address.address1, address2: address.address2, city: address.city, state: address.state, postcode: address.postcode, is_default: address.is_default });
    setErr(null);
  }
  function reset() { setEditingId(null); setForm(emptyAddress); setErr(null); }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setBusy(true); setErr(null);
    const res = await save({ data: { access_token: accessToken, address: { ...form, id: editingId ?? undefined } } });
    setBusy(false);
    if (!res.ok) { setErr(res.error); return; }
    reset(); await onChanged();
  }
  async function removeAddress(id: string) {
    if (!accessToken || !window.confirm("Delete this saved address?")) return;
    setBusy(true); const res = await remove({ data: { access_token: accessToken, id } }); setBusy(false);
    if (!res.ok) setErr(res.error); else await onChanged();
  }

  return (
    <div className="mt-5 space-y-5">
      <div><h2 className="text-lg font-bold text-foreground">Saved addresses</h2><p className="mt-1 text-sm text-muted-foreground">Save your regular Malaysian delivery addresses for faster checkout.</p></div>
      {err && <p className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}
      <form onSubmit={submit} className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold text-foreground">{editingId ? "Edit address" : "Add an address"}</h3>{editingId && <button type="button" onClick={reset} className="text-sm font-semibold text-primary hover:underline">Cancel</button>}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Label<input required maxLength={60} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={input} placeholder="Home or Office" /></label>
          <label className="text-sm font-medium">Full name<input required maxLength={120} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={input} /></label>
          <label className="text-sm font-medium">Malaysia phone<input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} placeholder="01X XXX XXXX" /></label>
          <label className="text-sm font-medium">Company (optional)<input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={input} /></label>
          <label className="text-sm font-medium sm:col-span-2">Address line 1<input required value={form.address1} onChange={(e) => setForm({ ...form, address1: e.target.value })} className={input} /></label>
          <label className="text-sm font-medium sm:col-span-2">Address line 2 (optional)<input value={form.address2} onChange={(e) => setForm({ ...form, address2: e.target.value })} className={input} /></label>
          <label className="text-sm font-medium">City<input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={input} /></label>
          <label className="text-sm font-medium">State<input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={input} /></label>
          <label className="text-sm font-medium">Postcode<input required pattern="[0-9]{5}" maxLength={5} value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} className={input} /></label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} /> Make this my default address</label>
        <button disabled={busy} className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{editingId ? "Save changes" : "Save address"}</button>
      </form>
      {addresses === null ? <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : addresses.length === 0 ? <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">No saved addresses yet.</div> : <div className="grid gap-3 sm:grid-cols-2">{addresses.map((address) => <div key={address.id} className="rounded-lg border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><div className="font-semibold text-foreground">{address.label}{address.is_default && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">DEFAULT</span>}</div><div className="mt-2 text-sm leading-relaxed text-muted-foreground">{address.full_name}<br />{address.address1}{address.address2 && <><br />{address.address2}</>}<br />{address.postcode} {address.city}, {address.state}<br />{address.phone}</div></div></div></div><div className="mt-3 flex gap-3 text-sm font-semibold"><button type="button" onClick={() => edit(address)} className="text-primary hover:underline">Edit</button><button type="button" disabled={busy} onClick={() => removeAddress(address.id)} className="text-destructive hover:underline disabled:opacity-60">Delete</button></div></div>)}</div>}
    </div>
  );
}

type MyReview = {
  id: string;
  product_slug: string;
  product_name: string;
  product_image: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
};

function MyReviewsPanel({ accessToken }: { accessToken?: string }) {
  const fetchReviews = useServerFn(myReviews);
  const doUpdate = useServerFn(updateReview);
  const [reviews, setReviews] = useState<MyReview[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!accessToken) return;
    const res = await fetchReviews({ data: { access_token: accessToken } });
    if (res.ok) setReviews(res.reviews);
    else setErr(res.error);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  function startEdit(r: MyReview) {
    setEditingId(r.id);
    setRating(r.rating);
    setComment(r.comment);
  }

  async function saveEdit(id: string) {
    if (!accessToken) return;
    setBusy(true);
    const res = await doUpdate({ data: { id, access_token: accessToken, rating, comment: comment || undefined } });
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    setEditingId(null);
    load();
  }

  if (err) return <p className="mt-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{err}</p>;
  if (reviews === null) return <div className="mt-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  if (reviews.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
        <Star className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          You haven't reviewed anything yet — reviews you leave on products will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              {r.product_image && <img src={r.product_image} alt={r.product_name} className="h-12 w-12 rounded-md border border-border object-contain bg-white p-1" />}
              <div>
                <Link to="/products/$slug" params={{ slug: r.product_slug }} className="font-semibold text-foreground hover:text-primary">
                  {r.product_name}
                </Link>
                <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
              </div>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${r.is_approved ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
              {r.is_approved ? "Published" : "Pending approval"}
            </span>
          </div>

          {editingId === r.id ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n === 1 ? "" : "s"}`}>
                    <Star className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                maxLength={2000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  onClick={() => saveEdit(r.id)}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-border px-4 py-2 text-sm font-semibold">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <RatingStars value={r.rating} size="h-4 w-4" />
              {r.comment && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>}
              <button type="button" onClick={() => startEdit(r)} className="mt-3 text-sm font-semibold text-primary hover:underline">
                Edit review
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
