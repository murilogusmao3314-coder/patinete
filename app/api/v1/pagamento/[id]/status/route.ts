import { NextResponse } from "next/server";
import { consultarPagamento } from "@/lib/gateway";

export const dynamic = "force-dynamic";

/** O checkout consulta aqui se o PIX já foi pago. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json({ pago: await consultarPagamento(id) });
  } catch {
    return NextResponse.json({ pago: false });
  }
}
