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

## ⚠️ Gateway de pagamento: NÃO integrado

O checkout está em **modo teste**: o PIX gerado usa uma chave fictícia e **não recebe dinheiro**.
Para integrar, edite só o arquivo **`lib/gateway.ts`** (funções `criarCobranca` e `consultarPagamento`).

Para testar o fluxo inteiro até "Pedido concluído", configure `GATEWAY_TESTE_APROVAR_SEGUNDOS=10`
(o PIX é aprovado sozinho depois de 10 s). Também dá para abrir `/checkout?dev=1` para pular o formulário com dados de exemplo.

## Onde mudar as coisas

- **Preços, produtos extras, IDs de pixel (TikTok, Clarity, Xtracky):** `lib/config.ts`
- **Textos e layout da página do produto:** `components/ProdutoMarkup.tsx`
- **Interações da página do produto:** `lib/produto.ts`
- **Carrinho / Checkout / Rastreio:** `components/Carrinho.tsx`, `components/Checkout.tsx`, `components/Rastreio.tsx`
- **Imagens:** `public/assets/`
- **Visual original (CSS):** `app/loja.css` — classes novas do Tailwind funcionam normalmente

## Variáveis de ambiente (Vercel)

Veja `.env.example`: `META_PIXEL_ID`, `META_ACCESS_TOKEN` e `GATEWAY_TESTE_APROVAR_SEGUNDOS`.

## Rodar no computador

```bash
npm install
npm run dev
```
