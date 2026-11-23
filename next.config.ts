import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mantém os endereços antigos (.html) funcionando
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/carrinho.html", destination: "/carrinho", permanent: true },
      { source: "/checkout.html", destination: "/checkout", permanent: true },
      { source: "/pedido-concluido.html", destination: "/pedido-concluido", permanent: true },
      { source: "/rastreio.html", destination: "/rastreio", permanent: true },
      { source: "/contato.html", destination: "/contato", permanent: true },
      { source: "/politica-privacidade.html", destination: "/politica-privacidade", permanent: true },
      { source: "/termos-uso.html", destination: "/termos-uso", permanent: true },
    ];
  },
};

export default nextConfig;
