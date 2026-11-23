import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** ID do pixel da Meta (variável META_PIXEL_ID na Vercel). */
export async function GET() {
  return NextResponse.json({ pixels: { meta_pixel_id: process.env.META_PIXEL_ID || "" } });
}
