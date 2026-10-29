# Arquitetura

Este documento é atualizado conforme cada etapa é concluída e verificada.

## Estrutura

```
src/
  app/            composição da aplicação: providers, router e QueryClient
  routes/         rotas baseadas em arquivo do TanStack Router
  features/<x>/   código por domínio: contratos, chamadas REST e query options
  lib/http/       cliente Axios e configuração de URL compartilhada
  mocks/          MSW: worker do navegador e handlers por recurso
  components/ui/  componentes shadcn/ui adaptados ao tema
  styles/         Tailwind e tokens de design
e2e/              testes Playwright
```

### Responsabilidades

- **Rotas:** compõem a tela. Não chamam o Axios diretamente.
- **Features:** cada uma define seu contrato tipado, a função de transporte (Axios) e as `queryOptions`. As telas consomem as `queryOptions`.
- **Mocks:** ficam isolados na camada de rede. Reutilizam os tipos de contrato das features, e nenhum componente, hook ou cliente HTTP contém resposta fictícia.

## Fluxo de dados

```
Rota → useQuery(queryOptions) → função da feature → apiClient (Axios) → rede → MSW handler
```

O `AbortSignal` do TanStack Query é repassado ao Axios, o que permite cancelar requisições obsoletas.

## Contratos REST

| Método | Caminho       | Resposta 200                                     |
| ------ | ------------- | ------------------------------------------------ |
| GET    | `/api/health` | `{ status: 'ok', timestamp: string /* ISO */ }`  |

`/api/health` é provisório e serve apenas para validar a integração ponta a ponta.

## Política de cache e retries

| Configuração           | Valor                                     | Motivo                                                           |
| ---------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| `staleTime` (queries)  | 30 s                                      | Evita refetch redundante em navegação curta.                     |
| `retry` (queries)      | até 2 tentativas; nunca em respostas 4xx  | Erros 4xx são determinísticos; só falhas transitórias são repetidas. |
| `retry` (mutations)    | desativado                                | Evita operações duplicadas.                                      |
| `defaultPreloadStaleTime` (router) | 0                             | O TanStack Query controla o frescor dos dados.                   |

## Mocking

- O MSW roda no navegador via Service Worker (`public/mockServiceWorker.js`, gerado por `msw init`).
- `src/main.tsx` aguarda `worker.start()` antes de renderizar quando `VITE_ENABLE_MOCKS === 'true'`. A condição é substituída estaticamente pelo Vite, e o chunk de mocks é descartado nos builds sem mocks.
- A URL do worker considera `BASE_URL`, o que permite deploy em subcaminho.
- A URL base da API vem de `src/lib/http/config.ts`, compartilhado pelo Axios e pelos handlers, para os dois nunca divergirem.

## Tema

As cores e a família tipográfica (Roboto Mono, servida localmente via `@fontsource-variable`) vêm das variáveis do Figma e estão em `src/styles/globals.css` com o prefixo `--gm-*`. Os tokens semânticos do shadcn/ui (`background`, `card`, `primary`, `muted`, …) são mapeados sobre essa paleta.

Desvios provisórios: `--radius` e `--destructive` não existem nas variáveis do Figma e mantêm os valores padrão do shadcn até a implementação das telas.

## Decisões e restrições de versão

- **TypeScript `~6.0`:** o typescript-eslint 8.x exige `typescript <6.1.0`, então o TypeScript 7 ainda não é suportado.
- **MSW 3 com `setupWorker` clássico:** não usamos o plugin `msw/vite`. Na v3, `onUnhandledRequest` passou a se chamar `onUnhandledFrame`, e o padrão (`warn`) é mantido.
- **Pacote `cn`:** a CLI do shadcn (4.x) gera componentes que importam `cn` do pacote npm de mesmo nome, mantido pelo autor do shadcn, em vez de `@/lib/utils`. Adotamos esse padrão para manter consistência com futuros `shadcn add`.
- **`src/routeTree.gen.ts` versionado:** o arquivo é gerado pelo plugin do TanStack Router, mas fica versionado para que `typecheck` funcione num checkout limpo, antes do primeiro build.
- **Playwright sobre o build de demonstração:** os testes usam o mesmo artefato do deploy, e não o servidor de desenvolvimento.

## Limitações conhecidas

- A página inicial é provisória (status da API) até a implementação do catálogo.
- O Socket.IO ainda não está integrado.
