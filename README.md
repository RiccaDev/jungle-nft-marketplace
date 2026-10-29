# NFT Marketplace — Desafio Frontend Jungle Gaming

Implementação do desafio Frontend da Jungle Gaming. O enunciado original está em [Jungle_Gaming_README_OFICIAL_COMPLETO.md](Jungle_Gaming_README_OFICIAL_COMPLETO.md), e as decisões técnicas estão em [ARCHITECTURE.md](ARCHITECTURE.md).

> **Status:** fundação do projeto concluída. As telas do marketplace ainda não foram implementadas.

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
