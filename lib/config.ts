/* =====================================================================
 * CONFIGURAÇÃO DA LOJA — troque aqui os IDs de rastreamento e preços.
 * ===================================================================== */

/** Pixel do TikTok */
export const TIKTOK_PIXEL = "D6DOUEBC77U3BV5J70MG";

/** Microsoft Clarity */
export const CLARITY_ID = "yqx5fl6s45";

/** Xtracky (rastreamento do checkout) */
export const XTRACKY_TOKEN = "a85ba067-d9d7-45a2-b9aa-6415241787a0";

/** Prefixo das rotas da API interna (app/api/v1) */
export const API = "/api/v1";

/** Pasta das imagens (public/assets) */
export const A = "/assets/";

/** Nome do produto */
export const NOME = "Patinete Elétrico VoltRide Cross Pro 500W";
export const NOME_CURTO = "Smart Scooter Cross";

/** Preços da oferta */
export const PRECO = 97.9;
export const PRECO_ORIG = 1299.0;
export const PAR_2o = 84.1; // 2º patinete
export const PRECO_OFERTA = 67.65; // oferta de saída do checkout
export const PAR_2o_OFERTA = 33.83;

/** Catálogo usado pelo servidor e pelos eventos de pixel (slug -> preço) */
export const PRECOS: Record<string, number> = {
  "patinete-cross-pro-1un": 97.9,
  "patinete-cross-pro-2un": 182.0,
  "patinete-cross-pro-1un-combo": 83.22,
  "patinete-cross-pro-2un-combo": 154.7,
  "patinete-cross-pro-1un-oferta": 67.65,
  "patinete-cross-pro-2un-oferta": 101.48,
  "patinete-cross-pro-1un-oferta-combo": 57.5,
  "patinete-cross-pro-2un-oferta-combo": 86.26,
  "patinete-extra-scooter-tui": 84.46,
  "patinete-extra-philips-tax4209": 33.91,
  "patinete-extra-jbl-encore": 49.22,
  "patinete-extra-ps5-slim": 76.42,
  "patinete-bump-cadeado": 14.9,
  "patinete-bump-suporte": 12.9,
};

/** Fretes (código enviado ao servidor -> preço) */
export const FRETE_PRECO: Record<string, number> = {
  gratis: 0,
  "patinete-economico": 9.9,
  "patinete-full": 17.9,
};

/** Produtos extras oferecidos no carrinho */
export const EXTRAS: Record<string, { nome: string; img: string; off: string; preco: number; orig: number }> = {
  "scooter-tui": { nome: "Scooter Elétrica TUI 1000W | 2 Lugares | Autonomia 60km", img: "upsell-scooter-tui-thumb.webp", off: "90%", preco: 99.37, orig: 993.7 },
  "philips-tax4209": { nome: "Caixa De Som Philips TAX4209/78 Party Speaker Preto - Bivolt", img: "upsell-philips-speaker-thumb.webp", off: "97%", preco: 39.89, orig: 1329.66 },
  "jbl-encore": { nome: "Caixa De Som JBL PartyBox Encore Essential", img: "upsell-jbl-partybox-thumb.webp", off: "97%", preco: 57.9, orig: 1895.0 },
  "ps5-slim": { nome: "PS5 Slim Digital Edition 825GB Console PlayStation 5", img: "upsell-ps5-slim-thumb.webp", off: "95%", preco: 89.9, orig: 1997.5 },
};

/** Miniaturas por cor */
export const THUMB: Record<string, string> = {
  Padrão: "p1-thumb.webp",
  Preto: "p1-thumb.webp",
  Azul: "p-azul-thumb.webp",
  Rosa: "p-rosa-thumb.webp",
  Branco: "p-branco-thumb.webp",
  Laranja: "p-laranja-thumb.webp",
  "Cinza Grafite": "p-cinza-thumb.webp",
  "Vermelho Racing": "p-vermelho-thumb.webp",
};

export function brl(v: number) {
  return "R$ " + v.toFixed(2).replace(".", ",");
}
export function r2(n: number) {
  return Math.round(n * 100) / 100;
}
