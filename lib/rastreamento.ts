/* Pixels de rastreamento: TikTok e Xtracky.
 * Uso nas páginas:  ttEvento('AddToCart', { value: 97.9 })
 */
import { TIKTOK_PIXEL, XTRACKY_TOKEN } from "./config";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    ttq: any;
    TiktokAnalyticsObject: string;
  }
}

export type Item = { slug: string; quantidade?: number };

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
