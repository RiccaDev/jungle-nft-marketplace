# Arquitetura

Este documento é atualizado conforme cada etapa é concluída e verificada.

## Estrutura

```
src/
  app/              composição da aplicação: providers, router e QueryClient
  routes/           rotas baseadas em arquivo do TanStack Router
  features/<x>/     código por domínio: contratos, chamadas REST, query options, hooks e componentes
  lib/http/         cliente Axios e configuração de URL compartilhada
  lib/realtime/     cliente socket.io-client, contrato dos eventos e hook de conexão
  mocks/
    handlers/       handlers REST do MSW, por recurso
    realtime/       servidor Socket.IO simulado (MSW `ws` + @mswjs/socket.io-binding)
    state/          estado mutável dos mocks
  components/ui/    componentes shadcn/ui adaptados ao tema
  styles/           Tailwind e tokens de design
e2e/                testes Playwright
```

### Responsabilidades

- **Rotas:** compõem a tela. Não chamam o Axios nem o socket diretamente.
- **Features:** cada uma define seu contrato tipado, a função de transporte (Axios) e as `queryOptions`. As telas consomem as `queryOptions`.
- **Realtime (`lib/realtime`):** mantém uma instância única do `socket.io-client`, tipada por `ServerToClientEvents`. As features assinam os eventos e aplicam as mudanças no cache do TanStack Query.
- **Mocks:** ficam isolados na camada de rede. Reutilizam os tipos de contrato das features e dos eventos, e nenhum componente, hook ou cliente HTTP contém resposta fictícia.

## Fluxo de dados

```
REST:      Rota → useQuery(queryOptions) → função da feature → apiClient (Axios) → MSW handler
Realtime:  MSW socket server → WebSocket (mockado) → socket.io-client → listener da feature → queryClient.setQueryData
```

O `AbortSignal` do TanStack Query é repassado ao Axios, o que permite cancelar requisições obsoletas.

## Contratos REST

| Método | Caminho                       | Resposta                                                                      |
| ------ | ----------------------------- | ----------------------------------------------------------------------------- |
| GET    | `/api/health`                 | 200 `{ status: 'ok', timestamp: string /* ISO */ }`                           |
| GET    | `/api/demo/nft`               | 200 `{ id, name, priceEth: string, availableQuantity: number, version: number }` |
| POST   | `/api/__mocks__/nft-updates`  | 202 sem corpo                                                                 |

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
| `defaultPreloadStaleTime` (router) | 0                             | O TanStack Query controla o frescor dos dados.                   |

## Mocking

- O MSW roda no navegador. As requisições REST passam pelo Service Worker (`public/mockServiceWorker.js`, gerado por `msw init`). Já o WebSocket é interceptado na própria página, porque o MSW substitui o construtor global `WebSocket` ao iniciar.
- `src/main.tsx` aguarda `worker.start()` antes de renderizar quando `VITE_ENABLE_MOCKS === 'true'`. A condição é substituída estaticamente pelo Vite, e o chunk de mocks é descartado nos builds sem mocks.
- A URL do worker considera `BASE_URL`, o que permite deploy em subcaminho.
- As URLs da API (`src/lib/http/config.ts`) e do servidor Socket.IO (`src/lib/realtime/config.ts`) são compartilhadas entre o código da aplicação e os mocks, para nunca divergirem.
- O estado dos mocks vive em memória (`src/mocks/state/`) e é reiniciado a cada recarga da página. Handlers REST e o servidor Socket.IO simulado compartilham esse estado, então uma alteração aparece tanto no REST quanto no evento.

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

## Tema

As cores e a família tipográfica (Roboto Mono, servida localmente via `@fontsource-variable`) vêm das variáveis do Figma e estão em `src/styles/globals.css` com o prefixo `--gm-*`. Os tokens semânticos do shadcn/ui (`background`, `card`, `primary`, `muted`, …) são mapeados sobre essa paleta.

Desvios provisórios: `--radius` e `--destructive` não existem nas variáveis do Figma e mantêm os valores padrão do shadcn até a implementação das telas.

## Decisões e restrições de versão

- **TypeScript `~6.0`:** o typescript-eslint 8.x exige `typescript <6.1.0`, então o TypeScript 7 ainda não é suportado.
- **MSW 2.15 em vez de 3.x:** o `@mswjs/socket.io-binding@0.2.0` (versão mais recente) declara `msw ^2.10.2` como peer dependency. O projeto voltou para a última versão 2.x, sem `--force` nem `--legacy-peer-deps`. A infraestrutura REST (`setupWorker`, `http`, `HttpResponse`) é a mesma nas duas versões. O binding traz sua própria cópia de `@mswjs/interceptors` (0.39), mas usa dela apenas tipos; em tempo de execução, opera sobre as conexões criadas pelo MSW.
- **`setupWorker` clássico:** usamos o worker gerado por `msw init`.
- **Pacote `cn`:** a CLI do shadcn (4.x) gera componentes que importam `cn` do pacote npm de mesmo nome, mantido pelo autor do shadcn, em vez de `@/lib/utils`. Adotamos esse padrão para manter consistência com futuros `shadcn add`.
- **`src/routeTree.gen.ts` versionado:** o arquivo é gerado pelo plugin do TanStack Router, mas fica versionado para que `typecheck` funcione num checkout limpo, antes do primeiro build.
- **Playwright sobre o build de demonstração:** os testes usam o mesmo artefato do deploy, e não o servidor de desenvolvimento.
- **Evidência de tráfego Socket.IO nos testes:** como o WebSocket é mockado dentro da página, o Playwright não o enxerga como tráfego de rede. Por isso, `e2e/realtime.spec.ts` comprova o caminho de três formas: o endpoint de controle não devolve dados; o frame `42["nft.updated",…]` aparece exatamente uma vez no log do MSW; e, com o socket desconectado, a interface não muda.

## Limitações conhecidas

- A página inicial é provisória (status da API e demonstração de tempo real) até a implementação do catálogo.
- O NFT de demonstração e o endpoint `/api/__mocks__/nft-updates` são provisórios e serão substituídos pelo catálogo e pelos cenários configuráveis.
- O estado dos mocks ainda não persiste entre recargas, e ainda não há seleção nem reset de cenários.
- `order.updated` e o isolamento de eventos por sessão de usuário ainda não foram implementados; dependem dos fluxos de pedido e autenticação.
