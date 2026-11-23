"use client";

import { useEffect } from "react";
import { iniciarMeta, iniciarTikTok } from "@/lib/rastreamento";

/** Carrega o pixel do TikTok e o da Meta uma vez por página. */
export default function Rastreamento() {
  useEffect(() => {
    iniciarTikTok();
    iniciarMeta();
  }, []);
  return null;
}
