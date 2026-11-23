import type { Metadata } from "next";
import Rastreio from "@/components/Rastreio";

export const metadata: Metadata = { title: "UltraTech — Rastrear pedido", robots: { index: false } };

export default function Page() {
  return <Rastreio />;
}
