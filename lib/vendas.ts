/* Liga o gateway (PinguPag) com a Utmify sem precisar de banco de dados:
 * os dados da venda vão junto da transação (campo "metadata") e voltam na consulta. */
import { consultarCobranca } from "./gateway";
import { PedidoUtmify, dataUtc, enviarUtmify } from "./utmify";

/** Consulta a transação e, se mudou para pago/reembolsado/recusado, avisa a Utmify. Devolve o status. */
export async function sincronizarVenda(txId: string) {
  const st = await consultarCobranca(txId);
  if (st.status === "aguardando") return st;
  const pedido = pedidoDaTransacao(st.dados);
  if (pedido) {
    const s = st.status === "pago" ? "paid" : st.status === "reembolsado" ? (st.bruto === "chargeback" ? "chargedback" : "refunded") : "refused";
    await enviarUtmify(pedido, s, dataUtc());
  }
  return st;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function pedidoDaTransacao(dados: Record<string, unknown> | undefined): PedidoUtmify | null {
  if (!dados) return null;
  const d = dados as any;
  const copia = typeof d.customer_data === "string" ? tentarJson(d.customer_data) : d.customer_data;
  const salvo = copia?.metadata?.utmify || d.metadata?.utmify;
  if (salvo && salvo.orderId) return salvo as PedidoUtmify;
  // sem os dados guardados: monta o básico com o que a PinguPag devolve
  const c = copia?.customer || {};
  const total = Number(d.amount) || 0;
  if (!total || !d.external_id) return null;
  return {
    orderId: String(d.external_id),
    createdAt: d.created_at ? dataUtc(new Date(String(d.created_at).replace(" ", "T") + "-03:00")) : dataUtc(),
    totalInCents: total,
    customer: { name: c.name || "", email: c.email || "", phone: c.phone || null, document: c.document || null },
    products: [{ id: "patinete", name: copia?.description || "Patinete Elétrico VoltRide Cross Pro", quantity: 1, priceInCents: total }],
    tracking: { src: null, sck: null, utm_source: null, utm_campaign: null, utm_medium: null, utm_content: null, utm_term: null, ...(copia?.tracking || {}) },
  };
}
function tentarJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
