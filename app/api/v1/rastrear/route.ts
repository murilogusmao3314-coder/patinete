import { NextResponse } from "next/server";
import { aprovadoNoTeste } from "@/lib/gateway";
import { dataDoCodigo } from "@/lib/pedido";

export const dynamic = "force-dynamic";

/** Rastreio do pedido. Sem banco de dados ainda: a data vem do próprio código do pedido. */
export async function GET(req: Request) {
  const codigo = (new URL(req.url).searchParams.get("codigo") || "").trim().toUpperCase();
  if (!codigo) return NextResponse.json({ detail: "Informe o código" }, { status: 400 });
  const criado = dataDoCodigo(codigo);
  if (!criado) return NextResponse.json({ detail: "Pedido não encontrado" }, { status: 404 });
  // TODO: buscar o status real do pedido no banco de dados / gateway
  const status = aprovadoNoTeste(criado) ? "pago" : "aguardando";
  return NextResponse.json({ codigo, status, criado_em: new Date(criado).toISOString() });
}
