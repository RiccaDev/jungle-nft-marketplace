import { expect, test, type Locator, type Page } from '@playwright/test'

const RESULTS_ANNOUNCEMENT = /NFTs? encontrados?\.$/

function catalogStatus(page: Page) {
  return page.getByTestId('catalog-status')
}

function cardNames(page: Page) {
  return page.getByTestId('nft-grid').getByRole('heading', { level: 3 })
}

function cardPrices(page: Page) {
  return page.getByTestId('nft-grid').getByTestId('nft-price')
}

async function waitForResults(page: Page) {
  await expect(catalogStatus(page)).toHaveText(RESULTS_ANNOUNCEMENT)
}

async function readPrices(prices: Locator) {
  const texts = await prices.allTextContents()
  return texts.map((text) => Number.parseFloat(text))
}

function filterCheckbox(page: Page, name: string) {
  return page.getByRole('checkbox', { name: new RegExp(`^${name}`) })
}

async function facetCount(page: Page, name: string) {
  const label = page.locator('label').filter({ has: filterCheckbox(page, name) })
  const text = await label.textContent()
  return Number(text?.match(/\((\d+)\)/)?.[1])
}

test.describe('catálogo no desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Filtros laterais só existem no layout desktop.')

  test('carrega a primeira página com os NFTs do design', async ({ page }) => {
    await page.goto('/')
    await waitForResults(page)

    await expect(cardNames(page)).toHaveCount(9)
    await expect(cardNames(page).first()).toHaveText('Emerald Ape #042')
    await expect(cardPrices(page).first()).toHaveText('1.19 ETH')
    await expect(page.getByRole('link', { name: 'Página 2' })).toBeVisible()
  })

  test('busca pelo nome, reflete na URL e sobrevive ao refresh', async ({ page }) => {
    await page.goto('/')
    await waitForResults(page)

    await page.getByRole('button', { name: 'Buscar NFTs' }).click()
    await page.getByRole('searchbox', { name: 'Buscar NFTs' }).fill('golden')

    await expect(page).toHaveURL(/search=golden/)
    await waitForResults(page)
    for (const name of await cardNames(page).allTextContents()) {
      expect(name.toLowerCase()).toContain('golden')
    }

    await page.reload()
    await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toHaveValue('golden')
    await expect(cardNames(page).first()).toContainText('Golden')
  })

  test('combina filtros de coleção e rede, usando as contagens da API', async ({ page }) => {
    await page.goto('/?page=2')
    await waitForResults(page)

    const musicCount = await facetCount(page, 'Música')
    await filterCheckbox(page, 'Música').check()
    await expect(page).toHaveURL(/collections=music/)
    await expect(page).not.toHaveURL(/page=/)
    await expect(catalogStatus(page)).toHaveText(`${musicCount} NFTs encontrados.`)

    const musicOnEthereumCount = await facetCount(page, 'Ethereum')
    await filterCheckbox(page, 'Ethereum').check()
    await expect(page).toHaveURL(/collections=music&networks=ethereum|networks=ethereum.*collections=music/)
    await expect(catalogStatus(page)).toHaveText(
      musicOnEthereumCount === 1 ? '1 NFT encontrado.' : `${musicOnEthereumCount} NFTs encontrados.`,
    )
    await expect(filterCheckbox(page, 'Música')).toBeChecked()
  })

  test('ordena por preço nos dois sentidos', async ({ page }) => {
    await page.goto('/')
    await waitForResults(page)

    await page.getByRole('combobox', { name: 'Ordenar por:' }).click()
    await page.getByRole('option', { name: 'Menor preço' }).click()
    await expect(page).toHaveURL(/sort=price-asc/)
    await expect(cardPrices(page).first()).toHaveText('0.02 ETH')
    const ascendingPrices = await readPrices(cardPrices(page))
    expect(ascendingPrices).toEqual([...ascendingPrices].sort((left, right) => left - right))

    await page.getByRole('combobox', { name: 'Ordenar por:' }).click()
    await page.getByRole('option', { name: 'Maior preço' }).click()
    await expect(page).toHaveURL(/sort=price-desc/)
    await expect(cardPrices(page).first()).toHaveText('12.30 ETH')
  })

  test('filtra por faixa de preço pelo teclado e pela URL', async ({ page }) => {
    await page.goto('/')
    await waitForResults(page)

    const minimumThumb = page.getByRole('slider', { name: 'Preço mínimo' })
    await minimumThumb.focus()
    for (let step = 0; step < 10; step += 1) await minimumThumb.press('PageUp')
    await page.getByRole('button', { name: 'Aplicar' }).click()

    await expect(page).toHaveURL(/minPrice=1\.02/)
    await waitForResults(page)
    for (const price of await readPrices(cardPrices(page))) expect(price).toBeGreaterThanOrEqual(1.02)

    await page.goto('/?minPrice=1.00&maxPrice=2.00')
    await waitForResults(page)
    for (const price of await readPrices(cardPrices(page))) {
      expect(price).toBeGreaterThanOrEqual(1)
      expect(price).toBeLessThanOrEqual(2)
    }
  })

  test('pagina e reinicia a paginação quando um filtro muda', async ({ page }) => {
    await page.goto('/')
    await waitForResults(page)
    const firstPageNames = await cardNames(page).allTextContents()

    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(
      page.getByRole('navigation', { name: 'Paginação do catálogo' }).locator('[aria-current="page"]'),
    ).toHaveText('Página 2')
    await expect(cardNames(page).first()).not.toHaveText(firstPageNames[0] ?? '')

    await page.getByRole('link', { name: 'Novos lançamentos' }).click()
    await expect(page).toHaveURL(/segment=new-releases/)
    await expect(page).not.toHaveURL(/page=/)
  })

  test('restaura filtros ao navegar pelo histórico', async ({ page }) => {
    await page.goto('/')
    await waitForResults(page)

    await filterCheckbox(page, 'Fotografia').check()
    await expect(page).toHaveURL(/collections=photography/)
    await page.getByRole('link', { name: 'Em alta' }).click()
    await expect(page).toHaveURL(/segment=trending/)
    await waitForResults(page)

    await page.goBack()
    await expect(page).not.toHaveURL(/segment=/)
    await expect(filterCheckbox(page, 'Fotografia')).toBeChecked()
    await expect(page.getByRole('link', { name: 'Todos os NFTs' })).toHaveAttribute('aria-current', 'page')

    await page.goBack()
    await expect(page).not.toHaveURL(/collections=/)
    await expect(filterCheckbox(page, 'Fotografia')).not.toBeChecked()

    await page.goForward()
    await expect(filterCheckbox(page, 'Fotografia')).toBeChecked()
  })

  test('mostra estado vazio e limpa os filtros', async ({ page }) => {
    await page.goto('/?search=inexistente-xyz&networks=solana')

    await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado.' })).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros' }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(cardNames(page)).toHaveCount(9)
  })

  test('exibe skeletons na lentidão, erro na falha e recupera ao tentar novamente', async ({ page }) => {
    await page.addInitScript(() => {
      // The initial request plus the two automatic retries fail; the manual retry succeeds.
      const failingRequestCount = 3
      let catalogRequestCount = 0
      window.__KURIO_NETWORK_CONDITIONS__ = (request) => {
        if (new URL(request.url).pathname !== '/api/nfts') return undefined
        catalogRequestCount += 1
        return catalogRequestCount <= failingRequestCount
          ? { delayMs: 1500, status: 503 }
          : { delayMs: 0 }
      }
    })
    await page.goto('/')

    await expect(page.getByTestId('nft-grid-skeleton')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Não foi possível carregar os NFTs.' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByTestId('nft-grid-skeleton')).toHaveCount(0)

    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(cardNames(page)).toHaveCount(9)
  })

  test('descarta respostas fora de ordem e mantém a busca mais recente', async ({ page }) => {
    await page.addInitScript(() => {
      window.__KURIO_NETWORK_CONDITIONS__ = (request) => {
        const search = new URL(request.url).searchParams.get('search')
        return search === 'emerald' ? { delayMs: 2000 } : { delayMs: 0 }
      }
    })
    await page.goto('/')
    await waitForResults(page)

    await page.getByRole('button', { name: 'Buscar NFTs' }).click()
    const searchbox = page.getByRole('searchbox', { name: 'Buscar NFTs' })
    const slowRequest = page.waitForRequest((request) => request.url().includes('search=emerald'))
    await searchbox.fill('emerald')
    await slowRequest
    await searchbox.fill('golden')

    await expect(page).toHaveURL(/search=golden/)
    await expect(cardNames(page).first()).toContainText('Golden')
    await page.waitForTimeout(2500)
    for (const name of await cardNames(page).allTextContents()) {
      expect(name).not.toContain('Emerald')
    }
  })
})

test.describe('catálogo no mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'Fluxo específico do layout mobile.')

  test('busca e filtra pela gaveta de filtros', async ({ page }) => {
    await page.goto('/')
    await waitForResults(page)

    await page.getByRole('searchbox', { name: 'Buscar NFTs' }).fill('nomad')
    await expect(page).toHaveURL(/search=nomad/)
    await waitForResults(page)

    await page.getByRole('button', { name: 'Filtros e ordenação' }).click()
    const filtersDrawer = page.getByRole('dialog', { name: 'Filtros' })
    await filtersDrawer.getByRole('checkbox', { name: /^Polygon/ }).check()
    await expect(page).toHaveURL(/networks=polygon/)
    await page.keyboard.press('Escape')
    await expect(filtersDrawer).toBeHidden()

    await waitForResults(page)
    for (const name of await cardNames(page).allTextContents()) {
      expect(name.toLowerCase()).toContain('nomad')
    }

    await page.reload()
    await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toHaveValue('nomad')
    await expect(page).toHaveURL(/networks=polygon/)
  })
})
