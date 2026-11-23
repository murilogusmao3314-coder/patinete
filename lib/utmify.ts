/* =====================================================================
 * UTMIFY — envio das vendas (PIX gerado e PIX pago)
 * Documentação: https://docs.utmify.com.br
 *
 * Configure na Vercel:  UTMIFY_API_TOKEN = credencial de API da Utmify
 * (Utmify → Integrações → Webhooks → Credenciais de API)
 * Sem o token, nada é enviado.
 * ===================================================================== */

const TOKEN = process.env.UTMIFY_API_TOKEN || "";
const URL_API = process.env.UTMIFY_API_URL || "https://api.utmify.com.br/api-credentials/orders";
const PLATAFORMA = "VoltRide";

export type ProdutoUtmify = { id: string; name: string; quantity: number; priceInCents: number };

/** Dados do pedido guardados junto da transação, para montar o envio de "pago" depois */
export type PedidoUtmify = {
  orderId: string;
  createdAt: string; // "YYYY-MM-DD HH:MM:SS" em UTC
  totalInCents: number;
  customer: { name: string; email: string; phone: string | null; document: string | null; ip?: string };
  products: ProdutoUtmify[];
  tracking: TrackingUtmify;
};
export type TrackingUtmify = { src: string | null; sck: string | null; utm_source: string | null; utm_campaign: string | null; utm_medium: string | null; utm_content: string | null; utm_term: string | null };

/** Data no formato da Utmify, em UTC */
export function dataUtc(d = new Date()) {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

/** Pega src, sck e utm_* dos parâmetros da URL do checkout */
export function trackingDe(origem: Record<string, string> = {}): TrackingUtmify {
  const v = (k: string) => (origem[k] ? String(origem[k]).slice(0, 300) : null);
  return { src: v("src"), sck: v("sck"), utm_source: v("utm_source"), utm_campaign: v("utm_campaign"), utm_medium: v("utm_medium"), utm_content: v("utm_content"), utm_term: v("utm_term") };
}

export async function enviarUtmify(p: PedidoUtmify, status: "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback", quando?: string) {
  if (!TOKEN) return;
  const agora = quando || dataUtc();
  const corpo = {
    orderId: p.orderId,
    platform: PLATAFORMA,
    paymentMethod: "pix",
    status,
    createdAt: p.createdAt,
    approvedDate: status === "paid" || status === "refunded" || status === "chargedback" ? agora : null,
    refundedAt: status === "refunded" || status === "chargedback" ? agora : null,
    customer: { ...p.customer, country: "BR" },
    products: p.products.map((x) => ({ ...x, planId: null, planName: null })),
    trackingParameters: p.tracking,
    commission: { totalPriceInCents: p.totalInCents, gatewayFeeInCents: 0, userCommissionInCents: p.totalInCents },
  };
  try {
    const r = await fetch(URL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-token": TOKEN },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) console.error("Utmify", r.status, (await r.text()).slice(0, 300));
  } catch (e) {
    console.error("Utmify falhou", e);
  }
}
