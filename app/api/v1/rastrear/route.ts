import { NextResponse } from "next/server";
import { MODO_TESTE, aprovadoNoTeste, consultarPorPedido } from "@/lib/gateway";
import { dataDoCodigo } from "@/lib/pedido";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { pago: "pago", aguardando: "aguardando", cancelado: "cancelado", reembolsado: "cancelado" };

/** Rastreio do pedido: consulta o status na PinguPag pelo código do pedido. */
export async function GET(req: Request) {
  const codigo = (new URL(req.url).searchParams.get("codigo") || "").trim().toUpperCase();
  if (!codigo) return NextResponse.json({ detail: "Informe o código" }, { status: 400 });
  const criado = dataDoCodigo(codigo);
  if (!criado) return NextResponse.json({ detail: "Pedido não encontrado" }, { status: 404 });
  if (MODO_TESTE) return NextResponse.json({ codigo, status: aprovadoNoTeste(criado) ? "pago" : "aguardando", criado_em: new Date(criado).toISOString() });
  try {
    const t = await consultarPorPedido(codigo);
    if (!t) return NextResponse.json({ detail: "Pedido não encontrado" }, { status: 404 });
    return NextResponse.json({ codigo, status: STATUS[t.status] || "aguardando", criado_em: new Date(criado).toISOString() });
  } catch {
    return NextResponse.json({ detail: "Erro ao consultar" }, { status: 502 });
  }
}
