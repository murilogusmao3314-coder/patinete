import { NextResponse } from "next/server";
import { sincronizarVenda } from "@/lib/vendas";

export const dynamic = "force-dynamic";

/** Webhook (postback) da PinguPag. Não confia no conteúdo recebido:
 *  consulta a transação na própria PinguPag antes de avisar a Utmify. */
export async function POST(req: Request) {
  let b: Record<string, unknown> = {};
  try {
    b = await req.json();
  } catch {}
  const id = String(b.transaction_id || b.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const st = await sincronizarVenda(id);
    return NextResponse.json({ ok: true, status: st.status });
  } catch (e) {
    console.error("Webhook PinguPag", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
