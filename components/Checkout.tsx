"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { A, API, EXTRAS, NOME, NOME_CURTO, PAR_2o as PAR_2o_NORMAL, PAR_2o_OFERTA, PRECO as PRECO_NORMAL, PRECO_OFERTA, PRECO_ORIG, THUMB, brl, r2 } from "@/lib/config";
import { iniciarXtracky, ttEvento, type Item } from "@/lib/rastreamento";

const CARRINHO_URL = "/carrinho";

const BUMPS = [
  { key: "cadeado", nome: "Cadeado Antifurto com Senha", preco: 14.9, orig: 39.9, img: "patinete/bump-cadeado.jpg" },
  { key: "suporte", nome: "Suporte de Celular para Guidão", preco: 12.9, orig: 34.9, img: "patinete/bump-suporte-celular.jpg" },
];
type FreteKey = "free" | "economy" | "express";
const FRETES: Record<FreteKey, { nome: string; prazo: string; preco: number; logo: string; cls: string; alt: string }> = {
  free: { nome: "Frete Grátis", prazo: "7 a 12 dias úteis", preco: 0, logo: "correios-logo.webp", cls: "w-16 h-16", alt: "Correios" },
  economy: { nome: "Envio Econômico", prazo: "5 a 8 dias úteis", preco: 9.9, logo: "jadlog-logo.png", cls: "w-16 h-14", alt: "Jadlog" },
  express: { nome: "Envio Full", prazo: "3 a 5 dias úteis", preco: 17.9, logo: "full-logo-green.png", cls: "w-14 h-14", alt: "Envio Full" },
};
const FRETE_COD: Record<FreteKey, string> = { free: "gratis", economy: "patinete-economico", express: "patinete-full" };
const BRINDES = [
  { nome: "Capacete Esportivo Premium – Proteção Reforçada", orig: 189.9, img: "patinete/brinde-capacete.jpg" },
  { nome: "Cadeado U-Lock Antifurto com 2 Chaves de Segurança", orig: 129.9, img: "patinete/brinde-cadeado.jpg" },
];
const CORES_OFERTA: [string, string][] = [
  ["Preto Padrão", "p1-thumb.webp"],
  ["Cinza Grafite", "p-cinza-thumb.webp"],
  ["Vermelho Racing", "p-vermelho-thumb.webp"],
  ["Azul", "p-azul-thumb.webp"],
  ["Rosa", "p-rosa-thumb.webp"],
  ["Branco", "p-branco-thumb.webp"],
  ["Laranja", "p-laranja-thumb.webp"],
];
const AVISO_SAIR = "Tem certeza que quer sair? Você vai perder sua super oferta exclusiva!";

type Dados = { name: string; cpf: string; email: string; phone: string; cep: string; address: string; number: string; complement: string; neighborhood: string; city: string; state: string };
type Pix = { pixCode: string; transactionId: string; createdAt: number; qr: string; valor: number; codigo: string };
type Toast = { id: number; titulo: string; desc?: string; erro?: boolean };

const VAZIO: Dados = { name: "", cpf: "", email: "", phone: "", cep: "", address: "", number: "", complement: "", neighborhood: "", city: "", state: "" };

const ev = (nome: string, extra: Record<string, unknown> = {}) => ttEvento(nome, extra, { content_id: "patinete", content_name: NOME_CURTO });

/* ===== Ícones (lucide) ===== */
const P: Record<string, React.ReactNode> = {
  "arrow-left": (<><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>),
  user: (<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  "file-text": (<><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></>),
  mail: (<><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /><rect x="2" y="4" width="20" height="16" rx="2" /></>),
  phone: <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />,
  "map-pin": (<><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></>),
  lock: (<><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>),
  "rotate-ccw": (<><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>),
  truck: (<><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></>),
  shield: <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
  check: <path d="M20 6 9 17l-5-5" />,
  clock: (<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>),
  gift: (<><rect x="3" y="7" width="18" height="4" rx="1" /><path d="M12 7v14" /><path d="M19 11v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8" /><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" /></>),
  copy: (<><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>),
  "circle-check-big": (<><path d="M21.801 10A10 10 0 1 1 17 3.335" /><path d="m9 11 3 3L22 4" /></>),
  camera: (<><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" /><circle cx="12" cy="13" r="3" /></>),
  star: <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />,
  "credit-card": (<><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></>),
};
function I({ n, cls = "", sw = 2, fill = "none", style }: { n: string; cls?: string; sw?: number; fill?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={"lucide lucide-" + n + " " + cls} style={style} aria-hidden="true">
      {P[n]}
    </svg>
  );
}

/* ===== Máscaras ===== */
function mCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
function mTel(v: string) {
  const t = v.replace(/\D/g, "").slice(0, 11);
  return t.length <= 2 ? "(" + t : t.length <= 7 ? "(" + t.slice(0, 2) + ") " + t.slice(2) : "(" + t.slice(0, 2) + ") " + t.slice(2, 7) + "-" + t.slice(7);
}
function mCep(v: string) {
  const t = v.replace(/\D/g, "").slice(0, 8);
  return t.length <= 5 ? t : t.slice(0, 5) + "-" + t.slice(5);
}

/** O nome do recebedor vem de dentro do próprio PIX (campo 59 do código), o mesmo que o app do banco mostra ao ler o QR */
function nomeNoPix(codigo: string) {
  try {
    let i = 0;
    const campos: Record<string, string> = {};
    const c = String(codigo);
    while (i + 4 <= c.length) {
      const id = c.substr(i, 2);
      const n = parseInt(c.substr(i + 2, 2), 10);
      if (isNaN(n) || i + 4 + n > c.length) break;
      campos[id] = c.substr(i + 4, n);
      i += 4 + n;
    }
    return String(campos["59"] || "").trim();
  } catch {
    return "";
  }
}


export default function Checkout() {
  const [pronto, setPronto] = useState(false);
  const [cor, setCor] = useState("Padrão");
  const [k, setK] = useState(false); // 2º patinete (oferta)
  const [extrasIds, setExtrasIds] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [frete, setFrete] = useState<FreteKey>("free");
  const [bumps, setBumps] = useState([false, false]);
  const [oferta, setOferta] = useState(false); // oferta de saída: unidade a R$ 67,65
  const [V, setV] = useState<Dados>(VAZIO);
  const [erros, setErros] = useState<Record<string, boolean>>({});
  const [pix, setPix] = useState<Pix | null>(null);
  const [qrSrc, setQrSrc] = useState("");
  const [gerando, setGerando] = useState(false);
  const [pago, setPago] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [janelaOferta, setJanelaOferta] = useState(false);
  const [corOferta, setCorOferta] = useState("Preto Padrão");
  const [agora, setAgora] = useState(0);
  const [fimOferta, setFimOferta] = useState(0);

  // espelhos para usar dentro de listeners
  const S = useRef({ step, pix, pago, oferta, ofertaVista: false, V, k, extrasIds, bumps, frete, cor });
  S.current = { ...S.current, step, pix, pago, oferta, V, k, extrasIds, bumps, frete, cor };
  const poll = useRef<{ i: number | null; f: number | null }>({ i: null, f: null });
  const autoPreenchido = useRef<Record<string, string>>({});
  const ultimoCep = useRef("");
  const rolarApos = useRef<"topo" | "manter" | null>(null);

  const PRECO = oferta ? PRECO_OFERTA : PRECO_NORMAL;
  const PAR_2o = oferta ? PAR_2o_OFERTA : PAR_2o_NORMAL;

  /* ===== Contas (espelham o servidor) ===== */
  const conta = useCallback(
    (o = { k, extrasIds, bumps, frete, oferta }) => {
      const pr = o.oferta ? PRECO_OFERTA : PRECO_NORMAL;
      const p2 = o.oferta ? PAR_2o_OFERTA : PAR_2o_NORMAL;
      const base = r2(pr + (o.k ? p2 : 0));
      const ot = r2(o.extrasIds.reduce((s, i) => s + EXTRAS[i].preco, 0));
      const tn = o.extrasIds.length ? r2((base + ot) * 0.15) : 0;
      const add = r2(BUMPS.reduce((s, b, i) => s + (o.bumps[i] ? b.preco : 0), 0));
      const K = FRETES[o.frete].preco;
      const total = r2(base + K + add + ot - tn);
      const origBumps = BUMPS.reduce((s, b, i) => s + (o.bumps[i] ? b.orig : 0), 0);
      const origEx = o.extrasIds.reduce((s, i) => s + EXTRAS[i].orig, 0);
      const eco = r2(PRECO_ORIG - pr + (o.k ? PRECO_ORIG - p2 : 0) + (origBumps - add) + (origEx - ot) + tn);
      return { base, ot, tn, add, K, total, eco, itens: 1 + (o.k ? 1 : 0) };
    },
    [k, extrasIds, bumps, frete, oferta],
  );
  const c = conta();

  const itensPedido = useCallback((): Item[] => {
    const { k, extrasIds, bumps, oferta } = S.current;
    const combo = extrasIds.length > 0;
    const itens: Item[] = [{ slug: "patinete-cross-pro-" + (k ? "2un" : "1un") + (oferta ? "-oferta" : "") + (combo ? "-combo" : ""), quantidade: 1 }];
    extrasIds.forEach((id) => itens.push({ slug: "patinete-extra-" + id, quantidade: 1 }));
    BUMPS.forEach((b, i) => {
      if (bumps[i]) itens.push({ slug: "patinete-bump-" + b.key, quantidade: 1 });
    });
    return itens;
  }, []);

  /* ===== Avisos ===== */
  const toast = useCallback((titulo: string, desc?: string, erro?: boolean) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, titulo, desc, erro }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const irPara = (n: number, manter = false) => {
    rolarApos.current = manter ? "manter" : "topo";
    setStep(n);
  };
  useEffect(() => {
    if (rolarApos.current === "topo") window.scrollTo(0, 0);
    rolarApos.current = null;
  }, [step]);

  const marcarErro = (nome: string) => {
    setErros((e) => ({ ...e, [nome]: true }));
    setTimeout(() => {
      const box = document.querySelector('[data-box="' + nome + '"]');
      if (!box) return;
      box.scrollIntoView({ block: "center", behavior: "smooth" });
      const inp = box.querySelector("input");
      if (inp)
        setTimeout(() => {
          try {
            inp.focus({ preventScroll: true });
          } catch {}
        }, 250);
    }, 30);
  };

  /* ===== PIX ===== */
  const chaveSessao = (total: number) => "checkout-pix:patinete:" + Math.round(total * 100);
  const recuperarPix = (total: number): Pix | null => {
    try {
      const s = JSON.parse(sessionStorage.getItem(chaveSessao(total)) || "null");
      if (s && s.pixCode && s.transactionId) {
        if (Date.now() - s.createdAt > 1800000) {
          sessionStorage.removeItem(chaveSessao(total));
          return null;
        }
        return s;
      }
    } catch {}
    return null;
  };
  const pararPoll = () => {
    if (poll.current.i) clearInterval(poll.current.i);
    if (poll.current.f) clearTimeout(poll.current.f);
    poll.current = { i: null, f: null };
  };
  const confirmar = useCallback(() => {
    if (S.current.pago) return;
    S.current.pago = true;
    setPago(true);
    pararPoll();
    const px = S.current.pix;
    const total = conta().total;
    try {
      sessionStorage.removeItem(chaveSessao(total));
    } catch {}
    ev("CompletePayment", { value: px && px.valor ? px.valor : total, email: S.current.V.email, phone: S.current.V.phone });
    toast("Pagamento confirmado! ✅", "Seu pedido foi aprovado. Redirecionando...");
    const cod = px && px.codigo ? "?codigo=" + encodeURIComponent(px.codigo) + "&frete=" + S.current.frete : "";
    setTimeout(() => (location.href = "/pedido-concluido" + cod), 2500);
  }, [conta, toast]);
  const consultar = useCallback(async () => {
    const px = S.current.pix;
    if (!px || S.current.pago) return;
    try {
      const r = await fetch(API + "/pagamento/" + encodeURIComponent(px.transactionId) + "/status", { cache: "no-store" });
      const j = await r.json();
      if (j && j.pago === true) confirmar();
    } catch {}
  }, [confirmar]);
  const iniciarPoll = useCallback(() => {
    pararPoll();
    const ini = Date.now();
    let lento = false;
    poll.current.i = window.setInterval(() => {
      if (!lento && Date.now() - ini > 180000) {
        lento = true;
        if (poll.current.i) clearInterval(poll.current.i);
        poll.current.i = window.setInterval(consultar, 3000);
      }
      consultar();
    }, 1200);
    poll.current.f = window.setTimeout(pararPoll, 900000);
    setTimeout(consultar, 0);
  }, [consultar]);

  async function gerarPix() {
    if (gerando) return;
    const total = c.total;
    const s = recuperarPix(total);
    if (s) {
      S.current.pix = s;
      setPix(s);
      setGerando(false);
      irPara(3);
      iniciarPoll();
      toast("Você já gerou um PIX", "Recuperamos o código já gerado.");
      return;
    }
    setGerando(true);
    setPix(null);
    irPara(3);
    const Q = new URLSearchParams(location.search);
    const origem: Record<string, string> = {};
    let n = 0;
    Q.forEach((v, key) => {
      if (n < 11) {
        origem[key.slice(0, 40)] = String(v).slice(0, 200);
        n++;
      }
    });
    origem.cor = cor;
    const corpo = {
      cliente: { nome: V.name, email: V.email, cpf: V.cpf, telefone: V.phone, cep: V.cep, endereco: V.address, numero: V.number, complemento: V.complement, bairro: V.neighborhood, cidade: V.city, uf: V.state },
      itens: itensPedido(),
      frete: FRETE_COD[frete],
      metodo: "pix",
      origem,
    };
    try {
      const r = await fetch(API + "/pedido", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
      const j = await r.json().catch(() => ({}));
      const pg = j && j.pagamento;
      if (!r.ok || !pg || !pg.copia_cola) {
        setGerando(false);
        const d = j && j.detail;
        let texto = "";
        let campo = "";
        if (typeof d === "string") texto = d;
        else if (Array.isArray(d) && d.length) {
          texto = String(d[0].msg || "").replace(/^Value error, /, "");
          campo = String((d[0].loc || []).slice(-1)[0] || "");
        }
        if (campo === "cpf") return irPara(1), toast("CPF inválido", "Confira o número informado e tente novamente.", true), marcarErro("cpf");
        if (campo === "nome") return irPara(1), toast("Informe nome e sobrenome", "", true), marcarErro("name");
        if (campo === "email") return irPara(1), toast("E-mail inválido", "Confira o endereço informado.", true), marcarErro("email");
        toast("Erro ao gerar pagamento", texto || (r.status === 429 ? "Muitas tentativas. Aguarde um pouco." : "Tente novamente em instantes."), true);
        return;
      }
      const novo: Pix = { pixCode: pg.copia_cola, transactionId: pg.tx_id, createdAt: Date.now(), qr: pg.qrcode || "", valor: Number(pg.valor) || total, codigo: j.codigo || "" };
      try {
        sessionStorage.setItem(chaveSessao(total), JSON.stringify(novo));
      } catch {}
      ev("AddPaymentInfo", { value: novo.valor, email: V.email, phone: V.phone });
      S.current.pix = novo;
      setPix(novo);
      setGerando(false);
      iniciarPoll();
    } catch {
      setGerando(false);
      toast("Erro ao gerar pagamento", "Tente novamente em instantes.", true);
    }
  }

  // QR Code: usa a imagem do gateway quando vier; senão gera a partir do código copia e cola
  useEffect(() => {
    if (!pix || !pix.pixCode) return setQrSrc("");
    if (pix.qr) return setQrSrc("data:image/png;base64," + String(pix.qr).replace(/[^A-Za-z0-9+/=]/g, ""));
    QRCode.toDataURL(pix.pixCode, { errorCorrectionLevel: "L", margin: 0, width: 384 })
      .then(setQrSrc)
      .catch(() => setQrSrc(""));
  }, [pix]);

  /* ===== Validação ===== */
  function validarPasso1() {
    const d = V.cpf.replace(/\D/g, "");
    const t = V.phone.replace(/\D/g, "");
    if (V.name.trim().split(/\s+/).length < 2) return toast("Preencha todos os dados pessoais", "Informe nome e sobrenome.", true), marcarErro("name"), false;
    if (d.length !== 11 && d.length !== 14) return toast("Preencha todos os dados pessoais", "Confira o CPF/CNPJ.", true), marcarErro("cpf"), false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(V.email.trim())) return toast("Preencha todos os dados pessoais", "Confira o email.", true), marcarErro("email"), false;
    if (t.length < 10) return toast("Preencha todos os dados pessoais", "Confira o telefone com DDD.", true), marcarErro("phone"), false;
    const ordem: [keyof Dados, string, boolean][] = [
      ["cep", "CEP", V.cep.replace(/\D/g, "").length === 8],
      ["address", "a rua", !!V.address.trim()],
      ["number", "o número", !!V.number.trim()],
      ["neighborhood", "o bairro", !!V.neighborhood.trim()],
      ["city", "a cidade", !!V.city.trim()],
      ["state", "a UF", V.state.trim().length === 2],
    ];
    for (const o of ordem)
      if (!o[2]) {
        toast("Preencha o endereço de entrega", "Falta " + (o[0] === "cep" ? "o " : "") + o[1] + ".", true);
        marcarErro(o[0]);
        return false;
      }
    return true;
  }

  /* ===== CEP -> endereço: busca assim que o 8º dígito é digitado (e ao sair do campo) ===== */
  async function buscarCep(cepFormatado: string) {
    const cep = cepFormatado.replace(/\D/g, "");
    if (cep.length !== 8 || cep === ultimoCep.current) return;
    ultimoCep.current = cep;
    let dados: Partial<Dados> | null = null;
    let naoExiste = false;
    try {
      const r = await fetch(API + "/cep/" + cep, { cache: "no-store", signal: AbortSignal.timeout(6000) });
      if (r.ok) {
        const j = await r.json();
        dados = { address: j.logradouro, neighborhood: j.bairro, city: j.cidade, state: j.uf };
      } else if (r.status === 404) naoExiste = true;
    } catch {}
    if (!dados && !naoExiste) {
      try {
        const v = await fetch("https://viacep.com.br/ws/" + cep + "/json/", { signal: AbortSignal.timeout(6000) }).then((x) => x.json());
        if (v && v.erro) naoExiste = true;
        else if (v) dados = { address: v.logradouro, neighborhood: v.bairro, city: v.localidade, state: v.uf };
      } catch {}
    }
    if (S.current.V.cep.replace(/\D/g, "") !== cep) return; // o cliente já mudou o CEP enquanto buscava
    if (naoExiste) return toast("CEP não encontrado", "Confira o número ou preencha o endereço à mão.", true);
    if (!dados) {
      ultimoCep.current = "";
      return;
    }
    const atual = S.current.V;
    const novo = { ...atual };
    const limpos: Record<string, boolean> = {};
    (Object.keys(dados) as (keyof Dados)[]).forEach((n) => {
      const val = dados![n];
      if (!val) return;
      if (!atual[n] || atual[n] === autoPreenchido.current[n]) {
        // não apaga o que o cliente digitou
        novo[n] = val;
        autoPreenchido.current[n] = val;
        limpos[n] = false;
      }
    });
    S.current.V = novo;
    setV(novo);
    setErros((e) => ({ ...e, ...limpos }));
    if (!novo.number) {
      setTimeout(() => {
        const num = document.querySelector('input[name="number"]') as HTMLInputElement | null;
        try {
          num?.focus();
        } catch {}
      }, 30);
    }
  }

  function digitar(n: keyof Dados, valor: string) {
    let v = valor;
    if (n === "cpf") v = mCpf(v);
    else if (n === "phone") v = mTel(v);
    else if (n === "cep") v = mCep(v);
    else if (n === "state") v = v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
    const novo = { ...V, [n]: v };
    S.current.V = novo;
    setV(novo);
    if (erros[n]) setErros({ ...erros, [n]: false });
    if (n === "cep" && v.replace(/\D/g, "").length === 8) buscarCep(v);
  }

  /* ===== Botões ===== */
  function abrirOferta() {
    if (janelaOferta || oferta || pix || pago) return;
    const atual = cor === "Padrão" || cor === "Preto" ? "Preto Padrão" : cor;
    setCorOferta(CORES_OFERTA.some((x) => x[0] === atual) ? atual : "Preto Padrão");
    setJanelaOferta(true);
    document.body.style.overflow = "hidden";
  }
  function fecharOferta() {
    setJanelaOferta(false);
    document.body.style.overflow = "";
  }
  function aceitarOferta() {
    const novaCor = corOferta === "Preto Padrão" ? "Padrão" : corOferta;
    setOferta(true);
    setCor(novaCor);
    ev("AddToCart", { value: conta({ k, extrasIds, bumps, frete, oferta: true }).total });
    fecharOferta();
    toast("Oferta aplicada! ✅", "O preço do seu pedido foi atualizado.");
  }

  function voltar() {
    if (step === 1) {
      if (!S.current.ofertaVista && !oferta && !pix && !pago) {
        S.current.ofertaVista = true;
        abrirOferta();
      } else location.href = CARRINHO_URL;
    } else if (step === 2) irPara(1);
    else if (step === 3 && !pago) {
      if (pix && !confirm(AVISO_SAIR)) return;
      irPara(2);
      pararPoll();
      S.current.pix = null;
      setPix(null);
    }
  }
  function continuar() {
    if (step === 1) {
      if (validarPasso1()) {
        irPara(2);
        ev("AddToCart", { value: c.total });
      }
    } else if (step === 2) gerarPix();
  }
  function copiar() {
    if (!pix || !pix.pixCode) return toast("Código PIX não disponível ainda", "", true);
    const ok = () => {
      toast("Código PIX copiado!", "Cole no app do seu banco.");
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    };
    const antigo = () => {
      const t = document.createElement("textarea");
      t.value = pix.pixCode;
      t.style.cssText = "position:fixed;top:0;left:0;opacity:0;font-size:16px";
      document.body.appendChild(t);
      t.select();
      try {
        document.execCommand("copy");
      } catch {}
      t.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(pix.pixCode).then(ok, () => (antigo(), ok()));
    else (antigo(), ok());
  }

  /* ===== Início ===== */
  useEffect(() => {
    const Q = new URLSearchParams(location.search);
    const corQ = Q.get("cor") || "Padrão";
    const kQ = parseInt(Q.get("qtd") || "1", 10) === 2;
    const exQ = (Q.get("extras") || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => EXTRAS[s]);
    let guardado: Dados = VAZIO;
    try {
      const g = JSON.parse(sessionStorage.getItem("checkout-customer-form") || "null");
      if (g) guardado = { ...VAZIO, ...Object.fromEntries(Object.entries(g).filter(([n]) => n in VAZIO)) } as Dados;
    } catch {}
    setCor(corQ);
    setK(kQ);
    setExtrasIds(exQ);
    setV(guardado);
    S.current = { ...S.current, cor: corQ, k: kQ, extrasIds: exQ, V: guardado };
    setFimOferta(Date.now() + 600000);
    setAgora(Date.now());
    const total0 = conta({ k: kQ, extrasIds: exQ, bumps: [false, false], frete: "free", oferta: false }).total;
    const rec = recuperarPix(total0);
    if (rec) {
      S.current.pix = rec;
      setPix(rec);
      setStep(3);
    }
    setPronto(true);

    iniciarXtracky();
    ev("InitiateCheckout", { value: total0, quantity: 1 });

    /* Atalho de teste: ?dev=1 só funciona quando a API está em modo teste (sem gateway). Preenche dados de exemplo e salta para a revisão. */
    if (Q.get("dev") === "1" && !rec) {
      fetch("/api/dev/config", { cache: "no-store" })
        .then((r) => r.json())
        .then((cfg) => {
          if (!cfg || !cfg.mock) return;
          const teste: Dados = { ...VAZIO, name: "Cliente Teste", email: "teste@example.com", phone: "(11) 99999-0000", cep: "01001-000", address: "Rua de Teste", number: "100", neighborhood: "Centro", city: "São Paulo", state: "SP" };
          S.current.V = teste;
          setV(teste);
          setStep(2);
        })
        .catch(() => {});
    }

    const relogio = setInterval(() => setAgora(Date.now()), 1000);
    const salvar = () => {
      try {
        sessionStorage.setItem("checkout-customer-form", JSON.stringify(S.current.V));
      } catch {}
    };
    const visivel = () => {
      if (!document.hidden && S.current.step === 3) consultar();
    };
    const antesDeSair = (e: BeforeUnloadEvent) => {
      if (S.current.pix && !S.current.pago) {
        e.preventDefault();
        e.returnValue = AVISO_SAIR;
      }
    };
    // Botão "voltar" do navegador, antes de gerar o PIX: mostra a oferta uma vez; depois deixa sair.
    let guardaCriada = false;
    const criarGuarda = () => {
      if (guardaCriada) return;
      guardaCriada = true;
      try {
        history.pushState({ guarda: 1 }, "");
      } catch {}
    };
    const toques = ["pointerdown", "keydown", "touchstart"];
    toques.forEach((n) => document.addEventListener(n, criarGuarda, { once: true, passive: true }));
    const aoVoltar = () => {
      const s = S.current;
      if (!s.ofertaVista && !s.oferta && !s.pix && !s.pago) {
        s.ofertaVista = true;
        try {
          history.pushState({ guarda: 1 }, "");
        } catch {}
        document.dispatchEvent(new CustomEvent("abrir-oferta"));
      } else if (guardaCriada && s.ofertaVista && !s.oferta && !s.pix && !s.pago) history.back();
    };
    window.addEventListener("pagehide", salvar);
    document.addEventListener("visibilitychange", visivel);
    window.addEventListener("beforeunload", antesDeSair);
    window.addEventListener("popstate", aoVoltar);
    return () => {
      clearInterval(relogio);
      pararPoll();
      toques.forEach((n) => document.removeEventListener(n, criarGuarda));
      window.removeEventListener("pagehide", salvar);
      document.removeEventListener("visibilitychange", visivel);
      window.removeEventListener("beforeunload", antesDeSair);
      window.removeEventListener("popstate", aoVoltar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // retoma a consulta de pagamento quando o PIX salvo é recuperado ao abrir a página
  useEffect(() => {
    if (pronto && step === 3 && pix && !pago && !poll.current.i) iniciarPoll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto]);

  // a janela de oferta é aberta pelo "voltar" do navegador
  const abrirOfertaRef = useRef(abrirOferta);
  abrirOfertaRef.current = abrirOferta;
  useEffect(() => {
    const f = () => abrirOfertaRef.current();
    document.addEventListener("abrir-oferta", f);
    return () => document.removeEventListener("abrir-oferta", f);
  }, []);

  if (!pronto) return <div className="min-h-screen bg-[#f5f5f7]" />;

  /* ===== Telas ===== */
  const thumbCor = THUMB[cor] || THUMB["Padrão"];

  const campo = (label: string, nome: keyof Dados, ph: string, extra: { icone?: string; type?: string; mode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; max?: number; auto?: string } = {}) => (
    <div>
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{label}</label>
      <div className={"flex items-center gap-2.5 bg-white rounded-2xl px-3.5 h-[46px] border-2 focus-within:border-[#FF2D55] transition-all " + (erros[nome] ? "border-red-500" : "border-gray-200")} data-box={nome}>
        {extra.icone && (
          <span className="text-gray-400 flex-shrink-0">
            <I n={extra.icone} cls="h-3.5 w-3.5" />
          </span>
        )}
        <input
          type={extra.type || "text"}
          placeholder={ph}
          inputMode={extra.mode}
          maxLength={extra.max}
          autoComplete={extra.auto}
          className="flex-1 bg-transparent text-[13px] text-gray-800 placeholder:text-gray-400 outline-none"
          name={nome}
          value={V[nome]}
          onChange={(e) => digitar(nome, e.target.value)}
          onBlur={nome === "cep" ? (e) => buscarCep(e.target.value) : undefined}
        />
      </div>
    </div>
  );

  const radio = (ativo: boolean, corR: string) => (
    <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: ativo ? corR : "#d1d5db" }}>
      {ativo && <span className="w-2.5 h-2.5 rounded-full" style={{ background: corR }} />}
    </span>
  );

  const titulo = step === 1 ? "Informações" : step === 2 ? "Confirmar pedido" : "Pagamento";
  const cabecalho = (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center h-12 px-4 max-w-[500px] mx-auto">
          <button className="p-1 -ml-1" onClick={voltar} aria-label="Voltar">
            <I n="arrow-left" cls="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <h1 className="text-[15px] font-semibold text-gray-800">{titulo}</h1>
          </div>
          <div className="w-7" />
        </div>
      </header>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[500px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {(
              [
                ["Dados", 1],
                ["Revisão", 2],
                ["Pagamento", 3],
              ] as [string, number][]
            ).map((e, i) => {
              const ativo = step >= e[1];
              return (
                <div className="flex items-center" key={e[0]}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={"w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all " + (ativo ? "bg-[#FF2D55] text-white" : "bg-gray-200 text-gray-400")}>
                      {step > e[1] ? <I n="check" cls="h-4 w-4" /> : e[1]}
                    </div>
                    <span className={"text-[11px] font-medium " + (ativo ? "text-[#FF2D55]" : "text-gray-400")}>{e[0]}</span>
                  </div>
                  {i < 2 && <div className={"w-16 h-[2px] mx-2 mt-[-16px] " + (step > e[1] ? "bg-[#FF2D55]" : "bg-gray-200")} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );

  const selos = (
    <div className="flex items-center justify-around py-4">
      {(
        [
          ["lock", "#FF2D55", "Pagamento", "Seguro"],
          ["rotate-ccw", "#00b37e", "Garantia de", "Devolução"],
          ["truck", "#FF2D55", "Frete", "Grátis"],
        ] as string[][]
      ).map((x) => (
        <div className="flex flex-col items-center gap-1.5" key={x[0]}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: x[1] + "1a" }}>
            <I n={x[0]} cls="h-4 w-4" style={{ color: x[1] }} />
          </div>
          <span className="text-[10px] text-gray-500 text-center leading-tight">
            {x[2]}
            <br />
            {x[3]}
          </span>
        </div>
      ))}
    </div>
  );

  const etapa1 = (
    <div className="max-w-[500px] mx-auto pb-36">
      <div className="px-3 pt-3 space-y-3">
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <I n="user" cls="h-4 w-4 text-[#FF2D55]" />
            <h3 className="text-[14px] font-bold text-gray-800">Informações pessoais</h3>
          </div>
          <div className="space-y-3">
            {campo("NOME COMPLETO", "name", "João da Silva", { icone: "user", auto: "name" })}
            {campo("CPF/CNPJ", "cpf", "000.000.000-00", { icone: "file-text", mode: "numeric", max: 18 })}
            {campo("EMAIL", "email", "seu@email.com", { icone: "mail", type: "email", auto: "email" })}
            {campo("TELEFONE", "phone", "(00) 00000-0000", { icone: "phone", mode: "tel", auto: "tel-national", max: 15 })}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <I n="map-pin" cls="h-4 w-4 text-[#FF2D55]" />
            <h3 className="text-[14px] font-bold text-gray-800">Endereço de entrega</h3>
          </div>
          <div className="space-y-3">
            {campo("CEP", "cep", "00000-000", { mode: "numeric", auto: "postal-code", max: 9 })}
            {campo("RUA", "address", "Nome da rua", { auto: "address-line1" })}
            <div className="grid grid-cols-2 gap-2">
              {campo("NÚMERO", "number", "Nº")}
              {campo("COMPLEMENTO", "complement", "Apto, bloco...")}
            </div>
            {campo("BAIRRO", "neighborhood", "Bairro")}
            <div className="grid grid-cols-2 gap-2">
              {campo("CIDADE", "city", "Cidade", { auto: "address-level2" })}
              {campo("UF", "state", "SP", { max: 2 })}
            </div>
          </div>
        </div>
        {selos}
      </div>
    </div>
  );

  const resumo = (pequeno: boolean) => {
    const t = pequeno ? "text-[12px]" : "text-[13px]";
    const pv = pequeno ? "font-medium" : "font-semibold";
    return (
      <div className="bg-white rounded-2xl p-4">
        <h3 className="text-[14px] font-bold text-gray-800 mb-3">Resumo do pedido</h3>
        <div className="flex gap-3 items-start pb-3 border-b border-gray-100">
          <div className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden">
            <img src={A + "patinete/" + thumbCor} alt={NOME} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-800 leading-tight line-clamp-2">{NOME}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[12px] text-gray-500">
              <span>
                Cor: <span className="text-gray-700 font-medium uppercase">{cor}</span>
              </span>
              <span>
                Qtd: <span className="text-gray-700 font-medium">{c.itens}</span>
              </span>
            </div>
          </div>
          <span className="text-[13px] font-semibold text-gray-800 flex-shrink-0">{brl(PRECO)}</span>
        </div>
        <div className={(pequeno ? "space-y-1.5" : "space-y-2") + " mt-3"}>
          <div className={"flex justify-between " + t}>
            <span className="text-gray-500">Subtotal produto</span>
            <span className={"text-gray-800 " + pv}>{brl(PRECO)}</span>
          </div>
          {k && (
            <div className={"flex justify-between " + t}>
              <span className="text-gray-500">2º Patinete (oferta)</span>
              <span className={"text-gray-800 " + pv}>{brl(PAR_2o)}</span>
            </div>
          )}
          {!pequeno &&
            BUMPS.map(
              (b, i) =>
                bumps[i] && (
                  <div className="flex justify-between text-[13px]" key={b.key}>
                    <span className="text-gray-500 truncate pr-2">{b.nome}</span>
                    <span className="text-gray-800 font-semibold flex-shrink-0">{brl(b.preco)}</span>
                  </div>
                ),
            )}
          {pequeno && c.add > 0 && (
            <div className="flex justify-between text-[12px]">
              <span className="text-gray-500">Itens adicionais</span>
              <span className="text-gray-800 font-medium">{brl(c.add)}</span>
            </div>
          )}
          {!pequeno &&
            extrasIds.map((id) => (
              <div className="flex justify-between text-[13px]" key={id}>
                <span className="text-gray-500 truncate pr-2">{EXTRAS[id].nome}</span>
                <span className="text-gray-800 font-semibold flex-shrink-0">{brl(EXTRAS[id].preco)}</span>
              </div>
            ))}
          {c.tn > 0 && (
            <div className={"flex justify-between " + t}>
              <span className="text-green-700 font-semibold">Desconto 15% (kit)</span>
              <span className="text-green-700 font-bold">- {brl(c.tn)}</span>
            </div>
          )}
          <div className={"flex justify-between " + t}>
            <span className="text-gray-500">Frete {frete === "free" ? "(Grátis)" : frete === "economy" ? "(Econômico)" : "(Full)"}</span>
            <span className="font-bold text-[#00b37e]">{frete === "free" ? "Grátis" : brl(c.K)}</span>
          </div>
          {!pequeno && (
            <div className="border-t border-gray-100 pt-2 flex justify-between items-baseline">
              <span className="text-[14px] font-medium text-gray-800">Total</span>
              <div className="text-right">
                <span className="text-[20px] font-semibold text-[#00b37e]">{brl(c.total)}</span>
                <p className="text-[11px] text-gray-400 italic">Impostos inclusos</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const dataEntrega = () => {
    const d = new Date();
    if (frete === "express") d.setDate(d.getDate() + 1);
    else {
      let n = 0;
      while (n < 5) {
        d.setDate(d.getDate() + 1);
        const w = d.getDay();
        if (w !== 0 && w !== 6) n++;
      }
    }
    return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2);
  };

  const sCron = Math.max(0, Math.ceil((fimOferta - agora) / 1000));
  const cron = ("0" + Math.floor(sCron / 60)).slice(-2) + ":" + ("0" + (sCron % 60)).slice(-2);

  const etapa2 = (
    <>
      <div className="max-w-[500px] mx-auto px-3 pt-2">
        <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #FF2D55 0%, #FF4B6E 100%)" }}>
          <div className="flex items-center justify-center gap-2 py-2.5 px-4">
            <I n="clock" cls="h-4 w-4 text-white" />
            <span className="text-white font-bold text-[14px]">{cron}</span>
            <span className="text-white/90 text-[13px]">para pagar</span>
          </div>
        </div>
      </div>
      <div className="max-w-[500px] mx-auto pb-36">
        <div className="px-3 pt-3 space-y-3">
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-end mb-2">
              <span className="text-[12px] text-gray-400">
                {c.itens}
                {c.itens === 1 ? " item" : " itens"}
              </span>
            </div>
            <p className="text-[12px] text-[#00b37e] font-medium mb-3">Você ganhou frete grátis!</p>
            <div className="flex items-center gap-3">
              <div className="w-[65px] h-[65px] rounded-lg flex items-center justify-center flex-shrink-0">
                <img src={A + "patinete/" + thumbCor} alt={NOME} className="w-14 h-14 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-gray-800 leading-tight truncate">{NOME}</p>
                <p className="text-[14px] font-medium text-[#00b37e] mt-1">{brl(r2(PRECO + (k ? PAR_2o : 0)))}</p>
              </div>
              <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden self-center flex-shrink-0">
                <button className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-sm font-medium" onClick={() => setK(false)}>
                  −
                </button>
                <span className="w-7 h-7 flex items-center justify-center text-[12px] font-semibold text-gray-800 border-x border-gray-200 bg-gray-50">{c.itens}</span>
                <button className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-sm font-medium" onClick={() => setK(true)}>
                  +
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#FF2D55]/30 bg-[#FF2D55]/5 p-3">
              <img src={A + "patinete/brinde-capacete.jpg"} alt="Capacete Esportivo Premium" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-white" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[#FF2D55] flex items-center gap-1">
                  <I n="gift" cls="w-3.5 h-3.5" /> BRINDE
                </p>
                <p className="text-[12px] font-medium text-gray-800 leading-tight">Capacete Esportivo Premium – Proteção Reforçada</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[11px] text-gray-400 line-through">R$ 189,90</p>
                <p className="text-[13px] font-bold text-[#FF2D55]">Grátis</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <h3 className="text-[14px] font-bold text-gray-800 mb-3">Escolha uma forma de entrega:</h3>
            <div className="space-y-2">
              {(Object.keys(FRETES) as FreteKey[]).map((key) => {
                const f = FRETES[key];
                const ativo = frete === key;
                return (
                  <button key={key} className={"w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all " + (ativo ? "border-[#00b37e] bg-[#00b37e]/5" : "border-gray-200 bg-white")} onClick={() => setFrete(key)}>
                    {radio(ativo, "#00b37e")}
                    <img src={A + f.logo} alt={f.alt} className={f.cls + " object-contain flex-shrink-0"} />
                    <div className="flex-1 text-left">
                      <p className="text-[13px] font-semibold text-gray-800">{f.nome}</p>
                      <p className="text-[11px] text-gray-400">{f.prazo}</p>
                    </div>
                    <span className={"text-[13px] font-bold " + (key === "free" ? "text-[#00b37e]" : "text-gray-800")}>{key === "free" ? "Grátis" : brl(f.preco)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <I n="gift" cls="w-4 h-4 text-[#FF2D55]" />
              <p className="text-[13px] font-extrabold text-gray-800">Complete seu patinete com desconto</p>
            </div>
            {BUMPS.map((b, i) => {
              const ativo = bumps[i];
              return (
                <button
                  key={b.key}
                  type="button"
                  className={"w-full text-left rounded-2xl border-2 p-3 transition-all " + (ativo ? "border-[#FF2D55] bg-[#FF2D55]/5" : "border-gray-200 bg-white")}
                  onClick={() => {
                    const nb = [...bumps];
                    nb[i] = !nb[i];
                    setBumps(nb);
                    if (nb[i]) ev("AddToCart", { value: b.preco });
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden">
                        <img src={A + b.img} alt={b.nome} className="w-full h-full object-contain" />
                      </div>
                      <span className="absolute -top-2 -right-2 bg-[#00b37e] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow z-10 whitespace-nowrap">-{Math.round((1 - b.preco / b.orig) * 100)}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-900 leading-tight">{b.nome}</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-[11px] text-gray-400 line-through">{brl(b.orig)}</span>
                        <span className="text-[17px] font-extrabold text-[#FF2D55] leading-none">{brl(b.preco)}</span>
                      </div>
                      <p className={"text-[10.5px] font-bold mt-1 " + (ativo ? "text-[#00b37e]" : "text-[#FF2D55]")}>{ativo ? "✓ Adicionado ao pedido" : "👉 Toque para adicionar"}</p>
                    </div>
                    <div className={"w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all " + (ativo ? "bg-[#FF2D55] border-[#FF2D55]" : "border-gray-300 bg-white")}>
                      {ativo && <I n="check" cls="w-4 h-4 text-white" sw={3} />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {resumo(false)}

          <div className="bg-[#e8faf3] border border-dashed border-[#00b37e] rounded-xl px-4 py-3">
            <p className="text-[13px] text-[#00875a] font-medium text-center">Você está economizando {brl(c.eco)} neste pedido.</p>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <h3 className="text-[14px] font-bold text-gray-800 mb-3">Forma de pagamento</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all border-[#00b37e] bg-[#00b37e]/5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-white">
                  <img src={A + "pix-logo.webp"} alt="PIX" width={32} height={32} className="w-8 h-8 object-contain aspect-square" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[13px] font-semibold text-gray-800">Pix</p>
                  <p className="text-[11px] text-gray-400">Pague em até 10 minutos para receber até dia {dataEntrega()}.</p>
                </div>
                {radio(true, "#FF2D55")}
              </button>
              <button disabled className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-200 bg-white opacity-50 cursor-not-allowed">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <I n="credit-card" cls="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[13px] font-medium text-gray-400">Adicionar cartão de crédito</p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <I n="map-pin" cls="h-4 w-4 text-[#FF2D55]" />
                <h3 className="text-[14px] font-bold text-gray-800">Endereço de entrega</h3>
              </div>
              <button className="text-[13px] font-semibold text-[#00b37e]" onClick={() => irPara(1)}>
                Editar
              </button>
            </div>
            <div className="text-[12px] text-gray-500 space-y-0.5">
              <p className="font-semibold text-gray-700">{V.name}</p>
              <p>
                {V.phone} • {V.email}
              </p>
              <p>
                {V.address}, {V.number}
              </p>
              <p>
                {V.neighborhood} • {V.city}/{V.state}
              </p>
              <p>CEP: {V.cep}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 py-3">
            <div className="flex items-center gap-1">
              <I n="lock" cls="h-3 w-3 text-gray-400" />
              <span className="text-[10px] text-gray-400">SSL Seguro</span>
            </div>
            <div className="flex items-center gap-1">
              <I n="shield" cls="h-3 w-3 text-gray-400" />
              <span className="text-[10px] text-gray-400">Compra Protegida</span>
            </div>
            <div className="flex items-center gap-1">
              <I n="star" cls="h-3 w-3 text-amber-400 fill-amber-400" fill="currentColor" />
              <span className="text-[10px] text-gray-400">4.8/5</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const restante = pix ? Math.max(0, 600000 - (agora - pix.createdAt)) : 0;
  const recebedor = pix && pix.pixCode && !pago ? nomeNoPix(pix.pixCode) : "";
  const passos: [string, React.ReactNode][] = [
    ["Copie o código PIX", (<>Toque no botão <span className="font-semibold">&quot;Copiar código PIX&quot;</span> acima.</>)],
    ["Abra o app do seu banco", (<>Vá em <span className="font-semibold">PIX → Pix Copia e Cola</span>.</>)],
    ["Confirme o pagamento", "Cole o código, confira o valor e finalize."],
  ];

  const etapa3 = (
    <div className="max-w-[500px] mx-auto pb-36">
      <div className="px-3 pt-3 space-y-3">
        {pago ? (
          <div className="bg-[#00b37e] rounded-2xl p-4 text-center">
            <I n="circle-check-big" cls="h-10 w-10 text-white mx-auto mb-2" />
            <p className="text-white font-bold text-[16px]">Pagamento Confirmado!</p>
            <p className="text-white/90 text-[13px] mt-1">Seu pedido foi aprovado com sucesso.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 text-center">
            <p className="text-[14px] font-semibold text-gray-800 mb-1">Efetue o pagamento agora mesmo</p>
            <p className="text-[14px] font-semibold text-gray-800 mb-1">escaneando o QR Code</p>
            <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-3">
              <I n="camera" cls="h-3.5 w-3.5" />
              <p className="text-[12px]">Aponte a câmera do seu celular</p>
            </div>
            <p className="text-[14px] font-bold text-gray-800 mb-4">
              Valor no pix: <span className="text-[#00b37e]">{brl(pix && pix.valor ? pix.valor : c.total)}</span>
            </p>
            {gerando ? (
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-4 border-2 border-gray-200">
                <div className="w-8 h-8 border-gray-300 border-t-[#FF2D55] rounded-full animate-spin" style={{ borderWidth: 3, borderStyle: "solid" }} />
              </div>
            ) : pix && pix.pixCode ? (
              <>
                <div className="w-52 h-52 mx-auto bg-white rounded-xl flex items-center justify-center mb-2 border-2 border-gray-200 p-2" style={{ overflow: "hidden" }}>
                  {qrSrc && <img alt="QR Code do PIX" width={192} height={192} style={{ width: 192, height: 192, imageRendering: "pixelated" }} src={qrSrc} />}
                </div>
                <p className={"text-center text-[12px] mt-2 mb-2 " + (restante <= 0 ? "text-[#FF2D55] font-bold" : "text-gray-600")}>
                  {restante <= 0 ? (
                    "Código PIX expirado"
                  ) : (
                    <>
                      Este código expira em{" "}
                      <span className="font-bold text-gray-900">
                        {("0" + Math.floor(restante / 60000)).slice(-2)}:{("0" + Math.floor((restante % 60000) / 1000)).slice(-2)}
                      </span>
                    </>
                  )}
                </p>
                <div className="mt-3 text-left">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Pix copia e cola</p>
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl px-3 py-2.5 text-[12px] text-gray-700 font-mono break-all select-all leading-snug max-h-24 overflow-y-auto">{pix.pixCode}</div>
                  <button className={"mt-2 w-full h-[50px] rounded-full text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] " + (copiado ? "bg-[#00b37e]" : "bg-[#FF2D55]")} onClick={copiar}>
                    <I n={copiado ? "check" : "copy"} cls="h-4 w-4" /> {copiado ? "CÓDIGO COPIADO!" : "COPIAR CÓDIGO PIX"}
                  </button>
                </div>
              </>
            ) : (
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-4 border-2 border-gray-200">
                <p className="text-[12px] text-gray-400 px-4">
                  Não foi possível gerar o PIX.
                  <br />
                  <button className="mt-2 text-[#FF2D55] font-bold" onClick={gerarPix}>
                    Tentar de novo
                  </button>
                </p>
              </div>
            )}
          </div>
        )}

        {recebedor && (
          <div className="bg-[#e8faf3] rounded-xl px-4 py-3">
            <p className="text-[12px] text-[#00875a] text-center">O Pix será destinado à empresa que realiza o processamento seguro dos nossos pagamentos:</p>
            <p className="text-[13px] font-bold text-gray-800 text-center mt-1">{recebedor}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="text-[14px] font-bold text-gray-800 mb-3">Como pagar em 3 passos simples</h3>
          <div className="space-y-2">
            {passos.map((p, i) => (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3" key={i}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FE2C55] to-[#E11D48] text-white text-[14px] font-extrabold flex items-center justify-center flex-shrink-0 shadow-[0_2px_6px_rgba(254,44,85,0.3)]">{i + 1}</div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-gray-900 leading-tight">{p[0]}</p>
                  <p className="text-[12px] text-gray-600 leading-snug mt-0.5">{p[1]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {resumo(true)}

        {!pago && (
          <div className="relative overflow-hidden rounded-2xl border-2 border-[#FE2C55] bg-gradient-to-br from-[#fff5f7] via-white to-[#fff0f4] p-4 shadow-[0_8px_24px_-12px_rgba(254,44,85,0.45)]">
            <div className="relative">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FE2C55] to-[#E11D48] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#FE2C55]/30">
                  <I n="gift" cls="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 bg-[#FE2C55] text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Você foi premiada!
                  </div>
                  <p className="text-[14px] font-extrabold text-gray-900 leading-tight">
                    Parabéns! Você é a <span className="text-[#FE2C55]">cliente nº 10.000</span>
                  </p>
                  <p className="text-[12px] text-gray-600 leading-snug mt-1">
                    Por isso ganhou <span className="font-bold text-gray-900">2 brindes exclusivos</span> totalmente grátis junto com o seu pedido.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {BRINDES.map((b) => (
                  <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-2.5" key={b.nome}>
                    <img src={A + b.img} alt={b.nome} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-white" />
                    <p className="flex-1 min-w-0 text-[12px] font-medium text-gray-800 leading-tight">{b.nome}</p>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] text-gray-400 line-through">{brl(b.orig)}</p>
                      <p className="text-[13px] font-bold text-[#FF2D55]">Grátis</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const barra = (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="max-w-[500px] mx-auto px-4 py-3">
        {step < 3 ? (
          <>
            {step === 2 && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-gray-500">
                  Total ({c.itens}
                  {c.itens === 1 ? " item" : " itens"})
                </span>
                <span className="text-[20px] font-semibold text-[#00b37e]">{brl(c.total)}</span>
              </div>
            )}
            <button className="w-full h-[50px] rounded-full text-[15px] font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-[#FF2D55]" onClick={continuar}>
              {step === 1 ? (
                <>
                  <I n="lock" cls="h-4 w-4" />
                  Salvar endereço e continuar
                </>
              ) : (
                "Finalizar Compra"
              )}
            </button>
            <div className="flex items-center justify-center gap-1 mt-2">
              <I n="shield" cls="h-3 w-3 text-gray-400" />
              <span className="text-[11px] text-gray-400">Seus dados estão protegidos com criptografia SSL</span>
            </div>
          </>
        ) : !pago ? (
          <>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-[#FF2D55] rounded-full animate-spin" />
              <span className="text-[12px] text-gray-400">Aguardando confirmação do pagamento...</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2">
            <I n="circle-check-big" cls="h-5 w-5 text-[#00b37e]" />
            <span className="text-[14px] font-bold text-[#00b37e]">Pagamento confirmado!</span>
          </div>
        )}
      </div>
    </div>
  );

  /* ===== Janela "Espera! Oferta exclusiva" (aparece uma vez, ao tentar voltar antes de gerar o PIX) ===== */
  let janela = null;
  if (janelaOferta) {
    const de = r2(89.9 + (k ? 84.1 : 0));
    const por = r2(PRECO_OFERTA + (k ? PAR_2o_OFERTA : 0));
    const eco = r2(de - por);
    const pct = Math.round((eco / de) * 100);
    const thumb = THUMB[corOferta === "Preto Padrão" ? "Padrão" : corOferta] || THUMB["Padrão"];
    const nome = NOME + " – " + corOferta + (k ? " (2 unidades)" : "");
    janela = (
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
        <div className="w-full sm:max-w-sm max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up relative">
          <div className="bg-gradient-to-r from-[#FE2C55] to-[#ff5577] text-white text-center py-3 px-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-90">Espera! Oferta exclusiva</p>
            <p className="text-[18px] font-extrabold leading-tight">Última chance com mais desconto</p>
          </div>
          <div className="px-4 pt-4 pb-3 flex gap-3 items-center border-b border-gray-100">
            <img src={A + "patinete/" + thumb} alt={nome} className="w-20 h-20 object-contain flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-black leading-snug line-clamp-2">{nome}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="bg-[#FE2C55] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-{pct}%</span>
                <span className="text-[10px] text-gray-500 line-through">{brl(de)}</span>
              </div>
            </div>
          </div>
          <div className="px-4 pt-3">
            <p className="text-[11px] font-semibold text-gray-700 mb-2">
              Escolha a cor: <span className="text-[#FE2C55]">{corOferta}</span>
            </p>
            <div className="grid gap-2 grid-cols-3">
              {CORES_OFERTA.map((co) => {
                const ativo = corOferta === co[0];
                return (
                  <button key={co[0]} type="button" onClick={() => setCorOferta(co[0])} className={"relative rounded-lg border-2 overflow-hidden bg-white transition " + (ativo ? "border-[#FE2C55] ring-2 ring-[#FE2C55]/30" : "border-gray-200")}>
                    <img src={A + "patinete/" + co[1]} alt={co[0]} className="w-full aspect-square object-contain" />
                    <span className="block text-[9px] font-semibold text-gray-700 text-center py-0.5 leading-tight">{co[0]}</span>
                    {ativo && (
                      <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#FE2C55] text-white rounded-full flex items-center justify-center">
                        <I n="check" cls="w-2.5 h-2.5" sw={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-[12px] text-gray-600">Por apenas</p>
            <p className="text-[34px] font-extrabold text-[#FE2C55] leading-none">{brl(por)}</p>
            <p className="text-[12px] font-semibold text-[#00b37e] mt-1">Você economiza {brl(eco)}</p>
            <ul className="text-left mt-4 space-y-1.5 text-[12px] text-gray-700">
              {["Frete grátis para todo Brasil", "Garantia de 1 ano", "Pagamento 100% seguro via PIX"].map((x) => (
                <li className="flex items-start gap-2" key={x}>
                  <I n="check" cls="w-3.5 h-3.5 text-[#00b37e] mt-0.5 flex-shrink-0" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="px-4 pb-5 space-y-2">
            <button onClick={aceitarOferta} className="w-full bg-[#FE2C55] text-white font-extrabold text-[15px] py-3.5 rounded-xl active:scale-[0.98] transition shadow-lg shadow-[#FE2C55]/30">
              QUERO APROVEITAR ESSA OFERTA
            </button>
            <button onClick={fecharOferta} className="w-full text-gray-500 text-[12px] py-1.5">
              Não, prefiro pagar o preço cheio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {cabecalho}
      {step === 1 ? etapa1 : step === 2 ? etapa2 : etapa3}
      {barra}
      {janela}
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{ position: "fixed", left: 12, right: 12, top: 12, zIndex: 200, maxWidth: 460, margin: "0 auto", padding: "12px 14px", borderRadius: 12, boxShadow: "0 10px 30px #0003", font: "600 14px/1.35 Inter,system-ui,sans-serif", color: "#fff", background: t.erro ? "#dc2626" : "#00b37e" }}
        >
          {t.titulo}
          {t.desc && <div style={{ fontWeight: 400, fontSize: 12.5, opacity: 0.95, marginTop: 2 }}>{t.desc}</div>}
        </div>
      ))}
    </div>
  );
}

