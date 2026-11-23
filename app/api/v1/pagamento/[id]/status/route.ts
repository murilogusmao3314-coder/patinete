import { NextResponse } from "next/server";
import { sincronizarVenda } from "@/lib/vendas";

export const dynamic = "force-dynamic";

/** O checkout consulta aqui se o PIX já foi pago. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const st = await sincronizarVenda(id);
    return NextResponse.json({ pago: st.status === "pago" });
  } catch {
    return NextResponse.json({ pago: false });
  }
}
