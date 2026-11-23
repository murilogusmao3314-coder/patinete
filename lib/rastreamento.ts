/* Pixels de rastreamento: TikTok, Meta (navegador + API de Conversões pelo servidor) e Xtracky.
 * Uso nas páginas:
 *   ttEvento('AddToCart', { value: 97.9 })
 *   nxMeta('AddToCart', [{ slug: 'patinete-cross-pro-1un', quantidade: 1 }], { email, phone })
 */

import { API, PRECOS, TIKTOK_PIXEL, XTRACKY_TOKEN } from "./config";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    ttq: any;
    TiktokAnalyticsObject: string;
    fbq: any;
    _fbq: any;
    nxMeta?: (nome: string, itens?: Item[], usuario?: Usuario) => void;
    nxMetaCompra?: (codigo: string, valor: number) => void;
    nxMetaCtx?: () => Record<string, string>;
  }
}

export type Item = { slug: string; quantidade?: number };
export type Usuario = { email?: string; phone?: string; name?: string; city?: string; state?: string };

/* ===== TikTok ===== */
let ttIniciado = false;
export function iniciarTikTok() {
  if (ttIniciado || typeof window === "undefined") return;
  ttIniciado = true;
  const w = window as any;
  const t = "ttq";
  w.TiktokAnalyticsObject = t;
  const ttq = (w[t] = w[t] || []);
  ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
  ttq.setAndDefer = function (o: any, e: string) {
    o[e] = function (...args: any[]) {
      o.push([e].concat(args));
    };
  };
  for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
  ttq.load = function (e: string) {
    const n = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i || {};
    ttq._i[e] = [];
    ttq._t = ttq._t || {};
    ttq._t[e] = +new Date();
    ttq._o = ttq._o || {};
    const s = document.createElement("script");
    s.async = true;
    s.src = n + "?sdkid=" + e + "&lib=" + t;
    document.head.appendChild(s);
  };
  ttq.load(TIKTOK_PIXEL);
  ttq.page();
}

/** Evento do TikTok. `base` são os campos padrão de cada página. */
export function ttEvento(nome: string, extra: Record<string, unknown> = {}, base: Record<string, unknown> = {}) {
  try {
    window.ttq.track(nome, { content_type: "product", content_name: "Patinete Elétrico VoltRide Cross Pro", currency: "BRL", ...base, ...extra });
  } catch {}
}

/* ===== Xtracky (só no checkout) ===== */
export function iniciarXtracky() {
  if (document.querySelector("script[data-xtracky]")) return;
  const s = document.createElement("script");
  s.src = "https://cdn.xtracky.com/scripts/experimental.js";
  s.async = true;
  s.setAttribute("data-token", XTRACKY_TOKEN);
  s.setAttribute("data-step-id", "checkout");
  s.setAttribute("data-xtracky", "1");
  document.head.appendChild(s);
}

/* ===== Meta (Facebook) =====
 * O ID do pixel vem de /api/v1/publico/pixels (variável META_PIXEL_ID na Vercel).
 * Cada evento vai duas vezes (navegador e servidor) com o mesmo eventID, e a Meta conta uma só. */
let metaIniciado = false;
export function iniciarMeta() {
  if (metaIniciado || typeof window === "undefined") return;
  metaIniciado = true;

  const ler = (k: string) => {
    try {
      return localStorage.getItem(k) || "";
    } catch {
      return "";
    }
  };
  const gravar = (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  };
  const cookie = (n: string) => {
    const m = document.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : "";
  };
  const aleatorio = (n: number) => {
    const a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return Array.from(a, (b) => ("0" + b.toString(16)).slice(-2)).join("");
  };

  let externalId = ler("nx_eid");
  if (!/^[A-Za-z0-9._:-]{16,100}$/.test(externalId)) {
    externalId = "nx." + aleatorio(12);
    gravar("nx_eid", externalId);
  }
  const fbclid = new URLSearchParams(location.search).get("fbclid");
  if (fbclid && /^[A-Za-z0-9._-]{1,200}$/.test(fbclid)) gravar("nx_fbc", "fb.1." + Date.now() + "." + fbclid);

  const contexto = () => ({
    fbp: cookie("_fbp").slice(0, 250),
    fbc: ler("nx_fbc").slice(0, 250),
    external_id: externalId,
    referrer_url: String(document.referrer || "").split("#")[0].slice(0, 500),
  });
  window.nxMetaCtx = contexto;

  // carrega o fbevents.js
  const w = window as any;
  if (!w.fbq) {
    const n: any = (w.fbq = function (...args: any[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    });
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }

  const sha256 = (txt: string): Promise<string> => {
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) return Promise.resolve("");
    return crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(txt))
      .then((b) => Array.from(new Uint8Array(b), (x) => ("0" + x.toString(16)).slice(-2)).join(""))
      .catch(() => "");
  };
  const limpo = (v: string) =>
    String(v || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]/g, "");
  const hashes = (u: Usuario = {}) => {
    const p: Record<string, string> = {};
    const jobs: Promise<void>[] = [];
    const add = (k: string, v: string) => {
      if (v) jobs.push(sha256(v).then((h) => void (h && (p[k] = h))));
    };
    if (u.email) add("em", String(u.email).trim().toLowerCase());
    if (u.phone) {
      const d = String(u.phone).replace(/\D/g, "");
      if (d.length >= 10) add("ph", d.length <= 11 ? "55" + d : d);
    }
    if (u.name) {
      const partes = String(u.name).trim().split(/\s+/);
      add("fn", limpo(partes[0]));
      if (partes.length > 1) add("ln", limpo(partes[partes.length - 1]));
    }
    if (u.city) add("ct", limpo(u.city));
    if (u.state) add("st", limpo(u.state));
    return Promise.all(jobs).then(() => p);
  };

  const enviar = (nome: string, itens: Item[] | undefined, usuario: Usuario | undefined, eventId: string, tempo: number) => {
    const corpo: any = { event_name: nome, event_id: eventId, event_time: tempo, caminho: location.pathname || "/", meta: contexto() };
    if (itens && itens.length) corpo.itens = itens.map((i) => ({ slug: i.slug, quantidade: i.quantidade || 1 }));
    hashes(usuario).then((h) => {
      Object.assign(corpo.meta, h);
      try {
        fetch(API + "/publico/evento-meta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo), keepalive: true }).catch(() => {});
      } catch {}
    });
  };

  let pronto = false;
  let pixelId = "";
  const fila: any[] = [];

  const disparar = (nome: string, itens?: Item[], usuario?: Usuario) => {
    const eventId = "nx-" + nome.toLowerCase() + "-" + Date.now().toString(36) + "-" + aleatorio(6);
    const tempo = Math.floor(Date.now() / 1000);
    if (pixelId && w.fbq) {
      let dados = {};
      if (itens && itens.length) {
        let v = 0;
        itens.forEach((i) => (v += (PRECOS[i.slug] || 0) * (i.quantidade || 1)));
        dados = { content_type: "product", content_ids: itens.map((i) => i.slug), value: Math.round(v * 100) / 100, currency: "BRL" };
      }
      try {
        w.fbq("track", nome, dados, { eventID: eventId });
      } catch {}
    }
    enviar(nome, itens, usuario, eventId, tempo);
  };

  window.nxMetaCompra = (codigo, valor) => {
    if (!pronto) {
      fila.push(["compra", codigo, valor]);
      return;
    }
    if (pixelId && w.fbq && codigo) {
      try {
        w.fbq("track", "Purchase", { value: Number(valor) || 0, currency: "BRL", content_type: "product" }, { eventID: codigo });
      } catch {}
    }
  };
  window.nxMeta = (nome, itens, usuario) => {
    if (!pronto) {
      fila.push([nome, itens, usuario]);
      return;
    }
    disparar(nome, itens, usuario);
  };

  const iniciar = (id: string) => {
    pixelId = /^\d{6,24}$/.test(id || "") ? id : "";
    if (pixelId && w.fbq) w.fbq("init", pixelId);
    pronto = true;
    disparar("PageView");
    fila.splice(0).forEach((x) => (x[0] === "compra" ? window.nxMetaCompra!(x[1], x[2]) : disparar(x[0], x[1], x[2])));
  };
  let ja = false;
  const uma = (id: string) => {
    if (ja) return;
    ja = true;
    iniciar(id);
  };
  try {
    fetch(API + "/publico/pixels", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => uma(j && j.pixels && j.pixels.meta_pixel_id))
      .catch(() => uma(""));
    setTimeout(() => uma(""), 4000);
  } catch {
    uma("");
  }
}

export function nxMeta(nome: string, itens?: Item[], usuario?: Usuario) {
  if (window.nxMeta) window.nxMeta(nome, itens, usuario);
}
