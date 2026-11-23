"use client";

import { useEffect } from "react";
import { iniciarTikTok } from "@/lib/rastreamento";

/** Carrega o pixel do TikTok uma vez por página. */
export default function Rastreamento() {
  useEffect(() => {
    iniciarTikTok();
  }, []);
  return null;
}
