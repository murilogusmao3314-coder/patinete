import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Rastreamento from "@/components/Rastreamento";
import { CLARITY_ID } from "@/lib/config";
import "./globals.css";
import "./loja.css";

export const metadata: Metadata = {
  title: "Patinete VoltRide Cross Pro — Oferta Black Friday",
  description: "Patinete elétrico dobrável com bateria de longa duração, garantia e frete grátis para todo o Brasil. Oferta por tempo limitado.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Rastreamento />
        <Script id="clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      </body>
    </html>
  );
}
