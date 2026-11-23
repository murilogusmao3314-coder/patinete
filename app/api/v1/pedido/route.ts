import { NextResponse } from "next/server";
import { EXTRAS, FRETE_PRECO, PRECOS, r2 } from "@/lib/config";
import { MODO_TESTE, criarCobranca } from "@/lib/gateway";
import { cnpjValido, cpfValido, novoCodigo } from "@/lib/pedido";
import { PedidoUtmify, dataUtc, enviarUtmify, trackingDe } from "@/lib/utmify";

type Corpo = {
  cliente?: Record<string, string>;
  itens?: { slug: string; quantidade?: number }[];
  frete?: string;
  metodo?: string;
  origem?: Record<string, string>;
};

const erro = (campo: string, msg: string) => NextResponse.json({ detail: [{ loc: ["body", "cliente", campo], msg }] }, { status: 422 });

/** Nome de cada item do catálogo (para o gateway e a Utmify) */
function nomeDoItem(slug: string) {
  if (slug.startsWith("patinete-cross-pro-")) return "Patinete Elétrico VoltRide Cross Pro 500W" + (slug.includes("2un") ? " (2 unidades)" : "");
  if (slug.startsWith("patinete-extra-")) return EXTRAS[slug.replace("patinete-extra-", "")]?.nome || slug;
  if (slug === "patinete-bump-cadeado") return "Cadeado Antifurto com Senha";
  if (slug === "patinete-bump-suporte") return "Suporte de Celular para Guidão";
  return slug;
}
const FRETE_NOME: Record<string, string> = { "patinete-economico": "Frete Envio Econômico", "patinete-full": "Frete Envio Full" };

/** Cria o pedido e a cobrança PIX. O total é recalculado aqui (não confia no navegador). */
export async function POST(req: Request) {
  let b: Corpo;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ detail: "Pedido inválido" }, { status: 400 });
  }
  const c = b.cliente || {};
  const nome = String(c.nome || "").trim();
  const cpf = String(c.cpf || "").replace(/\D/g, "");
  const email = String(c.email || "").trim();
  const telefone = String(c.telefone || "").replace(/\D/g, "");

  if (nome.split(/\s+/).length < 2) return erro("nome", "Informe nome e sobrenome");
  if (!(MODO_TESTE && !cpf) && !(cpf.length === 11 ? cpfValido(cpf) : cnpjValido(cpf))) return erro("cpf", "CPF inválido");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro("email", "E-mail inválido");

  const itens = Array.isArray(b.itens) ? b.itens : [];
  if (!itens.length || !String(itens[0].slug).startsWith("patinete-cross-pro-")) return NextResponse.json({ detail: "Carrinho vazio" }, { status: 400 });
  const produtos: { id: string; name: string; quantity: number; priceInCents: number }[] = [];
  let total = 0;
  for (const i of itens) {
    const p = PRECOS[i.slug];
    const q = Math.max(1, Math.min(5, Number(i.quantidade) || 1));
    if (p === undefined) return NextResponse.json({ detail: "Produto inválido: " + i.slug }, { status: 400 });
    total += p * q;
    produtos.push({ id: i.slug, name: nomeDoItem(i.slug), quantity: q, priceInCents: Math.round(p * 100) });
  }
  const freteCod = b.frete || "gratis";
  const frete = FRETE_PRECO[freteCod];
  if (frete === undefined) return NextResponse.json({ detail: "Frete inválido" }, { status: 400 });
  if (frete > 0) produtos.push({ id: freteCod, name: FRETE_NOME[freteCod] || "Frete", quantity: 1, priceInCents: Math.round(frete * 100) });
  total = r2(total + frete);

  const codigo = novoCodigo();
  const origem = b.origem || {};
  const tracking = trackingDe(origem);
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined;
  const site = process.env.SITE_URL || new URL(req.url).origin;
  const venda: PedidoUtmify = {
    orderId: codigo,
    createdAt: dataUtc(),
    totalInCents: Math.round(total * 100),
    customer: { name: nome, email, phone: telefone || null, document: cpf || null, ip },
    products: produtos,
    tracking,
  };

  try {
    const pg = await criarCobranca({
      codigoPedido: codigo,
      valor: total,
      descricao: produtos.map((p) => p.name).join(" + ").slice(0, 200),
      cliente: { nome, email, cpf, telefone },
      endereco: { rua: c.endereco || "", numero: c.numero || "", complemento: c.complemento || "", bairro: c.bairro || "", cidade: c.cidade || "", uf: c.uf || "", cep: c.cep || "" },
      tracking: { ...tracking },
      postbackUrl: site + "/api/v1/webhook/pingupag",
      extra: { utmify: venda, cor: origem.cor || "" },
    });
    await enviarUtmify(venda, "waiting_payment");
    return NextResponse.json({ codigo, total, pagamento: pg });
  } catch (e) {
    console.error("Erro ao gerar PIX", e);
    const motivo = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ detail: "Não foi possível gerar o pagamento agora. (" + motivo.slice(0, 160) + ")" }, { status: 502 });
  }
}
