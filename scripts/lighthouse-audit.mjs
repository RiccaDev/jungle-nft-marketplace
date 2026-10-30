// Audits the demo build (MSW enabled) with Lighthouse: 2 pages × 2 form factors × 3 runs.
// Usage: npm run build:demo && npm run audit:lighthouse
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const PORT = 4174
const BASE_URL = `http://localhost:${PORT}`
const RUNS = 3
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'nft-detail', path: '/nfts/emerald-ape-042' },
]
const FORM_FACTORS = [
  { name: 'mobile', config: undefined },
  { name: 'desktop', config: desktopConfig },
]
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const METRICS = {
  lcpMs: 'largest-contentful-paint',
  cls: 'cumulative-layout-shift',
  tbtMs: 'total-blocking-time',
  fcpMs: 'first-contentful-paint',
}

const outputDir = path.resolve('reports/lighthouse')

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // Server still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Preview server did not answer at ${url}`)
}

function startPreview() {
  return spawn('npx', ['vite', 'preview', '--mode', 'demo', '--port', String(PORT), '--strictPort'], {
    shell: true,
    stdio: 'ignore',
  })
}

// npx runs through a shell, so the whole process tree must be stopped (Windows keeps orphans).
function stopPreview(preview) {
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(preview.pid), '/T', '/F'], { stdio: 'ignore' })
  else preview.kill()
}

function summarizeRun(lhr) {
  const scores = Object.fromEntries(CATEGORIES.map((id) => [id, Math.round(lhr.categories[id].score * 100)]))
  const metrics = Object.fromEntries(
    Object.entries(METRICS).map(([key, auditId]) => [key, lhr.audits[auditId].numericValue]),
  )
  return { scores, metrics }
}

function summarizeRuns(runs) {
  const scores = Object.fromEntries(CATEGORIES.map((id) => [id, median(runs.map((run) => run.scores[id]))]))
  const metrics = Object.fromEntries(Object.keys(METRICS).map((key) => [key, median(runs.map((run) => run.metrics[key]))]))
  return { scores, metrics }
}

function toMarkdown(summary) {
  const header = '| Página | Dispositivo | Performance | Acessibilidade | Boas práticas | SEO | LCP (ms) | CLS | TBT (ms) |'
  const divider = '|---|---|---|---|---|---|---|---|---|'
  const rows = summary.results.map(({ page, formFactor, median: { scores, metrics } }) =>
    [
      page,
      formFactor,
      scores.performance,
      scores.accessibility,
      scores['best-practices'],
      scores.seo,
      Math.round(metrics.lcpMs),
      metrics.cls.toFixed(3),
      Math.round(metrics.tbtMs),
    ].join(' | '),
  )
  return [
    `Lighthouse ${summary.lighthouseVersion} · ${summary.userAgent}`,
    `Executado em ${summary.generatedAt} · ${RUNS} execuções por combinação · mediana`,
    '',
    header,
    divider,
    ...rows.map((row) => `| ${row} |`),
    '',
  ].join('\n')
}

async function main() {
  await mkdir(outputDir, { recursive: true })
  const preview = startPreview()
  let chrome
  try {
    await waitForServer(BASE_URL)
    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] })
    const results = []
    let lighthouseVersion = ''
    let userAgent = ''

    for (const page of PAGES) {
      for (const formFactor of FORM_FACTORS) {
        const runs = []
        for (let run = 1; run <= RUNS; run += 1) {
          const result = await lighthouse(
            `${BASE_URL}${page.path}`,
            { port: chrome.port, output: ['html', 'json'], onlyCategories: CATEGORIES, logLevel: 'error' },
            formFactor.config,
          )
          const baseName = `${page.name}-${formFactor.name}-run${run}`
          await writeFile(path.join(outputDir, `${baseName}.html`), result.report[0])
          await writeFile(path.join(outputDir, `${baseName}.json`), result.report[1])
          lighthouseVersion = result.lhr.lighthouseVersion
          userAgent = result.lhr.environment.hostUserAgent
          runs.push(summarizeRun(result.lhr))
          console.log(baseName, JSON.stringify(runs.at(-1).scores))
        }
        results.push({ page: page.name, formFactor: formFactor.name, runs, median: summarizeRuns(runs) })
      }
    }

    const summary = { generatedAt: new Date().toISOString(), lighthouseVersion, userAgent, baseUrl: BASE_URL, results }
    await writeFile(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2))
    await writeFile(path.join(outputDir, 'summary.md'), toMarkdown(summary))
    console.log(toMarkdown(summary))
  } finally {
    await chrome?.kill()
    stopPreview(preview)
  }
}

await main()
