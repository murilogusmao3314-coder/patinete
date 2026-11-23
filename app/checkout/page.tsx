import type { Metadata } from "next";
import Checkout from "@/components/Checkout";

export const metadata: Metadata = { title: "UltraTech — Finalizar compra", robots: { index: false } };

export default function Page() {
  return <Checkout />;
}
