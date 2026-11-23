"use client";

import { useEffect } from "react";
import ProdutoMarkup from "./ProdutoMarkup";
import { iniciarProduto } from "@/lib/produto";

/** Página do produto: o visual fica em ProdutoMarkup.tsx e as interações em lib/produto.ts */
export default function Produto() {
  useEffect(() => iniciarProduto(), []);
  return <ProdutoMarkup />;
}
