# Patinete VoltRide — Loja

Cópia do site `achadinhosweb.com/patinete` em **Next.js + Tailwind**, pronta para o **v0** e a **Vercel**.

## Páginas

| Rota | O que é |
|---|---|
| `/` | Página do produto (galeria, cores, contador, avaliações, Central de Ajuda, janelas "Escolha sua oferta" e "Promoção Relâmpago") |
| `/carrinho` | Carrinho com produtos extras (+15% OFF ao levar 1 extra) |
| `/checkout` | Checkout em 3 passos: **Dados → Revisão → Pagamento (PIX)**. Tem frete (Grátis/Econômico/Full), order bump (cadeado e suporte), brindes e a oferta de saída "Espera! Oferta exclusiva" |
| `/pedido-concluido` | Confirmação do pedido + botão de rastreio |
| `/rastreio` | Rastreamento pelo código do pedido |
| `/contato`, `/termos-uso`, `/politica-privacidade` | Páginas institucionais |

Os endereços antigos (`carrinho.html`, `checkout.html`...) redirecionam para os novos.

## Pagamento (PinguPag) e Utmify

- **PIX:** integrado com a **PinguPag** (`lib/gateway.ts`). Cadastre `PINGUPAG_API_KEY` na Vercel.
  Sem a chave, o checkout fica em **modo teste** (PIX fictício, não recebe dinheiro).
- **Confirmação do pagamento:** o checkout consulta a PinguPag a cada poucos segundos e a PinguPag também avisa
  o site pelo webhook `/api/v1/webhook/pingupag` (enviado automaticamente em cada PIX, não precisa configurar no painel).
- **Utmify:** cadastre `UTMIFY_API_TOKEN`. O site envia a venda como "aguardando pagamento" quando o PIX é gerado
  e como "pago" quando é confirmado, com produtos, cliente e UTMs (`utm_*`, `src`, `sck`) da URL.
- **Rastreio:** consulta o status do pedido direto na PinguPag.

Para testar sem a PinguPag: deixe `PINGUPAG_API_KEY` vazio e use `GATEWAY_TESTE_APROVAR_SEGUNDOS=10`.
Também dá para abrir `/checkout?dev=1` para pular o formulário com dados de exemplo.

## Onde mudar as coisas

- **Preços, produtos extras, IDs de pixel (TikTok, Clarity, Xtracky):** `lib/config.ts`
- **Gateway PinguPag:** `lib/gateway.ts` · **Utmify:** `lib/utmify.ts`
- **Textos e layout da página do produto:** `components/ProdutoMarkup.tsx`
- **Interações da página do produto:** `lib/produto.ts`
- **Carrinho / Checkout / Rastreio:** `components/Carrinho.tsx`, `components/Checkout.tsx`, `components/Rastreio.tsx`
- **Imagens:** `public/assets/`
- **Visual original (CSS):** `app/loja.css` — classes novas do Tailwind funcionam normalmente

## Variáveis de ambiente (Vercel)

Veja `.env.example`: `PINGUPAG_API_KEY`, `UTMIFY_API_TOKEN`, `SITE_URL` e `GATEWAY_TESTE_APROVAR_SEGUNDOS`.

## Rodar no computador

```bash
npm install
npm run dev
```
