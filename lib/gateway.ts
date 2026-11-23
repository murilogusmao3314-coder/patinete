/* =====================================================================
 * GATEWAY DE PAGAMENTO (PIX) — PinguPag
 * Documentação: https://app.pingupag.com/documentation
 *
 * Configure na Vercel (Settings → Environment Variables):
 *   PINGUPAG_API_KEY   = sua Chave Secreta (portal PinguPag → "Configurações e API")
 *
 * Sem PINGUPAG_API_KEY o site fica em MODO TESTE: o PIX usa uma chave fictícia
 * e NÃO recebe dinheiro.
 * ===================================================================== */

const API_URL = (process.env.PINGUPAG_API_URL || "https://pagamento-processador.org.ua").replace(/\/+$/, "");
const API_KEY = process.env.PINGUPAG_API_KEY || "";

export const MODO_TESTE = !API_KEY;

export type Cobranca = {
  /** código "PIX copia e cola" */
  copia_cola: string;
  /** id da transação no gateway (usado para consultar o status) */
  tx_id: string;
  /** imagem do QR Code em base64 (PNG, sem o prefixo data:). Se vazio, o site gera o QR a partir do copia e cola */
  qrcode: string;
  valor: number;
};

export type DadosCobranca = {
  codigoPedido: string;
  valor: number;
  descricao: string;
  cliente: { nome: string; email: string; cpf: string; telefone: string };
  endereco: { rua: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string; cep: string };
  tracking: Record<string, string | null>;
  /** URL que a PinguPag chama quando o status muda */
  postbackUrl?: string;
  /** dados extras guardados junto da transação (a PinguPag devolve uma cópia na consulta) */
  extra?: Record<string, unknown>;
};

/** Status normalizado: "pago" | "aguardando" | "cancelado" | "reembolsado" */
export type StatusPagamento = { status: "pago" | "aguardando" | "cancelado" | "reembolsado"; bruto: string; criadoEm?: string; dados?: Record<string, unknown> };

async function chamar(caminho: string, init: RequestInit = {}) {
  const r = await fetch(API_URL + caminho, {
    ...init,
    headers: { "X-API-Key": API_KEY, "Content-Type": "application/json", Accept: "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  const texto = await r.text();
  let j: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    j = JSON.parse(texto);
  } catch {}
  if (!r.ok) throw new Error("PinguPag " + r.status + ": " + (j?.message || j?.error || texto.slice(0, 200)));
  return j;
}

function normalizar(bruto: string): StatusPagamento["status"] {
  const s = String(bruto || "").toLowerCase();
  if (s === "approved" || s === "paid") return "pago";
  if (s === "refunded" || s === "chargeback") return "reembolsado";
  if (s === "failed" || s === "refused" || s === "canceled" || s === "cancelled" || s === "expired") return "cancelado";
  return "aguardando"; // pending, processing, under_review
}

/** Cria a cobrança PIX. */
export async function criarCobranca(d: DadosCobranca): Promise<Cobranca> {
  if (MODO_TESTE) {
    return { copia_cola: pixDeTeste(d.valor, d.codigoPedido), tx_id: "teste_" + Date.now().toString(36) + "_" + d.codigoPedido, qrcode: "", valor: d.valor };
  }
  const j = await chamar("/gateway/v1/transaction", {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(d.valor * 100),
      description: d.descricao,
      reference: d.codigoPedido,
      postback_url: d.postbackUrl,
      source: "api_externa",
      customer: {
        name: d.cliente.nome,
        email: d.cliente.email,
        document: d.cliente.cpf.replace(/\D/g, ""),
        phone: d.cliente.telefone.replace(/\D/g, ""),
      },
      address: {
        street: d.endereco.rua,
        number: d.endereco.numero,
        complement: d.endereco.complemento,
        neighborhood: d.endereco.bairro,
        city: d.endereco.cidade,
        state: d.endereco.uf,
        zipcode: d.endereco.cep,
      },
      tracking: d.tracking,
      metadata: d.extra,
    }),
  });
  if (!j || !j.qr_code) throw new Error("PinguPag não devolveu o código PIX: " + JSON.stringify(j).slice(0, 200));
  return {
    copia_cola: String(j.qr_code),
    tx_id: String(j.transaction_id ?? j.id),
    qrcode: String(j.qr_code_base64 || "").replace(/^data:[^,]*,/, ""),
    valor: Number(j.amount) ? Number(j.amount) / 100 : d.valor,
  };
}

/** Consulta o status da cobrança pelo id da transação. */
export async function consultarCobranca(txId: string): Promise<StatusPagamento> {
  if (MODO_TESTE) {
    const m = /^teste_([a-z0-9]+)_/.exec(txId);
    const pago = !!m && aprovadoNoTeste(parseInt(m[1], 36));
    return { status: pago ? "pago" : "aguardando", bruto: pago ? "approved" : "pending" };
  }
  const j = await chamar("/gateway/v1/query?action=get_transaction&id=" + encodeURIComponent(txId));
  return { status: normalizar(j?.status), bruto: String(j?.status || ""), criadoEm: j?.created_at, dados: j || undefined };
}

/** Consulta pela referência (código do pedido). Usado no rastreio. */
export async function consultarPorPedido(codigo: string): Promise<(StatusPagamento & { txId: string }) | null> {
  if (MODO_TESTE) return null;
  const j = await chamar("/gateway/v1/query?action=list_transactions&external_id=" + encodeURIComponent(codigo));
  const lista = Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : Array.isArray(j?.transactions) ? j.transactions : [];
  if (!lista.length) return null;
  // se houver mais de uma tentativa, vale a paga; senão a mais recente
  const t = lista.find((x: { status: string }) => normalizar(x.status) === "pago") || lista[lista.length - 1];
  return { status: normalizar(t.status), bruto: String(t.status), criadoEm: t.created_at, txId: String(t.id) };
}

/** Diz se a cobrança já foi paga. */
export async function consultarPagamento(txId: string): Promise<boolean> {
  return (await consultarCobranca(txId)).status === "pago";
}

/** No modo teste, GATEWAY_TESTE_APROVAR_SEGUNDOS=20 aprova sozinho o PIX depois de 20 s (para testar o fluxo inteiro). */
export function aprovadoNoTeste(criadoEm: number) {
  const s = Number(process.env.GATEWAY_TESTE_APROVAR_SEGUNDOS || 0);
  return s > 0 && Date.now() - criadoEm >= s * 1000;
}

/* ----- PIX de exemplo (formato BR Code válido, chave fictícia) ----- */
function campo(id: string, valor: string) {
  return id + String(valor.length).padStart(2, "0") + valor;
}
function crc16(s: string) {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function pixDeTeste(valor: number, txid: string) {
  const conta = campo("00", "br.gov.bcb.pix") + campo("01", "00000000-0000-0000-0000-000000000000");
  const p =
    campo("00", "01") +
    campo("26", conta) +
    campo("52", "0000") +
    campo("53", "986") +
    campo("54", valor.toFixed(2)) +
    campo("58", "BR") +
    campo("59", "PAGAMENTO DE TESTE") +
    campo("60", "SAO PAULO") +
    campo("62", campo("05", txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***")) +
    "6304";
  return p + crc16(p);
}
