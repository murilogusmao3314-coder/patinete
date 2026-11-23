import { NextResponse } from "next/server";
import { MODO_TESTE } from "@/lib/gateway";

export const dynamic = "force-dynamic";

/** Mostra se o gateway está ligado (abra /api/dev/config no navegador para conferir).
 *  Também é usado pelo atalho ?dev=1 do checkout, que só funciona no modo teste. */
export async function GET() {
  return NextResponse.json({
    mock: MODO_TESTE,
    pingupag: MODO_TESTE ? "DESLIGADO (falta a variável PINGUPAG_API_KEY)" : "ligado",
    utmify: process.env.UTMIFY_API_TOKEN ? "ligado" : "desligado (falta UTMIFY_API_TOKEN)",
  });
}
