import { NextResponse } from "next/server";
import { MODO_TESTE } from "@/lib/gateway";

/** Usado pelo atalho ?dev=1 do checkout: só funciona enquanto o gateway está em modo teste. */
export async function GET() {
  return NextResponse.json({ mock: MODO_TESTE });
}
