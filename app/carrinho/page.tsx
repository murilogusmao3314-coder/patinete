import type { Metadata } from "next";
import Carrinho from "@/components/Carrinho";

export const metadata: Metadata = { title: "UltraTech — Seu carrinho", robots: { index: false } };

export default function Page() {
  return <Carrinho />;
}
