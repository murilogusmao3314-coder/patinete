"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { A, EXTRAS, brl } from "@/lib/config";
import { nxMeta, ttEvento } from "@/lib/rastreamento";

const CHECKOUT_URL = "/checkout";
const PRODUTO_URL = "/";
const IMG = A + "patinete/";
const THUMB: Record<string, string> = { Preto: "p1-thumb.webp", Azul: "p-azul-thumb.webp", Rosa: "p-rosa-thumb.webp", Branco: "p-branco-thumb.webp", Laranja: "p-laranja-thumb.webp" };
const LINHA: Record<number, { preco: number; antigo: number }> = { 1: { preco: 97.9, antigo: 1299.0 }, 2: { preco: 182.0, antigo: 2598.0 } }; // 2 patinetes têm preço de pacote
const UPSELLS = Object.entries(EXTRAS).map(([id, e]) => ({ id, ...e }));
const DESCONTO_EXTRA = 0.15; // 15% em todo o pedido quando leva pelo menos 1 produto extra

const ev = (nome: string, extra: Record<string, unknown> = {}) => ttEvento(nome, extra);

function Svg({ cls, sw = 2, children, size = 24 }: { cls?: string; sw?: number; children: React.ReactNode; size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
      {children}
    </svg>
  );
}

/** Leva os parâmetros de campanha (camp, tk, ttclid...) adiante */
function levar(base: string, extra: Record<string, string>) {
  const u = new URL(base, location.href);
  for (const k in extra) u.searchParams.set(k, extra[k]);
  new URLSearchParams(location.search).forEach((v, k) => {
    if (!u.searchParams.has(k)) u.searchParams.set(k, v);
  });
  return u.toString();
}

export default function Carrinho() {
  const [pronto, setPronto] = useState(false);
  const [corParam, setCorParam] = useState("Padrão");
  const [qtd, setQtd] = useState(1);
  const [extras, setExtras] = useState<Record<number, boolean>>({});
  const [viewers, setViewers] = useState(50);

  const cor = THUMB[corParam] ? corParam : "Preto"; // "Padrão" mostra o modelo Preto

  const c = useMemo(() => {
    const ids = Object.keys(extras).map(Number).filter((k) => extras[k]);
    const linha = LINHA[qtd];
    let soma = linha.preco;
    let antigo = linha.antigo;
    ids.forEach((i) => {
      soma += UPSELLS[i].preco;
      antigo += UPSELLS[i].orig;
    });
    const total = ids.length ? Math.round(soma * (1 - DESCONTO_EXTRA) * 100) / 100 : soma;
    return { itens: qtd + ids.length, linha, total, eco: Math.round((antigo - total) * 100) / 100, ids };
  }, [qtd, extras]);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const cp = q.get("cor") || "Padrão";
    const qt = Number(q.get("qtd")) === 2 ? 2 : 1;
    setCorParam(cp);
    setQtd(qt);
    setViewers(45 + Math.floor(Math.random() * 16)); // "pessoas comprando agora": começa entre 45 e 60 e oscila
    setPronto(true);
    ev("ViewContent", { value: LINHA[qt].preco });
    const t = setInterval(() => setViewers((v) => Math.max(40, Math.min(65, v + Math.floor(Math.random() * 5) - 2))), 8000);
    return () => clearInterval(t);
  }, []);

  function alternarExtra(i: number) {
    const novo = !extras[i];
    setExtras({ ...extras, [i]: novo });
    ev("AddToCart", { value: UPSELLS[i].preco, content_name: UPSELLS[i].nome });
    if (novo) nxMeta("AddToCart", [{ slug: "patinete-extra-" + UPSELLS[i].id, quantidade: 1 }]);
  }

  function compartilhar() {
    const d = { title: document.title, url: location.href };
    if (navigator.share) navigator.share(d).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(d.url).catch(() => {});
  }

  function finalizar() {
    ev("InitiateCheckout", { value: c.total });
    const par: Record<string, string> = { produto: "patinete", cor: corParam, qtd: String(qtd) };
    if (c.ids.length) par.extras = c.ids.map((i) => UPSELLS[i].id).join(",");
    location.href = levar(CHECKOUT_URL, par);
  }

  if (!pronto) return <div className="min-h-screen bg-[#f5f5f5]" />;

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-40">
      <div className="mx-auto max-w-md bg-[#f5f5f5] min-h-screen relative">
        <div className="bg-gradient-to-r from-[#e60023] to-[#ff4d6d] px-4 py-4 flex items-center justify-between sticky top-0 z-20">
          <button className="text-white p-1" aria-label="Voltar" onClick={() => (history.length > 1 ? history.back() : (location.href = PRODUTO_URL))}>
            <Svg cls="lucide lucide-arrow-left w-6 h-6" sw={2.5}>
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </Svg>
          </button>
          <div className="text-center">
            <div className="text-white font-extrabold text-[17px]">Meu Carrinho</div>
            <div className="text-white/80 text-[12px]">
              {c.itens}
              {c.itens === 1 ? " item selecionado" : " itens selecionados"}
            </div>
          </div>
          <button className="text-white p-1" aria-label="Compartilhar" onClick={compartilhar}>
            <Svg cls="lucide lucide-share2 lucide-share-2 w-5 h-5">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
              <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
            </Svg>
          </button>
        </div>

        <div className="bg-white px-4 py-2.5 flex items-center justify-between text-[13px] border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="font-semibold text-gray-800">{viewers} pessoas comprando agora</span>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
            <Svg cls="lucide lucide-truck w-3.5 h-3.5">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
              <path d="M15 18H9" />
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
              <circle cx="17" cy="18" r="2" />
              <circle cx="7" cy="18" r="2" />
            </Svg>
            FRETE GRÁTIS
          </div>
        </div>

        <div className="mx-3 mt-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <span className="absolute top-0 left-0 bg-[#e60023] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded z-10">91% OFF</span>
              <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center mt-3">
                <img alt="Patinete" className="w-full h-full object-contain" width={160} height={160} src={IMG + THUMB[cor]} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14px] font-semibold text-gray-900 leading-snug">Smart Scooter Cross</p>
                <button className="shrink-0 p-1 text-gray-400 hover:text-red-500" aria-label="Remover" onClick={() => (location.href = levar(PRODUTO_URL, {}))}>
                  <Svg cls="lucide lucide-trash2 lucide-trash-2 w-4 h-4">
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </Svg>
                </button>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Cor: {cor}</div>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <span className="text-[17px] font-extrabold text-[#e60023]">{brl(c.linha.preco)}</span>
                  <span className="text-[11px] text-gray-400 line-through ml-1.5">{brl(c.linha.antigo)}</span>
                </div>
                <div className="flex items-center gap-3 border border-gray-200 rounded-full px-3 py-1.5">
                  <button className="text-gray-500 font-bold text-lg leading-none" aria-label="Diminuir" onClick={() => setQtd(1)}>
                    −
                  </button>
                  <span className="text-[15px] font-bold min-w-[16px] text-center">{qtd}</span>
                  <button className="text-[#e60023] font-bold text-lg leading-none" aria-label="Aumentar" onClick={() => setQtd(2)}>
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-3 mt-3 border-2 border-dashed border-[#f5a623] bg-[#fff8e7] rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="font-extrabold text-[15px] text-gray-900">Ganhe 15% OFF em todo o pedido</p>
              <p className="text-[13px] text-gray-600 mt-1">Adicione mais 1 produto abaixo e ganhe 15% de desconto em todo o pedido.</p>
            </div>
          </div>
        </div>

        <div className="mx-3 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold text-[15px] text-gray-900">
              <span className="w-4 h-4 rounded-full bg-[#e60023] text-white flex items-center justify-center text-[10px] font-black">!</span>
              <span>Aproveite e leve também</span>
            </div>
            <span className="text-[12px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+15% OFF</span>
          </div>
          <div className="flex flex-col gap-3">
            {UPSELLS.map((u, i) => {
              const ativo = !!extras[i];
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => alternarExtra(i)}
                  className={"w-full text-left bg-white rounded-2xl border shadow-sm flex items-center gap-3 p-3 relative overflow-hidden transition-all " + (ativo ? "border-[#e60023] ring-1 ring-[#e60023]/30" : "border-gray-100")}
                >
                  <div className="relative shrink-0">
                    <span className="absolute top-0 left-0 bg-[#e60023] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded z-10">{u.off}</span>
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center mt-2 overflow-hidden">
                      <img alt={u.nome} className="w-full h-full object-contain" width={160} height={160} src={IMG + u.img} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-2">{u.nome}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[15px] font-extrabold text-[#e60023]">{brl(u.preco)}</span>
                      <span className="text-[11px] text-gray-400 line-through">{brl(u.orig)}</span>
                    </div>
                  </div>
                  <div className={"w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md transition " + (ativo ? "bg-[#00b37e]" : "bg-[#e60023]")}>
                    {ativo ? (
                      <Svg cls="lucide lucide-check w-5 h-5 text-white" sw={3}>
                        <path d="M20 6 9 17l-5-5" />
                      </Svg>
                    ) : (
                      <Svg cls="lucide lucide-plus w-5 h-5 text-white" sw={3}>
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                      </Svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-4 pt-3 pb-5 z-20 shadow-[0_-4px_12px_rgba(0,0,0,.08)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[14px] font-bold text-gray-900">
                Total ({c.itens}
                {c.itens === 1 ? " item" : " itens"}):
              </div>
              <div className="text-[12px] text-green-600 font-semibold">Economize {brl(c.eco)}</div>
            </div>
            <div className="text-[26px] font-extrabold text-[#e60023]">{brl(c.total)}</div>
          </div>
          <button className="w-full bg-[#e60023] text-white font-extrabold text-[17px] py-4 rounded-full flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition" onClick={finalizar}>
            <Svg size={20}>
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </Svg>
            Adicionar endereço de entrega
          </button>
        </div>
      </div>
    </div>
  );
}
