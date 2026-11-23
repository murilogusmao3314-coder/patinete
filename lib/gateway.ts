/* =====================================================================
 * GATEWAY DE PAGAMENTO (PIX)
 *
 * ⚠️  MODO TESTE: ainda não há gateway integrado.
 *     O PIX gerado aqui é só de exemplo (chave fictícia) e NÃO recebe dinheiro.
 *
 * Para integrar o gateway, troque o conteúdo de `criarCobranca` e
 * `consultarPagamento` pelas chamadas da API do seu gateway.
 * O resto do site (checkout, rastreio) não precisa mudar.
 * ===================================================================== */

export const MODO_TESTE = true;

export type Cobranca = {
  /** código "PIX copia e cola" */
  copia_cola: string;
  /** id da transação no gateway (usado para consultar o status) */
  tx_id: string;
  /** imagem do QR Code em base64 (PNG). Se vazio, o site gera o QR a partir do copia e cola */
  qrcode: string;
  valor: number;
};

export type DadosCobranca = {
  codigoPedido: string;
  valor: number;
  cliente: { nome: string; email: string; cpf: string; telefone: string };
};

/** Cria a cobrança PIX. */
export async function criarCobranca(d: DadosCobranca): Promise<Cobranca> {
  // TODO: integrar o gateway aqui
  return {
    copia_cola: pixDeTeste(d.valor, d.codigoPedido),
    tx_id: "teste_" + Date.now().toString(36) + "_" + d.codigoPedido,
    qrcode: "",
    valor: d.valor,
  };
}

/** Diz se a cobrança já foi paga. */
export async function consultarPagamento(txId: string): Promise<boolean> {
  // TODO: integrar o gateway aqui
  const m = /^teste_([a-z0-9]+)_/.exec(txId);
  if (!m) return false;
  return aprovadoNoTeste(parseInt(m[1], 36));
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
