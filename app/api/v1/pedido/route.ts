import { NextResponse } from "next/server";
import { FRETE_PRECO, PRECOS, r2 } from "@/lib/config";
import { MODO_TESTE, criarCobranca } from "@/lib/gateway";
import { cnpjValido, cpfValido, novoCodigo } from "@/lib/pedido";

type Corpo = {
  cliente?: Record<string, string>;
  itens?: { slug: string; quantidade?: number }[];
  frete?: string;
  metodo?: string;
  origem?: Record<string, string>;
};

const erro = (campo: string, msg: string) => NextResponse.json({ detail: [{ loc: ["body", "cliente", campo], msg }] }, { status: 422 });

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

  if (nome.split(/\s+/).length < 2) return erro("nome", "Informe nome e sobrenome");
  if (!(MODO_TESTE && !cpf) && !(cpf.length === 11 ? cpfValido(cpf) : cnpjValido(cpf))) return erro("cpf", "CPF inválido");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro("email", "E-mail inválido");

  const itens = Array.isArray(b.itens) ? b.itens : [];
  if (!itens.length || !itens[0].slug.startsWith("patinete-cross-pro-")) return NextResponse.json({ detail: "Carrinho vazio" }, { status: 400 });
  let total = 0;
  for (const i of itens) {
    const p = PRECOS[i.slug];
    const q = Math.max(1, Math.min(5, Number(i.quantidade) || 1));
    if (p === undefined) return NextResponse.json({ detail: "Produto inválido: " + i.slug }, { status: 400 });
    total += p * q;
  }
  const frete = FRETE_PRECO[b.frete || "gratis"];
  if (frete === undefined) return NextResponse.json({ detail: "Frete inválido" }, { status: 400 });
  total = r2(total + frete);

  const codigo = novoCodigo();
  try {
    const pg = await criarCobranca({ codigoPedido: codigo, valor: total, cliente: { nome, email, cpf, telefone: String(c.telefone || "") } });
    // TODO: salvar o pedido (cliente, endereço, itens, origem) num banco de dados quando integrar o gateway
    return NextResponse.json({ codigo, total, pagamento: pg });
  } catch {
    return NextResponse.json({ detail: "Não foi possível gerar o pagamento agora." }, { status: 502 });
  }
}
