# NFT Marketplace — Desafio Frontend Jungle Gaming

Implementação do desafio Frontend da Jungle Gaming. O enunciado original está em [Jungle_Gaming_README_OFICIAL_COMPLETO.md](Jungle_Gaming_README_OFICIAL_COMPLETO.md), e as decisões técnicas estão em [ARCHITECTURE.md](ARCHITECTURE.md).

> **Status:** fundação, tempo real (Socket.IO + MSW), Home com catálogo, detalhe do NFT e autenticação concluídos. Carrinho, checkout, perfil completo, carteiras e favoritos ainda não foram implementados: essas ações aparecem indisponíveis.

## Credenciais fictícias

| Usuário                        | E-mail            | Senha              |
| ------------------------------ | ----------------- | ------------------ |
| Ana Ribeiro (`ana.colecionadora`) | `ana@kurio.dev`   | `kurio-ana-2026`   |
| Bruno Tavares (`bruno.criador`)   | `bruno@kurio.dev` | `kurio-bruno-2026` |

Contas existem apenas na API simulada. O código guarda somente hashes com salt; as senhas acima existem só para testes. Novas contas criadas pelo cadastro e as sessões ficam no `localStorage` do navegador (chave `kurio-mock:auth:v1`); apague-a para voltar ao estado inicial.

## Rotas

| Rota            | Conteúdo                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------- |
| `/`             | Home: hero, catálogo com busca, filtros, ordenação e paginação, destaques, blog e rodapé. |
| `/nfts/:nftId`  | Detalhe: galeria, informações, edição (`?edition=`), quantidade, descrição e relacionados. |
| `/entrar`       | Login (modal no desktop, página no mobile). Aceita `?redirect=` para voltar ao destino.   |
| `/cadastro`     | Cadastro (modal no desktop, página no mobile). Aceita `?redirect=`.                       |
| `/perfil`       | Privada: resumo da conta do usuário autenticado (perfil completo em etapa futura).        |
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
| `e2e/auth.spec.ts`       | Cadastro (validação, conflitos de usuário/e-mail), login inválido/válido, rota privada com retorno ao destino, refresh, logout, troca de usuário sem vazamento (e novo handshake do socket), sessão expirada durante a navegação e após refresh, 401 sem sessão (desktop); páginas e tab bar (mobile). |
| `e2e/nft-detail.spec.ts` | Navegação a partir do card, acesso direto, refresh, relacionados, 404, edições e limites de quantidade, edição/NFT esgotado, ações indisponíveis, `nft.updated` no detalhe e no catálogo, eventos duplicados/antigos, estoque caindo em tempo real, skeleton/erro/nova tentativa (desktop); barra de compra e voltar (mobile). |

## Validando a autenticação no navegador

Com `npm run dev`:

1. **Login:** clique em "Entrar" no cabeçalho (desktop) ou no ícone de perfil da tab bar (mobile) e use uma das credenciais acima. Ao fechar o modal, você volta para a página de origem.
2. **Rota privada:** acesse `/perfil` sem sessão: você é levado a `/entrar?redirect=%2Fperfil` e, após o login, volta ao perfil.
3. **Cadastro:** em `/cadastro`, envie o formulário vazio, use `ana.colecionadora` ou `ana@kurio.dev` (conflito) e depois dados novos.
4. **Refresh e logout:** recarregue a página com a sessão ativa (ela é recuperada); clique em "Sair" para encerrá-la.
5. **Sessão expirada:** com a sessão ativa, rode no console e navegue para `/perfil` (ou recarregue a página):

   ```js
   await fetch('/api/__mocks__/auth/expire-session', {
     method: 'POST',
     headers: { Authorization: `Bearer ${localStorage.getItem('kurio.session-token')}` },
   })
   ```

## Validando o detalhe do NFT no navegador

Com `npm run dev`:

1. Na Home, clique em um card ou acesse direto `http://localhost:5173/nfts/emerald-ape-042`.
2. **Edições e quantidade:** em `/nfts/golden-signal-160`, a edição 1/50 tem 6 unidades, mas o máximo por pedido é 5; a 1/10 permite 2. A edição escolhida vai para a URL (`?edition=one-of-ten`).
3. **Esgotados:** `/nfts/sage-nomad-009?edition=one-of-one` (edição esgotada) e `/nfts/ivory-baron-088` (todas as edições esgotadas).
4. **Inexistente:** `/nfts/nft-inexistente` responde 404 e mostra "NFT não encontrado".
5. **Tempo real:** com o detalhe aberto, rode no console do navegador:

   ```js
   // Aplica a próxima alteração determinística (preço e estoque) e emite nft.updated
   await fetch('/api/__mocks__/nfts/emerald-ape-042/market-change', { method: 'POST' })

   // Reemite um evento já publicado (duplicado/antigo): a interface deve ignorá-lo
   await fetch('/api/__mocks__/nfts/emerald-ape-042/events/2/replay', { method: 'POST' })
   ```

   A sequência de alterações por NFT é cíclica: **+0,07 ETH e −1 unidade**, **+0,09 ETH e −2 unidades** (ambas na edição padrão), **−0,23 ETH e todas as edições esgotadas**. O estado dos mocks é reiniciado a cada recarga da página.

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

A página `/diagnostico` exibe o NFT em destaque do catálogo (o mesmo de `GET /api/nfts/featured`) e dois controles:

- **Simular alteração no servidor:** chama o endpoint de controle do mock. O mock altera o registro do catálogo e emite `nft.updated` pelo Socket.IO. A resposta REST não traz dados (`202`), então a interface só muda ao receber o evento.
- **Desconectar/Reconectar socket:** com o socket desconectado, a alteração não chega à interface. Ao reconectar, os dados de NFTs ativos são reconsultados via REST.
