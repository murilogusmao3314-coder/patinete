import type { Metadata } from "next";
import PedidoConcluido from "@/components/PedidoConcluido";

export const metadata: Metadata = { title: "UltraTech — Pedido concluído", robots: { index: false } };

export default function Page() {
  return <PedidoConcluido />;
}
