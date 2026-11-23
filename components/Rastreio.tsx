"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/config";

const FRETE_DIAS: Record<string, [number, number]> = { free: [7, 12], economy: [5, 8], express: [3, 5] }; // dias úteis, iguais aos do checkout
const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

type Resp = { codigo: string; status: string; criado_em: string };
type Estado = { tipo: "form"; msg: { erro: boolean; texto: string } | null } | { tipo: "consultando" } | { tipo: "pedido"; r: Resp };

function Svg({ n, cls, children }: { n: string; cls: string; children: React.ReactNode }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={"lucide lucide-" + n + " " + cls} aria-hidden="true">
      {children}
    </svg>
  );
}
const ICO = {
  pacote: (
    <Svg n="package" cls="w-3.5 h-3.5">
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <path d="m7.5 4.27 9 5.15" />
    </Svg>
  ),
  relogio: (
    <Svg n="clock" cls="w-4 h-4 text-emerald-700">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Svg>
  ),
  postado: (
    <Svg n="package-check" cls="w-5 h-5">
      <path d="m16 16 2 2 4-4" />
      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
      <path d="m7.5 4.27 9 5.15" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </Svg>
  ),
  espera: (
    <Svg n="clock" cls="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Svg>
  ),
  entregue: (
    <Svg n="circle-check-big" cls="w-5 h-5">
      <path d="M21.801 10A10 10 0 1 1 17 3.335" />
      <path d="m9 11 3 3L22 4" />
    </Svg>
  ),
  cancelado: (
    <Svg n="circle-x" cls="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </Svg>
  ),
};

function somaUteis(d: Date, n: number) {
  const x = new Date(d.getTime());
  while (n > 0) {
    x.setDate(x.getDate() + 1);
    const w = x.getDay();
    if (w !== 0 && w !== 6) n--;
  }
  return x;
}
const dm = (d: Date) => d.getDate() + " " + MES[d.getMonth()];
function dataHora(iso: string) {
  try {
    const f = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(iso));
    const g: Record<string, string> = {};
    f.forEach((p) => (g[p.type] = p.value));
    return g.day + " " + String(g.month).replace(".", "") + " · " + g.hour + ":" + g.minute;
  } catch {
    return "";
  }
}

function Passo({ icone, tit, texto, data, cls }: { icone: React.ReactNode; tit: string; texto: string; data: string; cls: string }) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      <div className={"relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 bg-white " + cls}>{icone}</div>
      <div className="flex-1 min-w-0 pt-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[14px] font-bold text-gray-900">{tit}</p>
          <span className="text-[9px] font-bold tracking-wider bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">Atual</span>
        </div>
        <p className="text-[12px] mt-0.5 leading-snug text-gray-500">{texto}</p>
        {data && <p className="text-[10px] mt-1 font-semibold text-gray-400 uppercase tracking-wider">{data}</p>}
      </div>
    </li>
  );
}

export default function Rastreio() {
  const [codigo, setCodigo] = useState("");
  const [freteQ, setFreteQ] = useState("");
  const [estado, setEstado] = useState<Estado | null>(null);

  useEffect(() => {
    const Q = new URLSearchParams(location.search);
    const cod = (Q.get("codigo") || "").trim().toUpperCase();
    setCodigo(cod);
    setFreteQ(Q.get("frete") || "");
    if (!cod) return setEstado({ tipo: "form", msg: null });
    setEstado({ tipo: "consultando" });
    fetch(API + "/rastrear?codigo=" + encodeURIComponent(cod), { cache: "no-store" })
      .then((r) => r.json().then((j) => ({ st: r.status, j })))
      .then((x) => {
        if (x.st === 200 && x.j && x.j.status) {
          document.title = "Rastreamento " + x.j.codigo;
          return setEstado({ tipo: "pedido", r: x.j });
        }
        if (x.st === 404) return setEstado({ tipo: "form", msg: { erro: true, texto: "Nenhum pedido encontrado com esse código. Confira e tente de novo." } });
        if (x.st === 429) return setEstado({ tipo: "form", msg: { erro: true, texto: "Muitas consultas seguidas. Aguarde alguns minutos." } });
        setEstado({ tipo: "form", msg: { erro: true, texto: "Informe o código do pedido." } });
      })
      .catch(() => setEstado({ tipo: "form", msg: { erro: true, texto: "Não foi possível consultar agora. Tente novamente em instantes." } }));
  }, []);

  let corpo: React.ReactNode = null;
  if (estado?.tipo === "form") {
    corpo = (
      <>
        {estado.msg ? <p className={"text-[13px] text-center mt-3 " + (estado.msg.erro ? "text-red-600" : "text-gray-500")}>{estado.msg.texto}</p> : <p className="text-xs text-gray-500 text-center mt-1.5">Informe o código do seu pedido.</p>}
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const v = codigo.trim().toUpperCase();
            if (v.length < 4) return;
            location.search = "?codigo=" + encodeURIComponent(v) + (freteQ ? "&frete=" + encodeURIComponent(freteQ) : "");
          }}
        >
          <input
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="Ex.: VR-ABC123"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="w-full h-12 rounded-2xl border-2 border-gray-200 px-4 text-[14px] text-gray-800 outline-none focus:border-[#FF2D55]"
          />
          <button className="w-full h-12 rounded-full bg-[#FF2D55] text-white font-bold text-[14px]">Rastrear</button>
        </form>
      </>
    );
  } else if (estado?.tipo === "consultando") {
    corpo = (
      <>
        <p className="text-xs text-gray-500 text-center mt-1.5">
          Código: <span className="font-bold text-gray-700">{codigo}</span>
        </p>
        <p className="text-[12px] text-gray-400 text-center mt-4">Consultando…</p>
      </>
    );
  } else if (estado?.tipo === "pedido") {
    const r = estado.r;
    const st = r.status;
    const criado = new Date(r.criado_em);
    const dias = FRETE_DIAS[freteQ] || FRETE_DIAS.free;
    const enviado = st === "pago" || st === "separando" || st === "enviado";
    const verde = "text-emerald-600 border-emerald-500 ring-4 ring-emerald-100";
    const quando = "Pedido em " + dataHora(r.criado_em);
    corpo = (
      <>
        <p className="text-xs text-gray-500 text-center mt-1.5">
          Código: <span className="font-bold text-gray-700">{r.codigo}</span>
        </p>
        {enviado && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">{ICO.relogio}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase">Previsão de entrega</p>
              <p className="text-base font-extrabold text-gray-900 mt-0.5">
                {dm(somaUteis(criado, dias[0]))} a {dm(somaUteis(criado, dias[1]))}
              </p>
              <p className="text-[11px] text-gray-600 mt-1 leading-snug">
                Prazo estimado de {dias[0]} a {dias[1]} dias úteis, conforme a forma de entrega escolhida.
              </p>
            </div>
          </div>
        )}
        <ol className="mt-6 relative">
          {enviado ? (
            <Passo icone={ICO.postado} tit="Objeto postado" texto="Pagamento confirmado e pedido liberado para envio." data={quando} cls={verde} />
          ) : st === "entregue" ? (
            <Passo icone={ICO.entregue} tit="Entregue" texto="Seu pedido foi entregue." data="" cls={verde} />
          ) : st === "cancelado" ? (
            <Passo icone={ICO.cancelado} tit="Pedido cancelado" texto="Este pedido foi cancelado. Em caso de dúvida, fale com o atendimento." data={quando} cls="text-red-600 border-red-400 ring-4 ring-red-100" />
          ) : (
            <Passo icone={ICO.espera} tit="Aguardando pagamento" texto="Assim que o pagamento for confirmado, seu pedido segue para envio." data={quando} cls="text-amber-600 border-amber-400 ring-4 ring-amber-100" />
          )}
        </ol>
        <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">As atualizações são exibidas conforme o pedido avança nas etapas de entrega.</p>
        <p className="text-center mt-3">
          <a href="/contato" className="text-[11px] text-blue-600 underline">
            Falar com o atendimento
          </a>
        </p>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans py-6 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full">
              {ICO.pacote}
              Rastreamento de pedido
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 text-center tracking-tight">Acompanhe sua entrega</h1>
          {corpo}
        </div>
      </div>
    </div>
  );
}
