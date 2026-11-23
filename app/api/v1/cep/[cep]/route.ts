import { NextResponse } from "next/server";

/** CEP -> endereço (ViaCEP). 404 quando o CEP não existe. */
export async function GET(_req: Request, { params }: { params: Promise<{ cep: string }> }) {
  const cep = (await params).cep.replace(/\D/g, "");
  if (cep.length !== 8) return NextResponse.json({ detail: "CEP inválido" }, { status: 404 });
  try {
    const r = await fetch("https://viacep.com.br/ws/" + cep + "/json/", { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 } });
    const v = await r.json();
    if (!v || v.erro) return NextResponse.json({ detail: "CEP não encontrado" }, { status: 404 });
    return NextResponse.json({ cep, logradouro: v.logradouro || "", bairro: v.bairro || "", cidade: v.localidade || "", uf: v.uf || "" });
  } catch {
    return NextResponse.json({ detail: "Serviço de CEP indisponível" }, { status: 502 });
  }
}
