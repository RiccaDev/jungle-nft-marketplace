# Arquitetura

Este documento é atualizado conforme cada etapa é concluída e verificada.

## Estrutura

```
src/
  app/                composição da aplicação: providers, router e QueryClient
  routes/             rotas baseadas em arquivo do TanStack Router
  features/<x>/       código por domínio: contratos, chamadas REST, query options, hooks e componentes
    home/             composição da Home (hero, promoções, blog) e conteúdo editorial estático
    nfts/             catálogo: contratos, filtros da URL, API, hooks e componentes
  components/layout/  cabeçalho, rodapé e tab bar mobile
  components/ui/      componentes shadcn/ui adaptados ao tema
  hooks/              hooks genéricos (debounce, media query)
  lib/eth/            aritmética e formatação de valores em ETH
  lib/http/           cliente Axios, configuração de URL e formato de erro
  lib/realtime/       cliente socket.io-client, contrato dos eventos e hook de conexão
  lib/search-params/  (de)serialização da URL e parsers tolerantes de parâmetros
  mocks/
    catalog/          consulta do catálogo (busca, filtros, facetas, ordenação, paginação)
    fixtures/         dados determinísticos
    handlers/         handlers REST do MSW, por recurso
    network/          simulação de latência e falhas
    realtime/         servidor Socket.IO simulado (MSW `ws` + @mswjs/socket.io-binding)
    state/            estado mutável dos mocks
  assets/figma/       ícones e decorações exportados do Figma
public/images/nfts/   artes dos NFTs (WebP otimizado a partir dos originais do Figma)
e2e/                  testes Playwright
```

### Responsabilidades

- **Rotas:** compõem a tela e validam os parâmetros de busca. Não chamam o Axios nem o socket diretamente.
- **Features:** cada uma define seu contrato tipado, a função de transporte (Axios) e as `queryOptions`. Os componentes consomem as `queryOptions`.
- **Realtime (`lib/realtime`):** mantém uma instância única do `socket.io-client`, tipada por `ServerToClientEvents`. As features assinam os eventos e aplicam as mudanças no cache do TanStack Query.
- **Mocks:** ficam isolados na camada de rede. Reutilizam os tipos de contrato e os parsers das features, e nenhum componente, hook ou cliente HTTP contém resposta fictícia. O código de mocks nunca é importado pela aplicação.

## Fluxo de dados

```
REST:      Rota → useQuery(queryOptions) → função da feature → apiClient (Axios) → MSW handler
Realtime:  MSW socket server → WebSocket (mockado) → socket.io-client → listener da feature → queryClient.setQueryData
URL:       interação → navigate({ search }) → validateSearch (parseNftListFilters) → queryOptions(filtros)
```

O `AbortSignal` do TanStack Query é repassado ao Axios, o que permite cancelar requisições obsoletas.

## Catálogo

### Estado na URL

A URL é a fonte de verdade de busca, filtros, ordenação e paginação. Os nomes dos parâmetros da URL e da API são os mesmos, e um único parser (`parseNftListFilters`) é usado pelo `validateSearch` da rota e pelo handler do MSW:

| Parâmetro     | Tipo                                                      | Padrão (omitido da URL) |
| ------------- | --------------------------------------------------------- | ----------------------- |
| `search`      | texto (nome do NFT, sem diferenciar acentos/maiúsculas)    | —                       |
| `collections` | lista separada por vírgula de `NftCollectionId`           | todas                   |
| `networks`    | lista separada por vírgula de `ethereum`, `polygon`, `solana` | todas               |
| `minPrice`    | ETH decimal (`1.02`)                                      | —                       |
| `maxPrice`    | ETH decimal                                               | —                       |
| `segment`     | `new-releases`, `trending`                                | `all`                   |
| `sort`        | `price-asc`, `price-desc`, `name-asc`                     | `recently-listed`       |
| `page`        | inteiro ≥ 1                                               | `1`                     |

- **Parser tolerante:** valores inválidos ou desconhecidos são descartados (um link antigo ou editado à mão nunca quebra a tela), e valores padrão são omitidos para manter a URL curta.
- **Serialização:** o router usa `parseSearch`/`stringifySearch` próprios (`lib/search-params`). Listas viram CSV (`?collections=music,photography`) em vez do JSON codificado padrão do TanStack Router.
- **Paginação reiniciada:** toda alteração de filtro passa por `updateFilters`, que remove `page`.
- **Histórico:** cada filtro cria uma entrada de histórico. Na busca textual, a primeira alteração cria uma entrada e os refinamentos seguintes a substituem (debounce de 350 ms), evitando uma entrada por tecla.
- **Links que só mudam a busca** (abas, paginação, promoções, coleções do rodapé) usam `activeOptions={{ exact: true }}`. Sem isso, o TanStack Router compara a busca de forma parcial e marca como `aria-current="page"` qualquer link cujos parâmetros sejam um subconjunto dos atuais.

### Estados assíncronos

| Situação                            | Comportamento                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| Primeira carga                      | Skeletons com shimmer nas mesmas proporções dos cards (sem deslocamento de layout).               |
| Troca de parâmetros                 | `placeholderData: keepPreviousData`: a página anterior fica visível com opacidade reduzida e `aria-busy`. |
| Resultado vazio                     | Mensagem e botão "Limpar filtros".                                                                |
| Página além do total                | Mensagem e link para a primeira página.                                                           |
| Falha (após as tentativas automáticas) | Mensagem e botão "Tentar novamente".                                                           |
| Respostas fora de ordem             | Cada combinação de parâmetros tem sua própria chave de query; a resposta de uma chave antiga nunca é exibida para a chave atual, e a requisição obsoleta é cancelada via `AbortSignal`. |

Um `role="status"` anuncia "Carregando NFTs…" e o total de resultados a leitores de tela. O shimmer é desativado com `prefers-reduced-motion: reduce`.

### Valores em ETH

Preços trafegam como strings decimais. Comparações e ordenação usam `BigInt` em wei (18 casas) via `lib/eth/eth-amount.ts`, sem `number` de ponto flutuante. O slider de preço trabalha com inteiros em centésimos de ETH, convertidos de/para string sem perda.

## Contratos REST

| Método | Caminho                       | Resposta                                                                      |
| ------ | ----------------------------- | ----------------------------------------------------------------------------- |
| GET    | `/api/nfts`                   | 200 `NftListResponse`                                                         |
| GET    | `/api/nfts/featured`          | 200 `NftSummary` · 404 `ApiErrorBody`                                         |
| GET    | `/api/health`                 | 200 `{ status: 'ok', timestamp: string /* ISO */ }`                           |
| GET    | `/api/demo/nft`               | 200 `{ id, name, priceEth: string, availableQuantity: number, version: number }` |
| POST   | `/api/__mocks__/nft-updates`  | 202 sem corpo                                                                 |

Os tipos estão em `src/features/nfts/nft.contracts.ts` e `src/lib/http/api-error.ts`:

```ts
type NftSummary = {
  id: string
  name: string
  collectionId: NftCollectionId
  network: 'ethereum' | 'polygon' | 'solana'
  priceEth: string                // decimal
  previousPriceEth: string | null // preço anterior, quando houve redução
  availableQuantity: number       // inteiro; 0 = esgotado
  rarity: 'rare' | null
  image: { src: string; srcSet: string; alt: string }
  listedAt: string                // ISO
  version: number
}

type NftListResponse = {
  items: NftSummary[]
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number }
  facets: {
    collections: { id: NftCollectionId; count: number }[]
    networks: { id: NftNetworkId; count: number }[]
    priceRangeEth: { min: string; max: string } // limites do catálogo inteiro
  }
}

type ApiErrorBody = { error: { code: string; message: string } }
```

- `GET /api/nfts` aceita os parâmetros da tabela "Estado na URL" mais `pageSize` (padrão 9, máximo 48).
- **Facetas disjuntivas:** a contagem de cada coleção considera todos os filtros ativos, exceto o próprio filtro de coleções (o mesmo vale para redes). Assim, selecionar "Música" não zera os contadores das outras coleções.
- **Segmentos:** "Novos lançamentos" são NFTs listados nos 14 dias anteriores à data de referência do catálogo; "Em alta" são NFTs com 25 ou mais vendas nos últimos 7 dias (campo interno dos mocks, fora do contrato).
- `/api/health` e `/api/demo/nft` são provisórios e servem para validar a integração ponta a ponta.
- O prefixo `/api/__mocks__/` é reservado a **endpoints de controle dos mocks**. Eles existem apenas com o MSW ativo e não representam a API do produto. `POST /api/__mocks__/nft-updates` aplica a próxima alteração determinística ao NFT de demonstração e emite `nft.updated`. A resposta não traz dados, para que a interface dependa exclusivamente do evento.

## Eventos Socket.IO

| Evento        | Direção           | Payload                                                                                          |
| ------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| `nft.updated` | servidor → cliente | `{ eventId: string, nftId: string, version: number, priceEth: string, availableQuantity: number, occurredAt: string /* ISO */ }` |

- `eventId` é a identidade estável do evento (`nft.updated:<nftId>:<version>`). `nftId` identifica o recurso afetado, e `version` é monotônica por NFT.
- Valores em ETH trafegam como strings decimais, e a disponibilidade é um número inteiro.
- **Ordenação e duplicatas:** o cliente só aplica um evento quando `event.version` é maior que a versão em cache. Eventos duplicados ou antigos são ignorados e não regridem o estado.
- **Reconciliação:** eventos emitidos durante uma desconexão são perdidos. Por isso, a cada reconexão (exceto a primeira conexão), a feature invalida suas queries, e o REST volta a ser a fonte de verdade.
- **Ciclo de vida:** listeners são registrados em `useEffect` e removidos na limpeza. A conexão é aberta pelo hook `useSocketConnection` e encerrada no unmount.

## Política de cache e retries

| Configuração           | Valor                                     | Motivo                                                           |
| ---------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| `staleTime` (queries)  | 30 s                                      | Evita refetch redundante em navegação curta.                     |
| `retry` (queries)      | até 2 tentativas; nunca em respostas 4xx  | Erros 4xx são determinísticos; só falhas transitórias são repetidas. |
| `retry` (mutations)    | desativado                                | Evita operações duplicadas.                                      |
| `placeholderData` (lista de NFTs) | `keepPreviousData`             | Evita piscar skeletons a cada mudança de filtro ou página.       |
| `defaultPreloadStaleTime` (router) | 0                             | O TanStack Query controla o frescor dos dados.                   |

Chaves de query: `['nfts', 'list', NftListRequest]` (com padrões aplicados, para que `/?sort=recently-listed` e `/` compartilhem o cache) e `['nfts', 'featured']`. Componentes que precisam da mesma lista (grade, filtros, gaveta) chamam a mesma `queryOptions`, e o Query deduplica a requisição.

## Mocking

- O MSW roda no navegador. As requisições REST passam pelo Service Worker (`public/mockServiceWorker.js`, gerado por `msw init`). Já o WebSocket é interceptado na própria página, porque o MSW substitui o construtor global `WebSocket` ao iniciar.
- `src/main.tsx` aguarda `worker.start()` antes de renderizar quando `VITE_ENABLE_MOCKS === 'true'`. A condição é substituída estaticamente pelo Vite, e o chunk de mocks é descartado nos builds sem mocks.
- A URL do worker considera `BASE_URL`, o que permite deploy em subcaminho.
- As URLs da API (`src/lib/http/config.ts`) e do servidor Socket.IO (`src/lib/realtime/config.ts`) são compartilhadas entre o código da aplicação e os mocks, para nunca divergirem.
- O estado dos mocks vive em memória (`src/mocks/state/`) e é reiniciado a cada recarga da página. Handlers REST e o servidor Socket.IO simulado compartilham esse estado, então uma alteração aparece tanto no REST quanto no evento.

### Fixtures do catálogo

`src/mocks/fixtures/nft-catalog.fixtures.ts` gera 63 NFTs de forma determinística:

- os 9 primeiros reproduzem a primeira página do Figma (nomes, preços, preço anterior e artes);
- os outros 54 combinam 18 nomes × 3 edições e distribuem coleções, redes, preços de `0.02` a `12.30` ETH, NFTs esgotados, raros e com preço reduzido;
- a data de referência é fixa (`2026-10-01T12:00Z`), então "Novos lançamentos" não depende do relógio.

### Condições de rede

`src/mocks/network/network-conditions.ts` aplica latência padrão de 250 ms aos handlers do catálogo e consulta, a cada requisição, a função `window.__KURIO_NETWORK_CONDITIONS__(request)`, que pode devolver `{ delayMs, status }`. Testes a definem com `page.addInitScript` (antes da primeira requisição); em desenvolvimento, pelo console. Exemplos no README.

### Transporte Socket.IO simulado

O servidor simulado (`src/mocks/realtime/socket-io-server.ts`) usa `ws.link` do MSW com `toSocketIo` do `@mswjs/socket.io-binding`. A aplicação usa o `socket.io-client` real, e os frames trafegam no protocolo Engine.IO/Socket.IO (`0`, `40`, `42[...]`, `2`/`3`), visíveis no console do MSW.

Limitações e ajustes:

| Limitação                                                                                     | Tratamento                                                                                                                            |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| O binding intercepta apenas WebSocket; não há HTTP long-polling.                              | O cliente usa `transports: ['websocket']`.                                                                                            |
| O MSW remove o prefixo `/socket.io/` da URL antes de comparar com o `ws.link`.                | O link aponta para a origem do servidor (`ws://host/`), e o `path` do cliente fica no padrão `/socket.io/`.                            |
| O binding simula o handshake (`pingInterval` 25 s, `pingTimeout` 5 s), mas não envia pings.   | O servidor simulado envia o ping do Engine.IO (`2`) a cada 25 s. Sem isso, o cliente derrubaria a conexão a cada ~30 s.                |
| Um socket fechado ainda em CONNECTING (ex.: StrictMode) chega ao handler já fechado e nunca emite `close`. | O cliente só é registrado ao enviar o pacote CONNECT do Socket.IO (`40`). Isso evita clientes fantasmas e heartbeats órfãos.           |
| O binding usa `sid` fixo (`test`) e não suporta namespaces, rooms nem broadcast.             | Apenas o namespace padrão é usado. O envio a todos os clientes é feito iterando os clientes registrados.                              |

## Interface

### Tema

As cores e a família tipográfica (Roboto Mono, servida localmente via `@fontsource-variable`) vêm das variáveis do Figma e estão em `src/styles/globals.css` com o prefixo `--gm-*`. Os tokens semânticos do shadcn/ui (`background`, `card`, `primary`, `muted`, …) são mapeados sobre essa paleta.

- `--radius` e `--destructive` não existem nas variáveis do Figma e mantêm os valores padrão do shadcn.
- Medidas específicas do Figma ficam em pixels nas classes (`w-[140px]`, `leading-[22px]`), e não convertidas para a escala do Tailwind (`w-35`), para que cada valor possa ser conferido diretamente no design.
- Componentes shadcn adaptados: `Slider` (alças de 18 px primárias com borda ink, rótulos e `aria-valuetext` por alça), `Select` (ícone configurável, para usar a seta do Figma) e `Skeleton` (shimmer em vez de `pulse`).

### Responsividade

| Largura        | Layout                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| < 768 px       | Frame mobile: barra de busca + botão de filtros (gaveta), hero compacto, abas, grade de 2 colunas escalonada, tab bar fixa. Promoções, blog e rodapé não aparecem (o frame mobile não os inclui). |
| 768 – 1023 px  | Cabeçalho e hero desktop compactos, filtros em gaveta, grade de 3 colunas.                                  |
| 1024 – 1279 px | Barra lateral de filtros (260 px) e grade de 2 colunas.                                                     |
| ≥ 1280 px      | Composição do frame desktop: barra lateral de 310 px e grade de 3 colunas.                                  |

O hero desktop e o mobile são escolhidos com `useMediaQuery` (e não escondidos via CSS), para que só a imagem do hero visível seja baixada e exista um único `h1`.

### Assets

- Ícones e decorações vêm do Figma em SVG, sem alterações (`src/assets/figma/`). Traços simples (sublinhados, divisor, trilho e alças do slider) são reproduzidos em CSS, porque precisam ser interativos ou responsivos.
- As 4 artes dos NFTs no Figma são PNGs de 1254 × 1254 px (~2 MB cada). Foram convertidas para WebP em 480 e 960 px (15–67 KB) e são servidas com `srcset`. As fixtures e a Home referenciam essas cópias.
- O retângulo de fundo do hero desktop no Figma é um SVG vazio e não foi usado.
- O ícone central da tab bar é composto por 5 vetores; a exportação do grupo vem com o fundo do frame, então os vetores são posicionados individualmente, com coordenadas convertidas do Figma.

### Desvios do Figma

| Ponto                                   | Figma                                                         | Implementação e motivo                                                                                     |
| --------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Busca no desktop                        | Só o ícone de lupa                                             | O ícone expande um campo de busca no cabeçalho (a busca é obrigatória e não há campo no frame desktop).    |
| Card sem nome (3ª linha)                | Um card só com imagem                                          | Todos os cards têm nome e preço; a fixture usa "Golden Echo #131".                                         |
| Espaçamentos dos cards                  | Imagem com margens diferentes por card; 12 px ou 6 px entre nome e preço | Imagem centralizada com 4 px de margem; 12 px entre imagem e texto e 6 px entre nome e preço em todos. |
| Preço anterior                          | Cor secundária, sem risco                                      | Riscado e com rótulo para leitores de tela ("Preço anterior").                                             |
| NFT esgotado                            | Não desenhado                                                  | Texto "Esgotado" abaixo do preço.                                                                          |
| Selo "RARO"                             | Só no mobile                                                   | Também no desktop, para não esconder informação em uma largura.                                            |
| Filtro selecionado                      | Só muda de cor                                                 | Cor + ícone de check (estado não dependente apenas de cor).                                                |
| Contadores e faixa de preço             | Números ilustrativos (33, 12, 65…; "0,02 - 12,30 ETH")          | Vindos da API; decimal com ponto, como nos cards.                                                          |
| Trilho do slider                        | Trilho e intervalo na mesma cor                                | Trilho com 40% de opacidade, para distinguir o intervalo selecionado.                                      |
| Cards de promoção                       | Altura fixa; o texto do 2º card é cortado                       | Altura mínima de 250 px que cresce se o texto não couber; títulos sem quebra.                              |
| Blog                                    | 4 cards de 268 px alinhados à esquerda (sobram 56 px)          | 4 colunas iguais ocupando toda a largura.                                                                  |
| Paginação                               | Páginas 1–4 e "próxima"                                        | Janela de até 5 páginas, "anterior" quando não é a primeira página.                                        |
| Divisor do cabeçalho                    | 0,3 px                                                         | 1 px a 40% de opacidade (traços abaixo de 1 px renderizam de forma inconsistente).                         |
| Hero mobile                             | Altura fixa de 190 px (frame de 414 px)                         | Altura mínima de 190 px: em 390 px o texto ocupa mais linhas.                                              |
| Abas mobile                             | Espaço de 4 px entre a 1ª e a 2ª aba                            | 16 px entre todas as abas; a faixa rola horizontalmente se não couber.                                     |
| Favoritar no card mobile                | Botão de coração                                               | Omitido até a etapa de favoritos (exige autenticação).                                                     |
| Indicadores do carrossel                | Três pontos                                                     | Decorativos (`aria-hidden`), pois há um único slide.                                                       |

### Ações fora do escopo atual

Itens desenhados cuja funcionalidade não existe nesta etapa não simulam sucesso: "Criadores", "Aprenda", carrinho, "Entrar", links de perfil e ajuda do rodapé, "Ler mais" do blog e os itens da tab bar mobile (exceto Início) têm `aria-disabled="true"` e o título "Disponível em breve". A newsletter informa que a inscrição não está disponível nesta demonstração. "Mercado", as promoções e as coleções do rodapé levam ao catálogo com o filtro correspondente. Os cards levam a `/nfts/:nftId`, uma página provisória que informa que o detalhe está em construção.

## Decisões e restrições de versão

- **TypeScript `~6.0`:** o typescript-eslint 8.x exige `typescript <6.1.0`, então o TypeScript 7 ainda não é suportado.
- **MSW 2.15 em vez de 3.x:** o `@mswjs/socket.io-binding@0.2.0` (versão mais recente) declara `msw ^2.10.2` como peer dependency. O projeto voltou para a última versão 2.x, sem `--force` nem `--legacy-peer-deps`. A infraestrutura REST (`setupWorker`, `http`, `HttpResponse`) é a mesma nas duas versões. O binding traz sua própria cópia de `@mswjs/interceptors` (0.39), mas usa dela apenas tipos; em tempo de execução, opera sobre as conexões criadas pelo MSW.
- **`setupWorker` clássico:** usamos o worker gerado por `msw init`.
- **Pacote `cn`:** a CLI do shadcn (4.x) gera componentes que importam `cn` do pacote npm de mesmo nome, mantido pelo autor do shadcn, em vez de `@/lib/utils`. Adotamos esse padrão para manter consistência com futuros `shadcn add`. A CLI não instala automaticamente `class-variance-authority` nem `lucide-react`; ambos foram adicionados manualmente.
- **`src/routeTree.gen.ts` versionado:** o arquivo é gerado pelo plugin do TanStack Router, mas fica versionado para que `typecheck` funcione num checkout limpo, antes do primeiro build.
- **Playwright sobre o build de demonstração:** os testes usam o mesmo artefato do deploy, e não o servidor de desenvolvimento.
- **Evidência de tráfego Socket.IO nos testes:** como o WebSocket é mockado dentro da página, o Playwright não o enxerga como tráfego de rede. Por isso, `e2e/realtime.spec.ts` comprova o caminho de três formas: o endpoint de controle não devolve dados; o frame `42["nft.updated",…]` aparece exatamente uma vez no log do MSW; e, com o socket desconectado, a interface não muda.
- **Página de diagnóstico:** a página provisória da Etapa 2 (status da API e demonstração de tempo real) foi movida de `/` para `/diagnostico`, preservando seus testes.

## Limitações conhecidas

- O catálogo ainda não recebe `nft.updated`: o evento atualiza apenas o NFT de demonstração de `/diagnostico`. A integração com catálogo, detalhe e carrinho entra junto com essas telas.
- O NFT de demonstração e o endpoint `/api/__mocks__/nft-updates` são provisórios e serão substituídos pelos cenários configuráveis.
- O estado dos mocks ainda não persiste entre recargas, e ainda não há seleção nem reset de cenários. As condições de rede cobrem apenas os endpoints do catálogo.
- `order.updated` e o isolamento de eventos por sessão de usuário ainda não foram implementados; dependem dos fluxos de pedido e autenticação.
