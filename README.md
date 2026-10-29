# NFT Marketplace — Desafio Frontend Jungle Gaming

Implementação do desafio Frontend da Jungle Gaming. O enunciado original está em [Jungle_Gaming_README_OFICIAL_COMPLETO.md](Jungle_Gaming_README_OFICIAL_COMPLETO.md), e as decisões técnicas estão em [ARCHITECTURE.md](ARCHITECTURE.md).

> **Status:** fundação, prova técnica de tempo real (Socket.IO + MSW) e Home com catálogo funcional concluídas. Detalhe do NFT, carrinho, checkout e conta ainda não foram implementados.

## Rotas

| Rota            | Conteúdo                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------- |
| `/`             | Home: hero, catálogo com busca, filtros, ordenação e paginação, destaques, blog e rodapé. |
| `/nfts/:nftId`  | Provisória: indica que o detalhe do NFT ainda está em construção.                         |
| `/diagnostico`  | Página técnica: status da API (`/api/health`) e demonstração de tempo real.               |

## Requisitos

- Node.js 22.12 ou superior (validado com Node 24.18 e npm 11.16)

## Setup

```bash
npm install
npx playwright install chromium   # necessário apenas para os testes E2E
```

## Variáveis de ambiente

| Variável            | Padrão | Descrição                                                                 |
| ------------------- | ------ | ------------------------------------------------------------------------- |
| `VITE_ENABLE_MOCKS` | —      | `true` inicia o MSW antes da renderização e ativa a API simulada.          |
| `VITE_API_BASE_URL` | `/api` | URL base das chamadas REST. É usada tanto pelo Axios quanto pelo MSW.      |
| `VITE_SOCKET_URL`   | origem da página | Origem do servidor Socket.IO, usada pelo `socket.io-client` e pelo MSW. |

Arquivos versionados:

- `.env.development`: mocks ativados (`npm run dev`).
- `.env.demo`: mocks ativados no build de demonstração (`npm run build:demo`).
- `.env.example`: referência das variáveis.

Sem `VITE_ENABLE_MOCKS=true`, o código do MSW não é incluído no bundle.

## Comandos

| Comando                   | Descrição                                                        |
| ------------------------- | ---------------------------------------------------------------- |
| `npm run dev`             | Servidor de desenvolvimento com mocks (`http://localhost:5173`). |
| `npm run build`           | Build de produção sem mocks.                                     |
| `npm run build:demo`      | Build de produção com mocks (artefato de deploy).                |
| `npm run preview`         | Serve o conteúdo de `dist/`.                                     |
| `npm run typecheck`       | Verificação de tipos (`tsc -b`).                                 |
| `npm run lint`            | ESLint.                                                          |
| `npm run test:e2e`        | Testes Playwright sobre o build de demonstração.                 |
| `npm run test:e2e:ui`     | Playwright em modo interativo.                                   |
| `npm run test:e2e:report` | Abre o último relatório HTML.                                    |

## Testes E2E

O Playwright gera o build de demonstração, sobe o `vite preview` na porta 4173 e executa os testes em Chromium, em dois viewports:

- `desktop-chromium`: 1440×900.
- `mobile-chromium`: Pixel 7.

O relatório HTML fica em `playwright-report/`, e os traces das falhas ficam em `test-results/`.

| Arquivo                  | Cobertura                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `e2e/smoke.spec.ts`      | `GET /api/health` via MSW e página de rota inexistente.                                        |
| `e2e/realtime.spec.ts`   | `nft.updated` entregue pelo `socket.io-client` e reconciliação via REST após reconexão.         |
| `e2e/catalog.spec.ts`    | Busca, filtros combinados, faixa de preço, ordenação, paginação, histórico, estado vazio, skeleton/erro/nova tentativa e respostas fora de ordem (desktop); busca e gaveta de filtros (mobile). |

## Validando a Home no navegador

Com `npm run dev`, abra `http://localhost:5173/`:

1. **Busca:** no desktop, clique na lupa do cabeçalho; no mobile, use a barra "Explorar coleções". A URL recebe `?search=`.
2. **Filtros:** marque coleções e redes na barra lateral (desktop ≥ 1024 px) ou no botão de filtros (tablet e mobile). Os contadores vêm da API e consideram os demais filtros ativos.
3. **Faixa de preço:** arraste as alças (ou use as setas/PageUp/PageDown do teclado) e clique em **Aplicar**.
4. **Seções e ordenação:** "Todos os NFTs", "Novos lançamentos" e "Em alta"; ordenação por data, preço e nome.
5. **Paginação:** 9 NFTs por página. Qualquer mudança de filtro volta para a primeira página.
6. **Histórico:** use voltar/avançar do navegador ou recarregue a página: o estado vem da URL (ex.: `/?collections=music,photography&networks=ethereum&sort=price-asc&page=2`).

### Simulando lentidão, falhas e respostas fora de ordem

Os handlers do catálogo consultam `window.__KURIO_NETWORK_CONDITIONS__` a cada requisição (latência padrão: 250 ms). No console do navegador:

```js
// Lentidão: 3 s em todas as consultas do catálogo (skeletons visíveis)
window.__KURIO_NETWORK_CONDITIONS__ = () => ({ delayMs: 3000 })

// Falha: HTTP 503 (o Query tenta mais 2 vezes antes de exibir o erro)
window.__KURIO_NETWORK_CONDITIONS__ = () => ({ status: 503 })

// Fora de ordem: busca "emerald" demora 3 s; digite "emerald" e, em seguida, "golden"
window.__KURIO_NETWORK_CONDITIONS__ = (request) =>
  new URL(request.url).searchParams.get('search') === 'emerald' ? { delayMs: 3000 } : undefined

// Volta ao normal
delete window.__KURIO_NETWORK_CONDITIONS__
```

## Demonstração de tempo real (`/diagnostico`)

A página `/diagnostico` exibe um NFT fictício, servido pelo MSW, e dois controles:

- **Simular alteração no servidor:** chama o endpoint de controle do mock. O mock altera o estado do NFT e emite `nft.updated` pelo Socket.IO. A resposta REST não traz dados (`202`), então a interface só muda ao receber o evento.
- **Desconectar/Reconectar socket:** com o socket desconectado, a alteração não chega à interface. Ao reconectar, o NFT é reconsultado via REST.

As alterações seguem uma sequência determinística de preço e disponibilidade (`0.82/9`, `0.91/7`, `0.68/0`, em ciclo). O estado do mock é reiniciado a cada recarga da página.
