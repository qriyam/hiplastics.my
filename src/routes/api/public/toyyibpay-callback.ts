import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/toyyibpay-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { applyCallback } = await import("@/lib/shop.server");
        const text = await request.text();
        const params = new URLSearchParams(text);
        const payload = {
          refno: params.get("refno") ?? "",
          status: params.get("status") ?? "",
          billcode: params.get("billcode") ?? "",
          order_id: params.get("order_id") ?? "",
          transaction_id: params.get("transaction_id") ?? "",
          amount: params.get("amount") ?? "",
          hash: params.get("hash") ?? "",
        };
        if (!payload.order_id || !payload.billcode) return new Response("bad request", { status: 400 });
        try {
          const result = await applyCallback(payload);
          if (!result.ok) return new Response(result.reason || "invalid callback", { status: 400 });
        } catch {
          return new Response("error", { status: 500 });
        }
        return new Response("OK");
      },
      GET: async () => new Response("OK"),
    },
  },
});
