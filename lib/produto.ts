/* Interações da página do produto (galeria, cores, contagem, abas, janelas de oferta, Central de Ajuda).
 * Roda depois que o React desenha a página (ver components/Produto.tsx) e devolve uma função de limpeza. */
import { A as ASSETS } from "./config";
import { nxMeta, ttEvento } from "./rastreamento";

const CARRINHO_URL = "/carrinho";
const PRECO = 89.9;
const CONTAGEM_SEGUNDOS = 5 * 60; // a contagem recomeça sozinha quando chega a zero

export function iniciarProduto(): () => void {
  const ctl = new AbortController();
  const signal = ctl.signal;
  const timers: number[] = [];
  const criados: HTMLElement[] = [];

  const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector(s) as T;
  const $$ = <T extends Element = HTMLElement>(s: string) => Array.from(document.querySelectorAll(s)) as T[];
  const on = (el: EventTarget | null, ev: string, fn: (e: any) => void, opts: AddEventListenerOptions = {}) => // eslint-disable-line @typescript-eslint/no-explicit-any
    el && el.addEventListener(ev, fn, { ...opts, signal });

  const ev = (nome: string, extra: Record<string, unknown> = {}) => ttEvento(nome, extra, { value: PRECO });
  ev("ViewContent");

  /* ===== Contagem regressiva ===== */
  let fim = 0;
  try {
    fim = Number(sessionStorage.getItem("vr_fim")) || 0;
  } catch {}
  const novoFim = () => {
    fim = Date.now() + CONTAGEM_SEGUNDOS * 1000;
    try {
      sessionStorage.setItem("vr_fim", String(fim));
    } catch {}
  };
  if (fim < Date.now()) novoFim();
  const p2 = (n: number) => (n < 10 ? "0" : "") + n;
  const tick = () => {
    let s = Math.round((fim - Date.now()) / 1000);
    if (s <= 0) {
      novoFim();
      s = CONTAGEM_SEGUNDOS;
    }
    $("#t-h").textContent = p2(Math.floor(s / 3600));
    $("#t-m").textContent = p2(Math.floor((s % 3600) / 60));
    $("#t-s").textContent = p2(s % 60);
  };
  tick();
  timers.push(window.setInterval(tick, 1000));

  /* ===== Datas de entrega (hoje + 5 a 10 dias) ===== */
  const M = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  const dt = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.getDate() + " de " + M[d.getMonth()];
  };
  $("#entrega").textContent = dt(5) + " – " + dt(10);

  /* ===== Galeria ===== */
  const gal = $("#gal");
  const cur = $("#g-cur");
  const larg = () => gal.clientWidth || 1;
  const idx = () => Math.max(0, Math.min(3, Math.round(gal.scrollLeft / larg())));
  const ir = (i: number) => gal.scrollTo({ left: i * larg(), behavior: "smooth" });
  on(gal, "scroll", () => (cur.textContent = String(idx() + 1)), { passive: true });
  on($("#g-prev"), "click", () => ir((idx() + 3) % 4));
  on($("#g-next"), "click", () => ir((idx() + 1) % 4));

  /* ===== Zoom da foto ===== */
  let zoom: HTMLElement | null = null;
  const esc = (e: KeyboardEvent) => {
    if (e.key === "Escape") fechaZoom();
  };
  function fechaZoom() {
    if (zoom) {
      zoom.remove();
      zoom = null;
      document.removeEventListener("keydown", esc);
    }
  }
  on($("#g-zoom"), "click", () => {
    fechaZoom();
    const src = gal.querySelectorAll("img")[idx()].getAttribute("src");
    zoom = document.createElement("div");
    zoom.className = "scooter-zoom fixed inset-0 z-50 flex items-center justify-center";
    zoom.setAttribute("role", "dialog");
    zoom.setAttribute("aria-modal", "true");
    zoom.setAttribute("aria-label", "Foto ampliada");
    zoom.innerHTML =
      '<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer h-9 w-9 absolute top-4 right-4" aria-label="Fechar foto ampliada">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>' +
      '<img alt="Patinete Elétrico VoltRide Cross Pro" class="w-full max-w-[900px] max-h-[90dvh] object-contain" src="' + src + '">';
    zoom.addEventListener("click", (e) => {
      const t = e.target as HTMLElement;
      if (t === zoom || t.closest("button")) fechaZoom();
    });
    document.body.appendChild(zoom);
    criados.push(zoom);
    document.addEventListener("keydown", esc);
  });

  /* ===== Cores ===== */
  const A = ASSETS + "patinete/";
  const THUMB: Record<string, string> = { Preto: "p1-thumb.webp", Azul: "p-azul-thumb.webp", Rosa: "p-rosa-thumb.webp", Branco: "p-branco-thumb.webp", Laranja: "p-laranja-thumb.webp" };
  const FOTO: Record<string, string> = { Preto: "p1.webp", Azul: "p-azul.webp", Rosa: "p-rosa.webp", Branco: "p-branco.webp", Laranja: "p-laranja.webp" };
  let corAtual = "Preto";
  const CHECK =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check w-2.5 h-2.5 text-white" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';
  function marcar(btn: HTMLElement, ativo: boolean) {
    const box = btn.querySelector(".w-\\[72px\\]") as HTMLElement;
    const nome = btn.querySelector("span:last-child") as HTMLElement;
    const rel = btn.querySelector(".relative") as HTMLElement;
    ["border-[#FE2C55]", "ring-2", "ring-[#FE2C55]/20"].forEach((c) => box.classList[ativo ? "add" : "remove"](c));
    box.classList[ativo ? "remove" : "add"]("border-gray-200");
    nome.className = "text-[11px] " + (ativo ? "text-black font-semibold" : "text-gray-600");
    const t = rel.querySelector(".absolute.top-1");
    if (t) t.remove();
    if (ativo) {
      const d = document.createElement("div");
      d.className = "absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FE2C55] flex items-center justify-center";
      d.innerHTML = CHECK;
      rel.appendChild(d);
    }
  }
  $$("#cores button").forEach((b) => {
    on(b, "click", () => {
      corAtual = b.getAttribute("data-cor") || "Preto";
      $$("#cores button").forEach((x) => marcar(x, x === b));
      $(".px-4.pb-4 p.text-\\[13px\\]").innerHTML = 'Modelo: <span class="font-bold">' + corAtual + "</span>";
      const primeira = gal.querySelector("img") as HTMLImageElement;
      primeira.removeAttribute("srcset");
      primeira.src = A + FOTO[corAtual];
      ir(0);
    });
  });

  /* ===== Abas ===== */
  const abas = $$(".scooter-tab");
  const ativa = (t: HTMLElement) => abas.forEach((a) => a.classList.toggle("is-active", a === t));
  abas.forEach((t) => {
    on(t, "click", () => {
      ativa(t);
      const alvo = document.getElementById(t.getAttribute("data-tab") || "");
      if (!alvo) return;
      const topo = $(".scooter-tabs").offsetHeight;
      window.scrollTo({
        top: alvo.getBoundingClientRect().top + window.scrollY - topo + (t.getAttribute("data-tab") === "patinete-overview" ? -$(".scooter-header").offsetHeight : 0),
        behavior: "smooth",
      });
    });
  });
  on(
    window,
    "scroll",
    () => {
      const linha = $(".scooter-tabs").offsetHeight + 40;
      let ativo = abas[0];
      abas.forEach((t) => {
        const el = document.getElementById(t.getAttribute("data-tab") || "");
        if (el && el.getBoundingClientRect().top <= linha) ativo = t;
      });
      ativa(ativo);
    },
    { passive: true },
  );

  /* ===== Descrição ===== */
  let aberta = false;
  on($("#desc-btn"), "click", () => {
    aberta = !aberta;
    $("#desc").classList.toggle("line-clamp-3", !aberta);
    $("#desc-btn span").textContent = aberta ? "Ver menos" : "Ver mais";
    $<SVGElement>("#desc-btn svg").style.transform = aberta ? "rotate(180deg)" : "";
  });

  /* ===== Seguir ===== */
  const seg = $("#seguir");
  let segue = false;
  on(seg, "click", () => {
    segue = !segue;
    seg.textContent = segue ? "✓ Seguindo" : "+ Seguir";
    seg.className =
      "text-[12px] font-bold px-3 py-1 rounded-full transition-colors " +
      (segue ? "bg-[#FE2C55] text-white border border-[#FE2C55]" : "border border-[#FE2C55] text-[#FE2C55]");
  });

  /* ===== Voltar / Compartilhar ===== */
  on($("#btn-voltar"), "click", () => {
    if (history.length > 1) history.back();
  });
  on($("#btn-share"), "click", () => {
    const d = { title: document.title, url: location.href };
    if (navigator.share) navigator.share(d).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(d.url).catch(() => {});
  });

  /* ===== Janela "Escolha sua oferta" (abre no COMPRAR) ===== */
  const OFERTA: Record<number, { preco: number; antigo: number; nome: string }> = {
    1: { preco: 89.9, antigo: 1299.0, nome: "1 patinete" },
    2: { preco: 182.0, antigo: 2598.0, nome: "2 patinetes" },
  };
  const brl = (v: number) => "R$ " + v.toFixed(2).replace(".", ",");
  const SVG_X =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x w-4 h-4" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';
  const SVG_ZAP =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap w-4 h-4 fill-white" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>';
  const SVG_CHECK =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check w-3.5 h-3.5 text-white" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';
  const SVG_SHIELD =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check w-4 h-4 text-[#00b37e]" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg>';
  const SVG_TRUCK =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-truck w-4 h-4 text-[#FE2C55]" aria-hidden="true"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle></svg>';
  let sheet: HTMLElement | null = null;
  let sQtd = 1;
  let sCor = "Preto";

  function sheetHtml() {
    const o = OFERTA[sQtd];
    const th = A + THUMB[sCor];
    let h =
      '<div class="w-full max-w-[480px] bg-white rounded-t-3xl animate-in slide-in-from-bottom duration-300 max-h-[94vh] overflow-y-auto no-scrollbar">' +
      '<div class="relative bg-gradient-to-r from-[#FE2C55] via-[#FE4370] to-[#FF6B00] pl-4 pr-2 py-2.5 flex items-center gap-2 rounded-t-3xl">' +
      '<div class="flex items-center gap-1.5 text-white flex-shrink-0">' + SVG_ZAP + '<span class="text-[14px] font-extrabold uppercase tracking-wide">Black Friday</span></div>' +
      '<span class="text-[11px] font-semibold text-white/90 flex-1 min-w-0 text-right truncate pr-1">Oferta por tempo limitado</span>' +
      '<button aria-label="Fechar" data-s="fechar" class="flex-shrink-0 w-7 h-7 rounded-full bg-white text-gray-500 flex items-center justify-center shadow-md">' + SVG_X + "</button></div>" +
      '<div class="px-4 pt-3 pb-2 flex items-center gap-3"><img alt="Patinete" class="w-16 h-16 object-contain flex-shrink-0" src="' + th + '">' +
      '<div class="flex-1 min-w-0"><p class="text-[13px] font-semibold text-gray-800 leading-tight">Patinete Elétrico Cross Pro</p>' +
      '<p class="text-[20px] font-extrabold text-[#00b37e] leading-tight mt-0.5">' + brl(o.preco) + "</p>" +
      '<p class="text-[12px] mt-0.5"><span class="text-gray-400 line-through">' + brl(o.antigo) + '</span><span class="font-bold text-[#00b37e]">Economize ' + brl(o.antigo - o.preco) + "</span></p></div></div>" +
      '<div class="px-4 pb-4"><p class="text-[14px] font-bold text-gray-800 mb-2">Escolha sua oferta: <span class="text-gray-900">' + o.nome + '</span></p><div class="grid grid-cols-2 gap-2.5 mb-4">';
    [1, 2].forEach((n) => {
      const ativo = sQtd === n;
      const of = OFERTA[n];
      h += '<button data-q="' + n + '" class="relative rounded-2xl border-2 p-2.5 text-center transition-all ' + (ativo ? "border-[#FE2C55] bg-[#FFF7F9]" : "border-gray-200 bg-white hover:bg-gray-50") + '">';
      if (ativo) h += '<span class="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#FE2C55] flex items-center justify-center shadow">' + SVG_CHECK + "</span>";
      if (n === 2) h += '<span class="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#FE2C55] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap shadow">MAIS VENDIDO</span>';
      h +=
        n === 1
          ? '<div class="h-16 flex items-center justify-center"><img alt="1 patinete" class="max-h-16 object-contain" src="' + th + '"></div>'
          : '<div class="h-16 flex items-center justify-center gap-0.5"><img alt="2 patinetes" class="max-h-16 object-contain -mr-3" src="' + th + '"><img alt="2 patinetes" class="max-h-16 object-contain" src="' + th + '"></div>';
      h +=
        '<p class="text-[13px] font-semibold text-gray-800 mt-1">' + of.nome + '</p><p class="text-[16px] font-extrabold mt-0.5 ' + (ativo ? "text-[#FE2C55]" : "text-gray-800") + '">' + brl(of.preco) + "</p>" +
        '<p class="text-[11px] text-gray-400 line-through">' + brl(of.antigo) + "</p></button>";
    });
    h += '</div><p class="text-[14px] font-bold text-gray-800 mb-2">Modelo: <span class="text-gray-900">' + sCor + '</span></p><div class="grid grid-cols-3 gap-2 mb-3">';
    ["Preto", "Azul", "Rosa", "Branco", "Laranja"].forEach((c) => {
      const ativo = sCor === c;
      h += '<button data-c="' + c + '" class="relative rounded-xl border-2 p-1.5 transition-all ' + (ativo ? "border-[#FE2C55] bg-[#FFF7F9]" : "border-gray-200 bg-white") + '">';
      if (ativo) h += '<span class="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#FE2C55] flex items-center justify-center shadow">' + SVG_CHECK + "</span>";
      if (c === "Preto") h += '<span class="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#FE2C55] text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap shadow">MAIS VENDIDA</span>';
      h +=
        '<div class="h-12 flex items-center justify-center"><img alt="' + c + '" class="max-h-12 object-contain" src="' + A + THUMB[c] + '"></div>' +
        '<p class="text-[11px] font-semibold text-gray-800 text-center mt-0.5">' + c + "</p></button>";
    });
    h +=
      '</div><div class="rounded-xl bg-[#FFF9EC] border border-[#F5E3B3] px-3 py-2 mb-2.5"><p class="text-[11px] text-[#8a6d1f] leading-snug">✨ Todas as variantes têm o <strong>mesmo preço promocional</strong> — escolha a sua preferida sem perder o desconto.</p></div>' +
      '<div class="flex items-center justify-center gap-6 mb-3"><span class="flex items-center gap-1 text-[11px] font-semibold text-gray-600">' + SVG_SHIELD + "Compra segura</span>" +
      '<span class="flex items-center gap-1 text-[11px] font-semibold text-gray-600">' + SVG_TRUCK + "Frete grátis</span></div></div>" +
      '<div class="sticky bottom-0 px-4 pt-1 pb-3 bg-white"><button data-s="confirmar" class="w-full h-12 rounded-full bg-[#FE2C55] text-white text-[15px] font-extrabold tracking-wide shadow-lg shadow-[#FE2C55]/30 active:scale-[0.98] transition-transform">Confirmar compra — ' + brl(o.preco) + "</button></div></div>";
    return h;
  }
  const escSheet = (e: KeyboardEvent) => {
    if (e.key === "Escape") fechaSheet();
  };
  function fechaSheet() {
    if (sheet) {
      sheet.remove();
      sheet = null;
      document.body.style.overflow = "";
      document.removeEventListener("keydown", escSheet);
    }
  }
  const desenhaSheet = () => {
    if (sheet) sheet.innerHTML = sheetHtml();
  };
  function abreSheet() {
    fechaSheet();
    sQtd = 1;
    sCor = corAtual;
    const el = document.createElement("div");
    sheet = el;
    el.className = "fixed inset-0 z-[100] flex items-end justify-center bg-black/50 animate-in fade-in";
    desenhaSheet();
    el.addEventListener("click", (e) => {
      const t = e.target as HTMLElement;
      if (t === el) return fechaSheet();
      const q = t.closest("[data-q]");
      const c = t.closest("[data-c]");
      const s = t.closest("[data-s]");
      if (q) {
        sQtd = Number(q.getAttribute("data-q"));
        desenhaSheet();
      } else if (c) {
        sCor = c.getAttribute("data-c") || "Preto";
        desenhaSheet();
      } else if (s && s.getAttribute("data-s") === "fechar") fechaSheet();
      else if (s && s.getAttribute("data-s") === "confirmar") {
        ev("InitiateCheckout", { value: OFERTA[sQtd].preco, content_name: "Patinete VoltRide Cross Pro - " + sCor + " x" + sQtd });
        nxMeta("AddToCart", [{ slug: "patinete-cross-pro-" + (sQtd === 2 ? "2un" : "1un"), quantidade: 1 }]);
        const u = new URL(CARRINHO_URL, location.href);
        u.searchParams.set("cor", sCor === "Preto" ? "Padrão" : sCor);
        u.searchParams.set("qtd", String(sQtd));
        new URLSearchParams(location.search).forEach((v, k) => {
          if (!u.searchParams.has(k)) u.searchParams.set(k, v);
        }); // leva camp, tk, ttclid junto
        location.href = u.toString();
      }
    });
    document.body.appendChild(el);
    criados.push(el);
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", escSheet);
  }
  on($("#comprar"), "click", abreSheet);

  /* ===== Adicionar ao carrinho: só aumenta o número da sacola ===== */
  let nCarrinho = 0;
  on($("#add-cart"), "click", () => {
    nCarrinho++;
    const bag = $('button[aria-label="Carrinho"]');
    let badge = bag.querySelector(".scooter-cart-count");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "scooter-cart-count";
      bag.appendChild(badge);
    }
    badge.textContent = String(nCarrinho);
    ev("AddToCart", { content_name: "Patinete VoltRide Cross Pro - " + corAtual });
    nxMeta("AddToCart", [{ slug: "patinete-cross-pro-1un", quantidade: 1 }]);
  });

  /* ===== Avaliações extras, Central de Ajuda, "Promoção Relâmpago", linhas clicáveis ===== */
  const btnRev = document.querySelector("#patinete-reviews button.mt-4");
  if (btnRev) {
    let abertas = false;
    const iconeRev = btnRev.querySelector("svg");
    on(btnRev, "click", () => {
      abertas = !abertas;
      document.querySelectorAll("[data-extra-rev]").forEach((d) => d.classList.toggle("hidden", !abertas));
      btnRev.childNodes[0].textContent = abertas ? "Ver menos avaliações" : "Ver mais avaliações (8)";
      if (iconeRev) iconeRev.style.transform = abertas ? "rotate(180deg)" : "";
    });
  }
  on(document.querySelector(".scooter-gift-row"), "click", abreSheet);
  on(document.querySelector(".scooter-free-shipping"), "click", () => {
    const e = document.getElementById("patinete-delivery");
    if (e) e.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const FAQ: [string, string][] = [
    ["Qual o prazo de entrega?", "Envio em até 24h após confirmação do pagamento. Prazo de 5 a 10 dias úteis para todo o Brasil, com código de rastreio enviado por e-mail."],
    ["O frete é realmente grátis?", "Sim! Frete 100% grátis para todo o Brasil nesta oferta promocional."],
    ["Quais são as formas de pagamento?", "Aceitamos PIX com aprovação instantânea."],
    ["O patinete é original e tem garantia?", "Sim! Produto 100% original VoltRide, com nota fiscal e garantia de 1 ano contra defeitos de fabricação."],
    ["Qual a autonomia real da bateria?", "Até 45 km por carga em condições normais (usuário até 80 kg, terreno plano, modo eco). Em uso misto urbano o real costuma ficar entre 35 e 40 km."],
    ["Posso usar na chuva?", "Sim, o Cross Pro tem proteção IP54 contra respingos de água. Evite alagamentos e jatos diretos para preservar a vida útil da bateria."],
    ["Quanto tempo leva para carregar?", "De 4 a 6 horas para carga completa usando o carregador bivolt original que acompanha o produto."],
    ["Posso trocar caso não goste?", "Sim. Você tem até 7 dias após o recebimento para solicitar troca ou devolução, conforme o CDC."],
  ];
  const SV_Q =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-question-mark w-5 h-5 text-[#FE2C55]" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>';
  const SV_D =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down w-4 h-4 text-gray-400 flex-shrink-0 transition-transform" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>';
  let ajuda: HTMLElement | null = null;
  let faqAberta = 0;
  function desenhaAjuda() {
    if (!ajuda) return;
    let h =
      '<div class="w-full max-w-[480px] bg-white rounded-t-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col"><div class="flex items-center justify-between px-4 py-3 border-b border-gray-100"><div class="flex items-center gap-2">' +
      SV_Q +
      '<h3 class="text-[15px] font-bold text-black">Central de Ajuda</h3></div><button class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center" aria-label="Fechar" data-f="x">' +
      SVG_X.replace("w-4 h-4", "w-4 h-4 text-black") +
      '</button></div><div class="overflow-y-auto px-4 py-4 no-scrollbar"><div class="space-y-2">';
    FAQ.forEach((f, i) => {
      h +=
        '<div class="border border-gray-100 rounded-xl overflow-hidden"><button class="w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left" data-f="' + i + '"><span class="text-[13px] font-semibold text-black pr-2">' + f[0] + "</span>" +
        SV_D.replace("transition-transform", "transition-transform" + (faqAberta === i ? " rotate-180" : "")) +
        "</button>" +
        (faqAberta === i ? '<div class="px-3.5 pb-3 -mt-1"><p class="text-[12px] text-gray-600 leading-relaxed">' + f[1] + "</p></div>" : "") +
        "</div>";
    });
    ajuda.innerHTML = h + "</div></div></div>";
  }
  function fechaAjuda() {
    if (ajuda) {
      ajuda.remove();
      ajuda = null;
      document.body.style.overflow = "";
    }
  }
  function abreAjuda() {
    fechaAjuda();
    faqAberta = 0;
    const el = document.createElement("div");
    ajuda = el;
    el.className = "fixed inset-0 z-[60] flex items-end justify-center bg-black/50 animate-in fade-in";
    el.addEventListener("click", (e) => {
      const t = e.target as HTMLElement;
      if (t === el) return fechaAjuda();
      const b = t.closest("[data-f]");
      if (!b) return;
      const v = b.getAttribute("data-f");
      if (v === "x") return fechaAjuda();
      faqAberta = faqAberta === Number(v) ? -1 : Number(v);
      desenhaAjuda();
    });
    desenhaAjuda();
    document.body.appendChild(el);
    criados.push(el);
    document.body.style.overflow = "hidden";
  }
  on(document.querySelectorAll(".scooter-nav-tool")[1] || null, "click", abreAjuda);

  /* "Promoção Relâmpago": abre pelo ícone do carrinho; Confirmar leva à janela "Escolha sua oferta" com a cor escolhida */
  const SV_CK = SVG_CHECK.replace("w-3.5 h-3.5", "w-2.5 h-2.5");
  const SV_SH = SVG_SHIELD.replace("w-4 h-4 text-[#00b37e]", "w-3.5 h-3.5 text-[#00B894]").replace("lucide-shield-check", "lucide-shield");
  const SV_TR = SVG_TRUCK.replace("w-4 h-4 text-[#FE2C55]", "w-3.5 h-3.5 text-[#FE2C55]");
  let promo: HTMLElement | null = null;
  let corPromo = "Preto";
  function desenhaPromo() {
    if (!promo) return;
    let h =
      '<div class="w-full max-w-[480px] bg-white rounded-t-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden"><div class="bg-gradient-to-r from-[#FF7A00] to-[#FF5C00] text-white flex items-center justify-between px-4 py-2.5"><div class="flex items-center gap-1.5">' +
      SVG_ZAP +
      '<span class="text-[13px] font-extrabold">Promoção Relâmpago</span></div><span class="text-[11px] font-medium opacity-95">Oferta por tempo limitado</span></div>' +
      '<div class="px-4 pt-3 pb-2 flex gap-3 items-center"><div class="w-14 h-14 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center"><img alt="Patinete Elétrico VoltRide Cross Pro 500W" class="w-full h-full object-contain" src="' + A + 'p1.webp"></div><div class="flex-1 min-w-0">' +
      '<p class="text-[13px] font-semibold text-black leading-snug">Patinete Elétrico VoltRide Cross Pro 500W</p><div class="flex items-baseline gap-2 mt-0.5"><span class="text-[18px] font-extrabold text-[#00B894]">R$ 89,90</span><span class="text-[12px] text-gray-400 line-through">R$ 1299,00</span></div></div></div>' +
      '<div class="px-4 pt-2 pb-3"><p class="text-[13px] text-black mb-2.5">Modelo: <span class="font-bold">' + corPromo + '</span></p><div class="flex items-start gap-3 pt-3">';
    ["Preto", "Azul", "Rosa", "Branco", "Laranja"].forEach((c) => {
      const ativo = corPromo === c;
      h +=
        '<button class="flex flex-col items-center gap-1 flex-shrink-0" aria-label="Selecionar cor ' + c + '" data-pc="' + c + '"><div class="relative">' +
        (c === "Preto" ? '<span class="absolute -top-2.5 left-0 z-10 bg-[#FE2C55] text-white text-[8px] font-extrabold px-1.5 py-[3px] rounded-t-md rounded-br-md whitespace-nowrap leading-none">MAIS VENDIDA</span>' : "") +
        '<div class="w-[64px] h-[64px] rounded-lg overflow-hidden bg-white border-2 flex items-center justify-center relative shadow-sm ' + (ativo ? "border-[#FE2C55] ring-2 ring-[#FE2C55]/20 rounded-tl-none" : "border-gray-200 ") + '"><img alt="' + c + '" class="w-full h-full object-contain " src="' + A + THUMB[c] + '"></div>' +
        (ativo ? '<div class="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FE2C55] flex items-center justify-center">' + SV_CK + "</div>" : "") +
        '</div><span class="text-[11px] ' + (ativo ? "text-black font-semibold" : "text-gray-600") + '">' + c + "</span></button>";
    });
    h +=
      '</div></div><div class="px-4 py-2.5 flex items-center justify-center gap-5 border-t border-gray-100"><div class="flex items-center gap-1.5 text-[11px] text-gray-700">' + SV_SH + '<span>Compra segura</span></div><div class="flex items-center gap-1.5 text-[11px] text-gray-700">' + SV_TR + "<span>Frete grátis</span></div></div>" +
      '<div class="bg-gray-50 px-4 py-3 pb-5"><button class="w-full h-12 rounded-full bg-[#FE2C55] text-white text-[14px] font-extrabold tracking-wide shadow-lg shadow-[#FE2C55]/30 active:scale-[0.98] transition" data-pc-ok="1">Confirmar compra — R$ 89,90</button></div></div>';
    promo.innerHTML = h;
  }
  function fechaPromo() {
    if (promo) {
      promo.remove();
      promo = null;
      document.body.style.overflow = "";
    }
  }
  function abrePromo() {
    fechaPromo();
    corPromo = corAtual;
    const el = document.createElement("div");
    promo = el;
    el.className = "fixed inset-0 z-50 flex items-end justify-center bg-black/50";
    el.addEventListener("click", (e) => {
      const t = e.target as HTMLElement;
      if (t === el) return fechaPromo();
      const c = t.closest("[data-pc]");
      const ok = t.closest("[data-pc-ok]");
      if (c) {
        corPromo = c.getAttribute("data-pc") || "Preto";
        desenhaPromo();
      } else if (ok) {
        const botao = document.querySelector('#cores [data-cor="' + corPromo + '"]') as HTMLElement | null;
        if (botao) botao.click(); // a página também troca de cor
        fechaPromo();
        abreSheet();
      }
    });
    desenhaPromo();
    document.body.appendChild(el);
    criados.push(el);
    document.body.style.overflow = "hidden";
  }
  on(document.querySelector('button[aria-label="Carrinho"]'), "click", abrePromo);
  nxMeta("ViewContent", [{ slug: "patinete-cross-pro-1un", quantidade: 1 }]);

  return () => {
    ctl.abort();
    timers.forEach((t) => clearInterval(t));
    criados.forEach((el) => el.remove());
    document.removeEventListener("keydown", esc);
    document.removeEventListener("keydown", escSheet);
    document.body.style.overflow = "";
  };
}
