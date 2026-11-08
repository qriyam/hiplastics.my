/**
 * Branded transactional email templates sent through Resend.
 * Configure RESEND_API_KEY and ORDER_EMAIL_FROM in the deployment environment.
 */

type OrderForEmail = {
  order_no: string;
  customer_name: string;
  customer_email: string;
  payment_method: "cod" | "toyyibpay";
  currency: string;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  coupon_code?: string;
  total: number;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  access_token?: string | null;
};

type OrderItemForEmail = { name: string; qty: number; unit_price: number; line_total: number; image_url?: string | null };

type OrderStatusForEmail = {
  order_no: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  currency?: string | null;
  total?: number | null;
  payment_status?: string | null;
  status?: string | null;
  courier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  delivery_note?: string | null;
  access_token?: string | null;
};

const BRAND = "#1f4fd1";
const BRAND_DARK = "#173da7";
const TEXT = "#162033";
const MUTED = "#64748b";
const BORDER = "#dbe3ef";
const SURFACE = "#f4f7fb";

function money(n: number, currency: string) {
  return `${currency} ${Number(n || 0).toFixed(2)}`;
}

function baseUrl() {
  return (process.env.APP_BASE_URL || process.env.PUBLIC_SITE_URL || "https://hiplastics.my").replace(/\/+$/, "");
}

function logoUrl() {
  return process.env.EMAIL_LOGO_URL || `${baseUrl()}/hiplastics-logo.png`;
}

function trackUrl() {
  return `${baseUrl()}/track`;
}

function orderUrl(order: { order_no: string; access_token?: string | null }) {
  return `${baseUrl()}/order/${encodeURIComponent(order.order_no)}${order.access_token ? `?t=${encodeURIComponent(order.access_token)}` : ""}`;
}

function escapeHtml(s: unknown) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function addressHtml(order: { address1?: string | null; address2?: string | null; postcode?: string | null; city?: string | null; state?: string | null }) {
  if (!order.address1) return "Not provided";
  return `${escapeHtml(order.address1)}${order.address2 ? `, ${escapeHtml(order.address2)}` : ""}<br>${escapeHtml(order.postcode || "")} ${escapeHtml(order.city || "")}, ${escapeHtml(order.state || "")}`;
}

function addressText(order: { address1?: string | null; address2?: string | null; postcode?: string | null; city?: string | null; state?: string | null }) {
  return [order.address1, order.address2, [order.postcode, order.city, order.state].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "Not provided";
}

function ctaButton(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;"><tr><td align="center" bgcolor="${BRAND}" style="border-radius:8px;background:${BRAND};"><a href="${escapeHtml(href)}" style="display:inline-block;background:${BRAND};border:1px solid ${BRAND};border-radius:8px;color:#ffffff !important;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;line-height:20px;padding:13px 22px;text-decoration:none;">${escapeHtml(label)}</a></td></tr></table>`;
}

function shell(inner: string, preheader: string) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><style>html,body{width:100%!important;margin:0!important;padding:0!important;}body{overflow-x:hidden!important;word-break:break-word;overflow-wrap:anywhere;}table{max-width:100%;}img{max-width:100%;height:auto;}@media only screen and (max-width:600px){.email-shell{width:100%!important;max-width:100%!important;border-left:0!important;border-right:0!important;border-radius:0!important;}.email-header{padding:16px!important;}.email-content{padding:22px 16px!important;}.email-footer{padding:16px!important;}h1{font-size:24px!important;line-height:30px!important;}}</style></head><body style="width:100%;margin:0;padding:0;background:${SURFACE};font-family:Arial,Helvetica,sans-serif;color:${TEXT};word-break:break-word;overflow-wrap:anywhere;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${SURFACE};"><tr><td align="center" style="padding:16px 8px;"><table class="email-shell" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:760px;background:#ffffff;border:1px solid ${BORDER};border-radius:14px;overflow:hidden;"><tr><td class="email-header" style="background:${BRAND};padding:20px 28px;"><a href="${baseUrl()}" style="text-decoration:none;"><img src="${logoUrl()}" width="52" height="52" alt="Hiplastics Malaysia" style="display:block;width:52px;height:52px;object-fit:contain;border-radius:10px;background:#ffffff;padding:5px;border:0;"></a></td></tr><tr><td class="email-content" style="padding:28px 36px 30px;">${inner}</td></tr><tr><td class="email-footer" style="border-top:1px solid ${BORDER};background:#f8fafc;padding:18px 36px;color:${MUTED};font-size:12px;line-height:18px;"><strong style="color:${TEXT};">Hiplastics Malaysia</strong><br>Retail Display &amp; ESL Accessory Solutions<br><a href="mailto:sales@hiplastics.my" style="color:${BRAND};text-decoration:none;">sales@hiplastics.my</a> · <a href="${trackUrl()}" style="color:${BRAND};text-decoration:none;">Track an order</a><br><span>This is an automated order update. Please reply if you need help.</span></td></tr></table><p style="margin:10px 0 0;color:${MUTED};font-size:11px;line-height:16px;">© ${new Date().getFullYear()} Hiplastics Malaysia</p></td></tr></table></body></html>`;
}

function buildConfirmationHtml(order: OrderForEmail, items: OrderItemForEmail[], kind: "cod" | "paid") {
  const rows = items.map((i) => `<tr><td style="padding:12px 8px 12px 0;border-bottom:1px solid ${BORDER};font-size:14px;line-height:19px;">${escapeHtml(i.name)}</td><td style="padding:12px 4px;border-bottom:1px solid ${BORDER};text-align:center;font-size:14px;">${i.qty}</td><td style="padding:12px 0 12px 8px;border-bottom:1px solid ${BORDER};text-align:right;font-size:14px;white-space:nowrap;">${money(i.line_total, order.currency)}</td></tr>`).join("");
  const paid = kind === "paid";
  const title = paid ? "Payment received — order confirmed" : "Order received — cash on delivery";
  const intro = paid ? "Your online payment was received successfully. We are now preparing your order." : "We have received your order. Payment will be collected on delivery.";
  const html = shell(`<div style="display:inline-block;background:${paid ? "#e9f7ef" : "#eef4ff"};color:${paid ? "#167447" : BRAND};border-radius:999px;padding:7px 12px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.4px;">${paid ? "Payment confirmed" : "Order received"}</div><h1 style="margin:16px 0 6px;font-size:28px;line-height:34px;color:${TEXT};">${title}</h1><p style="margin:0;color:${MUTED};font-size:14px;">Order <strong style="color:${TEXT};">${escapeHtml(order.order_no)}</strong></p><p style="margin:24px 0 8px;font-size:16px;line-height:25px;">Hi ${escapeHtml(order.customer_name)},</p><p style="margin:0;font-size:15px;line-height:24px;color:#334155;">${intro}</p><div style="margin:22px 0;font-size:14px;line-height:24px;"><div style="font-size:16px;font-weight:bold;color:${TEXT};margin-bottom:8px;">Package summary</div><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;"><tr><th align="left" style="padding:7px 0;color:${MUTED};font-size:11px;text-transform:uppercase;">Item</th><th style="padding:7px 0;color:${MUTED};font-size:11px;text-transform:uppercase;">Qty</th><th align="right" style="padding:7px 0;color:${MUTED};font-size:11px;text-transform:uppercase;">Total</th></tr>${rows}</table><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding-top:10px;font-size:14px;"><tr><td style="color:${MUTED};padding:3px 0;">Subtotal</td><td align="right" style="padding:3px 0;">${money(order.subtotal, order.currency)}</td></tr>${order.discount ? `<tr><td style="color:${MUTED};padding:3px 0;">Discount${order.coupon_code ? ` (${escapeHtml(order.coupon_code)})` : ""}</td><td align="right" style="padding:3px 0;">-${money(order.discount, order.currency)}</td></tr>` : ""}<tr><td style="color:${MUTED};padding:3px 0;">Shipping</td><td align="right" style="padding:3px 0;">${money(order.shipping, order.currency)}</td></tr><tr><td style="color:${MUTED};padding:3px 0;">SST</td><td align="right" style="padding:3px 0;">${money(order.tax, order.currency)}</td></tr><tr><td style="border-top:1px solid ${BORDER};padding:10px 0 0;font-size:16px;font-weight:bold;">Total</td><td align="right" style="border-top:1px solid ${BORDER};padding:10px 0 0;color:${BRAND};font-size:16px;font-weight:bold;">${money(order.total, order.currency)}</td></tr></table></div><div style="margin:18px 0;font-size:14px;line-height:22px;"><strong style="color:${TEXT};">Shipping address</strong><br>${addressHtml(order)}</div>${ctaButton(orderUrl(order), "View order status")}<p style="margin:10px 0 0;color:${MUTED};font-size:12px;line-height:18px;">This button opens your order directly. No order number or email entry is required.</p>`, `${title} — order ${order.order_no}`);
  return html;
}

function buildConfirmationText(order: OrderForEmail, items: OrderItemForEmail[], kind: "cod" | "paid") {
  const lines = items.map((i) => `- ${i.name} × ${i.qty}: ${money(i.line_total, order.currency)}`).join("\n");
  return `${kind === "paid" ? "Payment received — order confirmed" : "Order received — cash on delivery"}\nOrder: ${order.order_no}\n\nHi ${order.customer_name},\n\n${kind === "paid" ? "Your online payment was received successfully." : "We have received your order. Payment will be collected on delivery."}\n\nItems:\n${lines}\n\nTotal: ${money(order.total, order.currency)}\nShipping address: ${addressText(order)}\n\nView your order: ${orderUrl(order)}\n\nHiplastics Malaysia\nsales@hiplastics.my`;
}

let warnedOnce = false;

async function sendViaResend(to: string, subject: string, html: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !from) {
    if (!warnedOnce) {
      warnedOnce = true;
      console.warn("[email] RESEND_API_KEY / ORDER_EMAIL_FROM not set — skipping transactional emails.");
    }
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text, reply_to: process.env.ORDER_EMAIL_REPLY_TO || "sales@hiplastics.my" }),
    });
    if (!res.ok) {
      console.error("[email] Resend API error", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] failed to send", e);
    return false;
  }
}

export async function sendOrderConfirmationEmail(order: OrderForEmail, items: OrderItemForEmail[], kind: "cod" | "paid") {
  const subject = kind === "cod" ? `Order ${order.order_no} received — Hiplastics Malaysia` : `Payment confirmed for order ${order.order_no} — Hiplastics Malaysia`;
  await sendViaResend(order.customer_email, subject, buildConfirmationHtml(order, items, kind), buildConfirmationText(order, items, kind));
}

function statusCopy(status: string) {
  const labels: Record<string, { title: string; body: string }> = {
    processing: { title: "Your order is being prepared", body: "Our team has started preparing your order." },
    shipped: { title: "Your order has shipped", body: "Your order is on its way." },
    delivered: { title: "Your order has been delivered", body: "Your order has arrived — we hope you love it!" },
    completed: { title: "Your order is complete", body: "Thank you for shopping with Hiplastics Malaysia." },
    cancelled: { title: "Your order was cancelled", body: "This order has been cancelled and will not be delivered." },
  };
  return labels[status] || { title: "Your order status was updated", body: "Your order details have been updated." };
}

function statusItemsHtml(items: OrderItemForEmail[], currency: string) {
  if (!items.length) return "";
  return `<div style="margin:24px 0 0;border-top:1px solid ${BORDER};padding-top:18px;"><div style="font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;color:${BRAND};margin-bottom:12px;">Order items</div>${items.map((item) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;"><tr><td width="58" valign="top">${item.image_url ? `<img src="${escapeHtml(item.image_url)}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;object-fit:contain;border:1px solid ${BORDER};border-radius:8px;background:#ffffff;">` : `<div style="width:48px;height:48px;border:1px solid ${BORDER};border-radius:8px;background:#f8fafc;"></div>`}</td><td valign="top" style="padding-left:12px;font-size:14px;line-height:20px;"><strong>${escapeHtml(item.name)}</strong><br><span style="color:${MUTED};">Qty ${item.qty} · ${money(item.unit_price, currency)} each</span></td><td align="right" valign="top" style="font-size:14px;font-weight:bold;white-space:nowrap;">${money(item.line_total, currency)}</td></tr></table>`).join("")}</div>`;
}

export async function sendOrderStatusEmail(order: OrderStatusForEmail, status: "processing" | "shipped" | "delivered" | "completed" | "cancelled" | "refunded" | "failed", items: OrderItemForEmail[] = []) {
  const normalized = status === "refunded" || status === "failed" ? "cancelled" : status;
  const copy = statusCopy(normalized);
  const currency = order.currency || "MYR";
  const tracking = order.courier || order.tracking_number ? `<div style="margin:20px 0;font-size:14px;line-height:23px;"><strong style="color:${BRAND};">Delivery details</strong><br>${order.courier ? `Courier: <strong>${escapeHtml(order.courier)}</strong><br>` : ""}${order.tracking_number ? `Tracking number: <strong>${escapeHtml(order.tracking_number)}</strong>` : ""}${order.delivery_note ? `<br><span style="color:${MUTED};">${escapeHtml(order.delivery_note)}</span>` : ""}</div>` : "";
  const html = shell(`<div style="display:inline-block;background:${normalized === "cancelled" ? "#fff1f2" : "#e9f7ef"};color:${normalized === "cancelled" ? "#b42318" : "#167447"};border-radius:999px;padding:7px 12px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.4px;">${escapeHtml(normalized)}</div><h1 style="margin:16px 0 6px;font-size:28px;line-height:34px;color:${TEXT};">${copy.title}</h1><p style="margin:0;color:${MUTED};font-size:14px;">Order <strong style="color:${TEXT};">${escapeHtml(order.order_no)}</strong></p><p style="margin:24px 0 8px;font-size:16px;line-height:25px;">Hi ${escapeHtml(order.customer_name)},</p><p style="margin:0;font-size:15px;line-height:24px;color:#334155;">${copy.body}</p>${statusItemsHtml(items, currency)}<div style="margin:20px 0;font-size:14px;line-height:23px;"><strong style="display:block;color:${TEXT};font-size:16px;margin-bottom:6px;">Package summary</strong><br>${items.length ? `Total items: <strong>${items.reduce((sum, item) => sum + Number(item.qty || 0), 0)}</strong><br>` : ""}${order.total != null ? `Order total: <strong>${money(order.total, currency)}</strong><br>` : ""}Payment status: <strong>${escapeHtml(order.payment_status || "updated")}</strong><br>Current order status: <strong>${escapeHtml(order.status || normalized)}</strong></div>${tracking}${order.address1 ? `<div style="margin:18px 0;font-size:14px;line-height:22px;"><strong style="color:${TEXT};">Shipping address</strong><br>${addressHtml(order)}</div>` : ""}<div style="margin:22px 0 8px;border-top:1px solid ${BORDER};padding-top:18px;font-size:13px;color:${MUTED};"><strong style="color:${TEXT};">Need help?</strong><br>Reply to this email or contact <a href="mailto:sales@hiplastics.my" style="color:${BRAND};text-decoration:none;">sales@hiplastics.my</a>.</div>${ctaButton(order.tracking_url || orderUrl(order), order.tracking_url ? "Track shipment" : "View order status")}<p style="margin:10px 0 0;color:${MUTED};font-size:12px;line-height:18px;">This button opens your order directly. No order number or email entry is required.</p>`, `${copy.title} — order ${order.order_no}`);
  const text = `${copy.title}\nOrder: ${order.order_no}\n\nHi ${order.customer_name},\n\n${copy.body}\n\nPayment status: ${order.payment_status || "updated"}\nOrder status: ${order.status || normalized}\n${order.total != null ? `Total: ${money(order.total, currency)}\n` : ""}${order.tracking_number ? `Tracking: ${order.courier || ""} ${order.tracking_number}\n` : ""}\nView your order: ${order.tracking_url || orderUrl(order)}\n\nHiplastics Malaysia\nsales@hiplastics.my`;
  await sendViaResend(order.customer_email, `${copy.title} — ${order.order_no} — Hiplastics Malaysia`, html, text);
}

export async function sendLowStockAlertEmail(product: { name: string; slug: string; stock: number }) {
  const to = process.env.ADMIN_ALERT_EMAIL || "sales@hiplastics.my";
  const html = shell(`<h1 style="margin:0 0 10px;font-size:26px;color:${TEXT};">Low stock alert</h1><p style="font-size:16px;line-height:24px;"><strong>${escapeHtml(product.name)}</strong> has only <strong>${product.stock}</strong> unit(s) left.</p>${ctaButton(`${baseUrl()}/admin`, "Open admin panel")}`, `Low stock alert for ${product.name}`);
  await sendViaResend(to, `Low stock: ${product.name} (${product.stock} left) — Hiplastics Malaysia`, html, `Low stock alert\n${product.name} (${product.slug}) has ${product.stock} unit(s) left.\nOpen admin panel: ${baseUrl()}/admin`);
}

export async function sendCancelledPaymentAlert(order: { order_no: string; total: number; currency: string; transaction_id?: string }) {
  const to = process.env.ADMIN_ALERT_EMAIL || "sales@hiplastics.my";
  const html = shell(`<div style="display:inline-block;background:#fff1f2;color:#b42318;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:bold;text-transform:uppercase;">Action required</div><h1 style="margin:16px 0 10px;font-size:26px;color:${TEXT};">Payment received after cancellation</h1><p style="font-size:15px;line-height:24px;">Order <strong>${escapeHtml(order.order_no)}</strong> is cancelled but ToyyibPay reports a successful payment.</p><div style="margin:18px 0;padding:15px;border:1px solid ${BORDER};border-radius:10px;line-height:24px;">Expected total: <strong>${money(order.total, order.currency)}</strong><br>Transaction: <strong>${escapeHtml(order.transaction_id || "—")}</strong></div>${ctaButton(`${baseUrl()}/admin`, "Review in admin panel")}`, `Action required: paid cancelled order ${order.order_no}`);
  await sendViaResend(to, `Action required: paid cancelled order ${order.order_no} — Hiplastics Malaysia`, html, `Payment received after cancellation. Order ${order.order_no}; total ${money(order.total, order.currency)}; transaction ${order.transaction_id || "—"}. Review: ${baseUrl()}/admin`);
}

export async function sendBackInStockEmail(to: string, product: { name: string; slug: string }) {
  const url = `${baseUrl()}/products/${product.slug}`;
  const html = shell(`<div style="display:inline-block;background:#e9f7ef;color:#167447;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:bold;text-transform:uppercase;">Back in stock</div><h1 style="margin:16px 0 10px;font-size:26px;color:${TEXT};">Good news — it is available again</h1><p style="font-size:15px;line-height:24px;"><strong>${escapeHtml(product.name)}</strong> is back in stock.</p>${ctaButton(url, "View product")}`, `${product.name} is back in stock`);
  await sendViaResend(to, `${product.name} is back in stock — Hiplastics Malaysia`, html, `${product.name} is back in stock. View it here: ${url}`);
}

export async function sendCartReminderEmail(to: string, name: string, items: { name: string; qty: number }[]) {
  const lines = items.map((i) => `- ${i.name} × ${i.qty}`).join("\n");
  const html = shell(`<h1 style="margin:0 0 10px;font-size:26px;color:${TEXT};">You left something in your cart</h1><p style="font-size:16px;line-height:24px;">Hi ${escapeHtml(name || "there")},</p><p style="font-size:15px;line-height:24px;">These items are still waiting for you:</p><div style="margin:18px 0;padding:15px;border:1px solid ${BORDER};border-radius:10px;background:#f8fafc;font-size:14px;line-height:26px;">${items.map((i) => `${escapeHtml(i.name)} × ${i.qty}`).join("<br>")}</div>${ctaButton(`${baseUrl()}/cart`, "Complete your order")}`, "You left something in your Hiplastics cart");
  await sendViaResend(to, "You left something in your cart — Hiplastics Malaysia", html, `You left something in your cart:\n${lines}\n\nComplete your order: ${baseUrl()}/cart`);
}
