# Arquitetura

Este documento é atualizado conforme cada etapa é concluída e verificada.

## Estrutura

```
src/
  app/                composição da aplicação: providers, router e QueryClient
  routes/             rotas baseadas em arquivo do TanStack Router
  features/<x>/       código por domínio: contratos, chamadas REST, query options, hooks e componentes
    home/             composição da Home (hero, promoções, blog) e conteúdo editorial estático
    nfts/             recurso NFT: contratos, filtros da URL, API, edições, sincronização em tempo real e catálogo
    nft-detail/       página de detalhe: seleção de edição/quantidade, ações e layouts desktop/mobile
    auth/             contratos, validação compartilhada, sessão, telas de login/cadastro e ciclo de vida
    account/          resumo da conta (primeira página privada)
    realtime-demo/    painel técnico de `/diagnostico`
  components/layout/  cabeçalho, rodapé e tab bar mobile
  components/ui/      componentes shadcn/ui adaptados ao tema
  hooks/              hooks genéricos (debounce, media query)
  lib/eth/            aritmética e formatação de valores em ETH
  lib/http/           cliente Axios, configuração de URL e formato de erro
  lib/realtime/       cliente socket.io-client, contrato dos eventos e hook de conexão
  lib/search-params/  (de)serialização da URL e parsers tolerantes de parâmetros
  mocks/
    auth/             hash de senha e resolução da sessão de uma requisição
    catalog/          consulta do catálogo (busca, filtros, facetas, ordenação, paginação)
    fixtures/         dados determinísticos
    handlers/         handlers REST do MSW, por recurso, e endpoints de controle dos mocks
    network/          simulação de latência e falhas
    realtime/         servidor Socket.IO simulado (MSW `ws` + @mswjs/socket.io-binding) e publicação de eventos
    state/            estado mutável dos mocks (fonte única para REST e eventos)
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
Realtime:  estado do mock → publishNftUpdate → WebSocket (mockado) → socket.io-client → useNftRealtimeSync → queryClient.setQueryData
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

## Detalhe do NFT

### Edições e quantidade

Cada NFT tem 4 edições (`one-of-one`, `one-of-ten`, `one-of-fifty`, `open`, exibidas como 1/1, 1/10, 1/50 e ABERTA), cada uma com estoque próprio (`availableQuantity`) e limite por pedido (`maxPerOrder`: 1, 2, 5 e 10). A disponibilidade do resumo do catálogo é a soma das edições.

- **Edição selecionada:** vem de `?edition=` (validado; troca com `replace`, sem poluir o histórico). Sem parâmetro, usa a edição padrão — a primeira com estoque na ordem 1/50 → 1/10 → ABERTA → 1/1 — **fixada na primeira renderização**, para que uma mudança de estoque em tempo real nunca troque a edição sob o usuário.
- **Quantidade:** entre 1 e `min(estoque da edição, maxPerOrder)`. A quantidade pedida é guardada; a exibida é limitada ao máximo atual. Se o estoque cair abaixo dela (evento em tempo real), a interface ajusta e avisa.
- **Esgotados:** edições sem estoque ficam desabilitadas (riscadas e anunciadas como "esgotada"). Se a edição da URL estiver esgotada, ou todas estiverem, o seletor de quantidade é desabilitado e uma mensagem explica o motivo.
- As regras ficam em `features/nfts/nft-edition-selection.ts` e são reutilizadas pelo mock (a alteração de mercado vende da mesma edição padrão).

### Ações de compra e favoritos

`useNftDetailActions()` é o ponto de integração: devolve, para cada ação, `{ status: 'available', run }` ou `{ status: 'unavailable', reason }`. Hoje ambas estão indisponíveis (carrinho e login não existem). Os botões são renderizados com `aria-disabled`, descrição via `aria-describedby` e o motivo visível na tela; clicar não faz nada. A seleção que será enviada ao carrinho já tem tipo próprio (`NftPurchaseSelection`).

### Galeria

O Figma repete a mesma imagem nas 4 miniaturas. Para não exibir artes que não pertencem ao NFT, a API devolve 4 **vistas** da mesma obra (`gallery`: obra completa e 3 recortes ampliados, com `zoom` e ponto focal). O botão de lupa abre a vista atual em um `Dialog` (foco preso e devolvido ao fechar). No mobile, as miniaturas viram indicadores clicáveis.

### Estados

| Situação                         | Comportamento                                                               |
| -------------------------------- | --------------------------------------------------------------------------- |
| Carregando                       | Skeleton com as proporções do layout (desktop ou mobile).                   |
| 404                              | "NFT não encontrado", com link para o catálogo (sem novas tentativas).      |
| Outras falhas                    | Mensagem e "Tentar novamente" após as tentativas automáticas.               |
| Alteração recebida com a página aberta | Aviso em `role="status"` com preço anterior → novo e nova disponibilidade. |
| Relacionados com falha           | Mensagem local com "Tentar novamente", sem afetar o restante da página.     |

O `loader` da rota apenas dispara `prefetchQuery` (sem `await`): a requisição começa ao passar o mouse sobre um card (`defaultPreload: 'intent'`) e a página continua exibindo o skeleton enquanto ela não termina.

## Autenticação e sessão

### Política de sessão

| Aspecto                | Decisão                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| Credencial             | Token opaco (UUID) emitido no login/cadastro, válido por 30 minutos (`expiresAt`).                          |
| Transporte             | Header `Authorization: Bearer`, adicionado por um interceptor do Axios a toda requisição.                  |
| Armazenamento          | `localStorage` (`kurio.session-token`), para recuperar a sessão após refresh. Veja "Limitações de segurança". |
| Fonte de verdade       | `GET /api/auth/session`, em cache no TanStack Query (`['auth', 'session']`, `staleTime` de 5 min).          |
| Rejeição da sessão     | Qualquer 401 `SESSION_EXPIRED`/`UNAUTHENTICATED` em requisição que levou token dispara o evento `session rejected` (`lib/http/session-events.ts`). |

### Ciclo de vida

- **Login/cadastro** (`startSession`): cancela consultas privadas em andamento, remove o cache privado, grava o token, preenche o cache da sessão e refaz o handshake do socket. O formulário então navega para `?redirect=` (ou `/`).
- **Logout** (`endSession`): chama `POST /api/auth/logout` (falha de rede não impede o encerramento local), cancela e remove o cache privado, apaga o token, zera a sessão, refaz o handshake do socket e volta para `/`.
- **Expiração/revogação** (`useSessionLifecycle`, montado na raiz): ao receber `session rejected`, executa `endSession` e:
  - em rota privada, navega para `/entrar?redirect=<rota atual>&reason=session-expired`;
  - em rota pública, mantém a página, revalida os guards e mostra um aviso com link para entrar.
- **Refresh com token expirado:** o guard detecta que havia um token salvo e que a sessão não é mais válida, e redireciona com `reason=session-expired` para explicar o motivo.

### Cache privado e isolamento

Toda consulta de dados do usuário usa a chave `['private', userId, …]` (`privateQueryKeys`). Isso garante isolamento em duas camadas: o `userId` separa os caches de dois usuários, e o prefixo `['private']` é cancelado e removido a cada troca de identidade. As consultas são canceladas **antes** de trocar o token, então uma resposta atrasada do usuário anterior nunca entra no cache do próximo.

### Rotas protegidas

Rotas privadas ficam sob o layout sem caminho `routes/_authenticated.tsx`. O `beforeLoad` garante a sessão (`ensureQueryData`) e, sem ela, lança `redirect` para `/entrar?redirect=<href original>`. Ele também injeta `sessionUser` no contexto da rota. `/entrar` e `/cadastro` redirecionam ao destino quando já há sessão. O parâmetro `redirect` só aceita caminhos internos (`/…`, sem `//`), o que impede open redirect.

### Socket.IO e sessão

O `socket.io-client` envia `{ token }` no pacote CONNECT (`auth` como função, lida a cada handshake). Toda troca de sessão chama `reconnectWithCurrentSession()`, e o novo handshake descarta as assinaturas da identidade anterior no servidor. O servidor simulado associa cada conexão ao `userId` do token e expõe `emitToUser(userId, …)` para eventos privados futuros (`order.updated`); eventos públicos (`nft.updated`) continuam indo para todos.

### Pontos de integração preparados

| Necessidade futura          | Ponto                                                                                         |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| Páginas privadas (perfil, carteiras, checkout, favoritos) | Criar a rota sob `routes/_authenticated/`.                     |
| Ações que exigem conta      | `useRequireAuthentication()` → `{ isAuthenticated, redirectToLogin() }`, que preserva a página atual. |
| Dados do usuário            | `privateQueryKeys.user(userId)` como prefixo da chave.                                        |
| Eventos em tempo real privados | `emitToUser` no mock; o cliente já reconecta a cada troca de sessão.                      |
| Endpoints privados no mock  | `resolveRequestSession(request)` devolve o usuário ou a resposta 401 adequada.               |

### Validação

`features/auth/auth-validation.ts` é usado pelos formulários e pelos handlers do MSW, então cliente e API rejeitam a mesma entrada:

| Campo             | Regra                                                         |
| ----------------- | ------------------------------------------------------------- |
| Nome de usuário   | Obrigatório; 3 a 20 letras, números, ponto ou sublinhado; único (sem diferenciar maiúsculas). |
| E-mail            | Obrigatório; formato válido; único (normalizado em minúsculas). |
| Senha (cadastro)  | Obrigatória; mínimo de 8 caracteres, com letras e números.    |
| Confirmação       | Igual à senha (apenas no cliente).                            |

Os formulários validam no envio e, a partir daí, enquanto o usuário corrige; focam o primeiro campo inválido; associam cada erro ao campo (`aria-invalid` e `aria-describedby`); e mapeiam os `fieldErrors` da API (422/409). Credenciais inválidas geram uma mensagem única ("E-mail ou senha incorretos."), sem revelar se o e-mail existe.

### Limitações de segurança do ambiente simulado

- O token fica no `localStorage`, acessível a JavaScript (risco em caso de XSS). Em produção, a sessão deveria usar cookie `httpOnly`, `Secure` e `SameSite`, que o MSW não consegue emitir de verdade.
- O mock guarda senhas como SHA-256 com salt por usuário. Isso evita senhas em texto puro, mas não substitui um hash lento e com custo de memória (Argon2/bcrypt) no servidor.
- Usuários cadastrados e sessões do mock ficam no `localStorage` do navegador (`kurio-mock:auth:v1`), visíveis para quem tiver acesso ao dispositivo. Use apenas dados fictícios.
- Não há limite de tentativas de login, recuperação de senha nem login social (os botões aparecem indisponíveis).

## Valores em ETH

Preços trafegam como strings decimais. Comparações e ordenação usam `BigInt` em wei (18 casas) via `lib/eth/eth-amount.ts`, sem `number` de ponto flutuante. O slider de preço trabalha com inteiros em centésimos de ETH, convertidos de/para string sem perda.

## Contratos REST

| Método | Caminho                       | Resposta                                                                      |
| ------ | ----------------------------- | ----------------------------------------------------------------------------- |
| GET    | `/api/nfts`                   | 200 `NftListResponse`                                                         |
| GET    | `/api/nfts/featured`          | 200 `NftSummary` · 404 `ApiErrorBody`                                         |
| GET    | `/api/nfts/:nftId`            | 200 `NftDetail` · 404 `ApiErrorBody` (`NFT_NOT_FOUND`)                        |
| GET    | `/api/nfts/:nftId/related`    | 200 `NftSummary[]` (até 5 da mesma coleção, mais recentes) · 404              |
| POST   | `/api/auth/register`          | 201 `AuthSession` · 422 `VALIDATION_FAILED` · 409 `EMAIL_TAKEN`/`USERNAME_TAKEN` (com `fieldErrors`) |
| POST   | `/api/auth/login`             | 200 `AuthSession` · 422 `VALIDATION_FAILED` · 401 `INVALID_CREDENTIALS`       |
| GET    | `/api/auth/session`           | 200 `SessionResponse` · 401 `SESSION_EXPIRED`/`UNAUTHENTICATED`               |
| POST   | `/api/auth/logout`            | 204 (idempotente, mesmo com token inválido)                                   |
| GET    | `/api/me/account`             | 200 `AccountResponse` · 401 `SESSION_EXPIRED`/`UNAUTHENTICATED`               |
| GET    | `/api/health`                 | 200 `{ status: 'ok', timestamp: string /* ISO */ }`                           |
| POST   | `/api/__mocks__/auth/expire-session` | 202 · 404 (controle dos mocks; expira a sessão do Bearer enviado)      |
| POST   | `/api/__mocks__/nfts/:nftId/market-change` | 202 sem corpo · 404 (controle dos mocks)                         |
| POST   | `/api/__mocks__/nfts/:nftId/events/:version/replay` | 202 sem corpo · 404 (controle dos mocks)                |

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

type NftDetail = NftSummary & {
  tokenId: string                 // "#0042"
  seriesName: string              // série artística, ex.: "Kurio Apes"
  creatorName: string
  royaltyPercent: number
  attributes: string[]
  summary: string                 // "Sobre este NFT"
  description: string[]           // parágrafos
  networkDescription: string
  contractAddress: string
  contractStandard: 'ERC-721'
  rating: { average: number; reviewCount: number }
  editions: { tier: NftEditionTier; availableQuantity: number; maxPerOrder: number }[]
  gallery: { id: string; label: string; zoom: number; focusX: number; focusY: number }[]
}

type AuthUser = { id: string; username: string; email: string; displayName: string }
type AuthSession = { token: string; expiresAt: string /* ISO */; user: AuthUser }
type SessionResponse = { expiresAt: string; user: AuthUser }
type AccountResponse = AuthUser & { memberSince: string }

type ApiErrorBody = {
  error: { code: string; message: string; fieldErrors?: Record<string, string> }
}
```

- `GET /api/nfts` aceita os parâmetros da tabela "Estado na URL" mais `pageSize` (padrão 9, máximo 48).
- **Facetas disjuntivas:** a contagem de cada coleção considera todos os filtros ativos, exceto o próprio filtro de coleções (o mesmo vale para redes). Assim, selecionar "Música" não zera os contadores das outras coleções.
- **Segmentos:** "Novos lançamentos" são NFTs listados nos 14 dias anteriores à data de referência do catálogo; "Em alta" são NFTs com 25 ou mais vendas nos últimos 7 dias (campo interno dos mocks, fora do contrato).
- `/api/health` é provisório e serve para validar a integração ponta a ponta.
- O prefixo `/api/__mocks__/` é reservado a **endpoints de controle dos mocks**. Eles existem apenas com o MSW ativo, não representam a API do produto e nunca devolvem os dados alterados, para que a interface dependa do evento ou de um novo GET:
  - `market-change` aplica ao registro do catálogo a próxima alteração determinística daquele NFT (+0,07 ETH e −1 unidade; +0,09 ETH e −2 unidades; −0,23 ETH e todas as edições esgotadas; em ciclo) e emite `nft.updated`;
  - `events/:version/replay` reemite, sem alterações, um evento já publicado, simulando entrega duplicada ou atrasada.

## Eventos Socket.IO

| Evento        | Direção           | Payload                                                                                          |
| ------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| `nft.updated` | servidor → cliente | `{ eventId: string, nftId: string, version: number, priceEth: string, availableQuantity: number, editions: { tier, availableQuantity }[], occurredAt: string /* ISO */ }` |

- `eventId` é a identidade estável do evento (`nft.updated:<nftId>:<version>`). `nftId` identifica o recurso afetado, e `version` é monotônica por NFT (a mesma `version` do REST).
- Valores em ETH trafegam como strings decimais; disponibilidades são inteiras, no total e por edição.
- **Aplicação única:** `useNftRealtimeSync` (montado uma vez na raiz) recebe o evento e atualiza no cache todas as visões do NFT: detalhe (preço e estoque por edição), listas do catálogo, relacionados e destaque. As listas também são marcadas como desatualizadas (`refetchType: 'none'`): a alteração aparece na hora, e a pertinência a filtros/ordenação é recalculada na próxima consulta, sem piscar a tela.
- **Ordenação e duplicatas:** cada visão só aplica um evento quando `event.version` é maior que a sua versão. Eventos duplicados ou antigos são ignorados e não regridem o estado.
- **Reconciliação:** eventos emitidos durante uma desconexão são perdidos. Por isso, a cada reconexão (exceto a primeira conexão), todas as queries `['nfts', …]` são invalidadas e as ativas são reconsultadas via REST.
- **Ciclo de vida:** a conexão é aberta por `useRealtimeConnection` na raiz e dura enquanto a aplicação estiver aberta; `useSocketStatus` apenas observa e controla o socket (usado em `/diagnostico`). Listeners são registrados em `useEffect` e removidos na limpeza.

## Política de cache e retries

| Configuração           | Valor                                     | Motivo                                                           |
| ---------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| `staleTime` (queries)  | 30 s                                      | Evita refetch redundante em navegação curta.                     |
| `retry` (queries)      | até 2 tentativas; nunca em respostas 4xx  | Erros 4xx são determinísticos; só falhas transitórias são repetidas. |
| `retry` (mutations)    | desativado                                | Evita operações duplicadas.                                      |
| `placeholderData` (lista de NFTs) | `keepPreviousData`             | Evita piscar skeletons a cada mudança de filtro ou página.       |
| `defaultPreloadStaleTime` (router) | 0                             | O TanStack Query controla o frescor dos dados.                   |

Chaves de query: `['nfts', 'list', NftListRequest]` (com padrões aplicados, para que `/?sort=recently-listed` e `/` compartilhem o cache), `['nfts', 'featured']`, `['nfts', 'detail', id]` e `['nfts', 'related', id]`. Todas compartilham o prefixo `['nfts']`, usado na reconciliação após reconexão. Componentes que precisam da mesma lista (grade, filtros, gaveta) chamam a mesma `queryOptions`, e o Query deduplica a requisição.

## Mocking

- O MSW roda no navegador. As requisições REST passam pelo Service Worker (`public/mockServiceWorker.js`, gerado por `msw init`). Já o WebSocket é interceptado na própria página, porque o MSW substitui o construtor global `WebSocket` ao iniciar.
- `src/main.tsx` aguarda `worker.start()` antes de renderizar quando `VITE_ENABLE_MOCKS === 'true'`. A condição é substituída estaticamente pelo Vite, e o chunk de mocks é descartado nos builds sem mocks.
- A URL do worker considera `BASE_URL`, o que permite deploy em subcaminho.
- As URLs da API (`src/lib/http/config.ts`) e do servidor Socket.IO (`src/lib/realtime/config.ts`) são compartilhadas entre o código da aplicação e os mocks, para nunca divergirem.
- **Ordem de inicialização:** `src/main.tsx` importa a aplicação dinamicamente **depois** de `worker.start()`. O `engine.io-client` guarda `globalThis.WebSocket` quando o módulo é avaliado; se a aplicação fosse importada estaticamente, o cliente guardaria o WebSocket nativo antes de o MSW substituí-lo, e a conexão iria para a rede real (o `vite preview` responde 200 com HTML e o handshake falha).
- **Fonte única de dados:** o estado vive em memória em `src/mocks/state/nft-catalog.state.ts` e é reiniciado a cada recarga da página. `GET /api/nfts`, `/featured`, `/:id`, `/:id/related` e os eventos `nft.updated` leem e publicam a partir dos mesmos registros; uma alteração de mercado substitui o registro (com `version + 1`) e o evento é montado a partir dele.

### Usuários e sessões

- `src/mocks/fixtures/user.fixtures.ts` define 2 usuários fictícios (Ana e Bruno) com `passwordSalt` e `passwordHash` (SHA-256 de `salt:senha`); nenhuma senha em claro fica no código.
- `src/mocks/state/auth.state.ts` guarda usuários cadastrados e sessões e os persiste no `localStorage` (`kurio-mock:auth:v1`), para que a sessão sobreviva ao refresh. Cada teste do Playwright começa com um contexto de navegador limpo.

### Fixtures do catálogo

`src/mocks/fixtures/nft-catalog.fixtures.ts` gera 63 NFTs de forma determinística:

- os 9 primeiros reproduzem a primeira página do Figma (nomes, preços, preço anterior e artes); o Emerald Ape #042 reproduz também o detalhe do Figma (token #0042, Nova Sato, 5% de royalties, nota 4,8 com 19 avaliações, contrato `0x7A42...19E8`);
- o estoque total de cada NFT é dividido entre as 4 edições de forma determinística, e os textos de detalhe (resumo, descrição, rede, royalties) são montados a partir dos dados do próprio NFT;
- os outros 54 combinam 18 nomes × 3 edições e distribuem coleções, redes, preços de `0.02` a `12.30` ETH, NFTs esgotados, raros e com preço reduzido;
- a data de referência é fixa (`2026-10-01T12:00Z`), então "Novos lançamentos" não depende do relógio.

### Condições de rede

`src/mocks/network/network-conditions.ts` aplica latência padrão de 250 ms aos handlers de NFTs (lista, destaque, detalhe e relacionados) e consulta, a cada requisição, a função `window.__KURIO_NETWORK_CONDITIONS__(request)`, que pode devolver `{ delayMs, status }`. Testes a definem com `page.addInitScript` (antes da primeira requisição); em desenvolvimento, pelo console. Exemplos no README.

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

No detalhe, abaixo de 768 px vale o frame mobile (imagem com gradiente, folha de detalhes e barra de compra fixa); de 768 a 1023 px, a galeria e as informações ficam empilhadas; a partir de 1024 px, lado a lado como no frame desktop.

O hero desktop e o mobile (e os layouts do detalhe) são escolhidos com `useMediaQuery` (e não escondidos via CSS), para que só a imagem do hero visível seja baixada e exista um único `h1`.

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

#### Detalhe do NFT

| Ponto                                   | Figma                                                         | Implementação e motivo                                                                                     |
| --------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Miniaturas da galeria                   | A mesma imagem 4 vezes                                         | 4 vistas da mesma obra (completa e recortes ampliados), sem inventar artes que não pertencem ao NFT.      |
| Indicadores da galeria (mobile)         | SVG estático de 3 pontos                                       | Botões em CSS, um por vista (4), com estado selecionado, porque são interativos.                           |
| "Coleção"                               | Usado para a categoria ("Mais desta coleção") e para a série ("Coleção: Kurio Apes") | "Coleção" é a categoria (a mesma dos filtros da Home) e "Série" é o nome da série; os relacionados vêm da mesma coleção. |
| Metadados                               | ID, coleção e atributos                                         | Também "Série" e "Criador" (o criador é exigido pelo enunciado e no Figma só aparece na descrição).       |
| Rótulos "Contrato" e "Direitos autorais" | Trocados (o texto de royalties está sob "Contrato" e o endereço sob "Direitos autorais") | Cada rótulo acompanha o conteúdo correspondente.                                         |
| Edições no mobile                       | "1/10" repetido                                                | As mesmas 4 edições do desktop.                                                                            |
| Disponibilidade e avisos                | Não desenhados                                                 | Linha de disponibilidade da edição e aviso de alteração em tempo real abaixo da quantidade.               |
| Compra e favoritos                      | Botões ativos                                                  | Visíveis, com 60% de opacidade, `aria-disabled` e o motivo escrito abaixo.                                 |
| Aba "Avaliações de colecionadores"      | Aba clicável                                                   | Indisponível (`aria-disabled`): não há conteúdo de avaliações nesta etapa.                                 |
| Folha de detalhes (mobile)              | Sobrepõe 114 px da imagem                                       | Sobrepõe apenas o fundo (30 px), mantendo a obra inteira visível.                                         |
| Descrição e relacionados no mobile      | Fora do frame mobile                                            | Exibidos abaixo da folha de detalhes, para não esconder informação em uma largura.                         |
| Pontos do carrossel de relacionados     | Três pontos                                                     | Omitidos: os relacionados são uma grade, não um carrossel.                                                 |
| Cards relacionados                      | 219 × 255 px, nome 15 px e preço 16 px                          | Reutilizam o card do catálogo (mesma proporção, nome 16 px e preço 18 px).                                 |

#### Login e cadastro

| Ponto                                   | Figma                                                         | Implementação e motivo                                                                                     |
| --------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Fundo do modal (desktop)                | Página do marketplace sob um scrim                              | Hero da Home (inerte, `aria-hidden`) sob o overlay do `Dialog`, com cabeçalho e rodapé reais.             |
| Rótulos dos campos                      | Somente placeholders                                           | Placeholders mantidos, com `<label>` visualmente oculto e mensagens de erro associadas ao campo.          |
| Placeholder do e-mail no login          | "contato@email.com"                                            | "E-mail" (o valor de exemplo parecia um campo preenchido).                                                 |
| Mostrar/ocultar senha                   | Só o ícone de olho riscado, sem estado alternativo               | Botão funcional; o estado "visível" usa o ícone `Eye` do Lucide na mesma cor.                             |
| Mensagens de erro                       | Não desenhadas                                                 | Abaixo de cada campo, na cor `Text/Coral` do Figma, com borda do campo na mesma cor.                      |
| "Esqueceu a senha?" e login social      | Ativos                                                          | Indisponíveis (`aria-disabled`, motivo descrito): não fazem parte do escopo.                               |
| Cabeçalho com sessão                    | Não desenhado                                                  | Nome do usuário (link para o perfil) e botão "Sair" com o mesmo ícone de logout do Figma.                 |
| Ícone de perfil da tab bar              | Sem ação definida                                              | Leva a `/perfil` (ou ao login, preservando o destino).                                                    |

### Ações fora do escopo atual

Itens desenhados cuja funcionalidade não existe nesta etapa não simulam sucesso: "Criadores", "Aprenda", carrinho, "Entrar", links de perfil e ajuda do rodapé, "Ler mais" do blog e os itens da tab bar mobile (exceto Início) têm `aria-disabled="true"` e o título "Disponível em breve". A newsletter informa que a inscrição não está disponível nesta demonstração. "Mercado", as promoções e as coleções do rodapé levam ao catálogo com o filtro correspondente. No detalhe, comprar, adicionar ao carrinho e favoritar seguem o mesmo princípio (veja "Ações de compra e favoritos"); os links de compartilhamento abrem os serviços reais em nova aba.

No fluxo Mercado (`/nfts/*`), o cabeçalho segue o componente do Figma para telas de mercado: "Mercado" ativo e sem o divisor. No mobile, a tab bar dá lugar à barra de compra fixa do frame de detalhe.

## Decisões e restrições de versão

- **TypeScript `~6.0`:** o typescript-eslint 8.x exige `typescript <6.1.0`, então o TypeScript 7 ainda não é suportado.
- **MSW 2.15 em vez de 3.x:** o `@mswjs/socket.io-binding@0.2.0` (versão mais recente) declara `msw ^2.10.2` como peer dependency. O projeto voltou para a última versão 2.x, sem `--force` nem `--legacy-peer-deps`. A infraestrutura REST (`setupWorker`, `http`, `HttpResponse`) é a mesma nas duas versões. O binding traz sua própria cópia de `@mswjs/interceptors` (0.39), mas usa dela apenas tipos; em tempo de execução, opera sobre as conexões criadas pelo MSW.
- **`setupWorker` clássico:** usamos o worker gerado por `msw init`.
- **Pacote `cn`:** a CLI do shadcn (4.x) gera componentes que importam `cn` do pacote npm de mesmo nome, mantido pelo autor do shadcn, em vez de `@/lib/utils`. Adotamos esse padrão para manter consistência com futuros `shadcn add`. A CLI não instala automaticamente `class-variance-authority` nem `lucide-react`; ambos foram adicionados manualmente.
- **`src/routeTree.gen.ts` versionado:** o arquivo é gerado pelo plugin do TanStack Router, mas fica versionado para que `typecheck` funcione num checkout limpo, antes do primeiro build.
- **Playwright sobre o build de demonstração:** os testes usam o mesmo artefato do deploy, e não o servidor de desenvolvimento.
- **Evidência de tráfego Socket.IO nos testes:** como o WebSocket é mockado dentro da página, o Playwright não o enxerga como tráfego de rede. Por isso, `e2e/realtime.spec.ts` comprova o caminho de três formas: o endpoint de controle não devolve dados; o frame `42["nft.updated",…]` aparece exatamente uma vez no log do MSW; e, com o socket desconectado, a interface não muda.
- **Página de diagnóstico:** a página provisória da Etapa 2 (status da API e demonstração de tempo real) foi movida de `/` para `/diagnostico`, preservando seus testes. Desde a Etapa 4 ela usa o NFT em destaque do catálogo, e não mais um NFT de demonstração com estado próprio.
- **Testes que aguardam o socket:** antes de disparar uma alteração, os testes esperam o frame de conexão do Socket.IO (`⬆ 40`) no log do MSW; um evento emitido antes da conexão seria perdido (e corretamente reconciliado apenas na próxima reconexão).
- **Requisições disparadas pelos testes:** `fetch` executado logo após o `goto` pode sair antes de o Service Worker do MSW controlar a página e chegar ao servidor de preview. Os testes esperam um elemento da aplicação (que só renderiza depois de os mocks iniciarem) antes de chamar endpoints diretamente.
- **Clique em ações indisponíveis nos testes:** o Playwright trata `aria-disabled="true"` como não acionável; os testes usam `click({ force: true })` para provar que o clique real não tem efeito.

## Limitações conhecidas

- O carrinho ainda não existe, então `nft.updated` atualiza catálogo, detalhe, relacionados e destaque, mas ainda não um resumo de carrinho.
- O estado dos mocks ainda não persiste entre recargas, e ainda não há seleção nem reset de cenários. As condições de rede cobrem apenas os endpoints de NFTs.
- A aplicação é importada dinamicamente após os mocks (veja "Ordem de inicialização"); o impacto no carregamento será medido na etapa de Lighthouse.
- `order.updated` ainda não existe; o canal privado por usuário (`emitToUser`) e o novo handshake a cada troca de sessão já estão prontos para ele.
- Favoritos, carrinho, checkout, carteiras e edição de perfil continuam indisponíveis; `/perfil` mostra apenas o resumo da conta.
- A sessão não é renovada automaticamente: ao fim dos 30 minutos o usuário precisa entrar novamente.
- O estado do catálogo continua em memória (reinicia no refresh), enquanto usuários e sessões persistem; o reset completo de cenários ainda não existe.
