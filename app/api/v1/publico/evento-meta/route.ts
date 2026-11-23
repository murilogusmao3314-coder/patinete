import { NextResponse } from "next/server";
import { PRECOS } from "@/lib/config";

/** API de Conversões da Meta: repete no servidor o evento do navegador (mesmo event_id, a Meta conta uma vez só).
 *  Só envia quando META_PIXEL_ID e META_ACCESS_TOKEN estão configurados na Vercel. */
export async function POST(req: Request) {
  const pixel = process.env.META_PIXEL_ID;
  const token = process.env.META_ACCESS_TOKEN;
  if (!pixel || !token) return new NextResponse(null, { status: 204 });
  try {
    const b = await req.json();
    const meta = b.meta || {};
    const user_data: Record<string, unknown> = {
      client_ip_address: (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined,
      client_user_agent: req.headers.get("user-agent") || undefined,
      fbp: meta.fbp || undefined,
      fbc: meta.fbc || undefined,
      external_id: meta.external_id || undefined,
    };
    for (const k of ["em", "ph", "fn", "ln", "ct", "st"]) if (meta[k]) user_data[k] = [meta[k]];
    const itens: { slug: string; quantidade?: number }[] = Array.isArray(b.itens) ? b.itens : [];
    const valor = itens.reduce((s, i) => s + (PRECOS[i.slug] || 0) * (i.quantidade || 1), 0);
    const origem = req.headers.get("origin") || "";
    const evento = {
      event_name: String(b.event_name || "PageView"),
      event_time: Number(b.event_time) || Math.floor(Date.now() / 1000),
      event_id: String(b.event_id || ""),
      action_source: "website",
      event_source_url: origem + String(b.caminho || "/"),
      user_data,
      custom_data: itens.length ? { currency: "BRL", value: Math.round(valor * 100) / 100, content_type: "product", content_ids: itens.map((i) => i.slug) } : undefined,
    };
    await fetch("https://graph.facebook.com/v21.0/" + pixel + "/events?access_token=" + encodeURIComponent(token), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [evento] }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {}
  return new NextResponse(null, { status: 204 });
}
