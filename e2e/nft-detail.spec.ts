import { expect, test, type Page } from '@playwright/test'

const NFT_UPDATED_FRAME = /⬇.*42\["nft\.updated"/
const SOCKET_IO_CONNECT_FRAME = /⬆.*\b40\b/

function waitForSocketConnection(page: Page) {
  return page.waitForEvent('console', (message) => SOCKET_IO_CONNECT_FRAME.test(message.text()))
}

function countNftUpdatedFrames(page: Page) {
  const frames: string[] = []
  page.on('console', (message) => {
    if (NFT_UPDATED_FRAME.test(message.text())) frames.push(message.text())
  })
  return frames
}

async function postMockControl(page: Page, path: string) {
  const status = await page.evaluate(
    async (url) => (await fetch(url, { method: 'POST' })).status,
    `/api/__mocks__/nfts/${path}`,
  )
  expect(status).toBe(202)
}

function triggerMarketChange(page: Page, nftId: string) {
  return postMockControl(page, `${nftId}/market-change`)
}

function replayNftEvent(page: Page, nftId: string, version: number) {
  return postMockControl(page, `${nftId}/events/${version}/replay`)
}

async function openDetail(page: Page, path: string) {
  const socketConnected = waitForSocketConnection(page)
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await socketConnected
}

function detailPrice(page: Page) {
  return page.getByTestId('nft-detail-price')
}

function quantity(page: Page) {
  return page.getByRole('status', { name: 'Quantidade selecionada' })
}

test.describe('detalhe do NFT no desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Layout desktop.')

  test('abre a partir do card da Home e marca o fluxo Mercado', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Emerald Ape #042' }).click()

    await expect(page).toHaveURL(/\/nfts\/emerald-ape-042$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(detailPrice(page)).toHaveText('1.19 ETH')
    await expect(page.getByRole('link', { name: 'Mercado', exact: true }).first()).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(page.getByText('ID do token: #0042')).toBeVisible()
  })

  test('suporta acesso direto, refresh e navegação pelos relacionados', async ({ page }) => {
    await page.goto('/nfts/golden-signal-160')
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Golden Signal #160' })).toBeVisible()

    const relatedLinks = page.getByTestId('related-nfts').getByRole('link')
    await expect(relatedLinks).toHaveCount(5)
    const relatedName = await relatedLinks.first().textContent()
    await relatedLinks.first().click()
    await expect(page.getByRole('heading', { level: 1, name: relatedName ?? '' })).toBeVisible()
  })

  test('trata NFT inexistente com 404', async ({ page }) => {
    const detailResponse = page.waitForResponse((response) =>
      response.url().endsWith('/api/nfts/nft-inexistente'),
    )
    await page.goto('/nfts/nft-inexistente')

    expect((await detailResponse).status()).toBe(404)
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
    await page.getByRole('link', { name: 'Voltar ao catálogo' }).click()
    await expect(page).toHaveURL(/\/#catalogo$/)
  })

  test('limita a quantidade ao estoque e ao máximo por pedido de cada edição', async ({ page }) => {
    await page.goto('/nfts/golden-signal-160')

    await expect(page.getByRole('radio', { name: '1/50' })).toBeChecked()
    await expect(page.getByTestId('nft-availability')).toHaveText(
      '6 disponíveis na edição 1/50 · máximo de 5 por pedido.',
    )
    await expect(page.getByRole('button', { name: 'Diminuir quantidade' })).toBeDisabled()

    const increase = page.getByRole('button', { name: 'Aumentar quantidade' })
    for (let step = 0; step < 4; step += 1) await increase.click()
    await expect(quantity(page)).toHaveText('5')
    await expect(increase).toBeDisabled()

    await page.getByRole('radio', { name: '1/10' }).check()
    await expect(page).toHaveURL(/edition=one-of-ten/)
    await expect(quantity(page)).toHaveText('1')
    await expect(page.getByTestId('nft-availability')).toHaveText(
      '3 disponíveis na edição 1/10 · máximo de 2 por pedido.',
    )
    await increase.click()
    await expect(quantity(page)).toHaveText('2')
    await expect(increase).toBeDisabled()
  })

  test('mostra edição esgotada e NFT totalmente esgotado', async ({ page }) => {
    await page.goto('/nfts/sage-nomad-009?edition=one-of-one')

    await expect(page.getByRole('radio', { name: '1/1 (esgotada)' })).toBeDisabled()
    await expect(page.getByTestId('nft-availability')).toHaveText(
      'Esta edição está esgotada. Escolha outra edição.',
    )
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()

    await page.goto('/nfts/ivory-baron-088')
    await expect(page.getByTestId('nft-availability')).toHaveText(
      'Todas as edições deste NFT estão esgotadas.',
    )
  })

  test('expõe favoritar como botão alternável, sem simular sucesso para visitantes', async ({ page }) => {
    await page.goto('/nfts/emerald-ape-042')

    const favoriteButton = page.getByTestId('favorite-button').filter({ visible: true }).first()
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false')
    await favoriteButton.click()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fnfts%2Femerald-ape-042$/)
  })

  test('aplica nft.updated no detalhe e ignora eventos duplicados ou antigos', async ({ page }) => {
    const nftUpdatedFrames = countNftUpdatedFrames(page)
    await openDetail(page, '/nfts/emerald-ape-042')

    await triggerMarketChange(page, 'emerald-ape-042')
    await expect(detailPrice(page)).toHaveText('1.26 ETH')
    await expect(page.getByTestId('nft-change-notice')).toContainText(
      'Preço atualizado de 1.19 ETH para 1.26 ETH.',
    )
    await expect(page.getByTestId('nft-availability')).toHaveText('2 disponíveis na edição 1/50.')

    await triggerMarketChange(page, 'emerald-ape-042')
    await expect(detailPrice(page)).toHaveText('1.35 ETH')

    await replayNftEvent(page, 'emerald-ape-042', 2)
    await expect.poll(() => nftUpdatedFrames.length).toBe(3)
    await expect(detailPrice(page)).toHaveText('1.35 ETH')
    await expect(page.getByTestId('nft-change-notice')).toContainText(
      'Preço atualizado de 1.26 ETH para 1.35 ETH.',
    )
  })

  test('ajusta a quantidade e bloqueia a compra quando o estoque cai em tempo real', async ({ page }) => {
    await openDetail(page, '/nfts/emerald-ape-042')

    const increase = page.getByRole('button', { name: 'Aumentar quantidade' })
    await increase.click()
    await increase.click()
    await expect(quantity(page)).toHaveText('3')

    await triggerMarketChange(page, 'emerald-ape-042')
    await expect(quantity(page)).toHaveText('2')
    await expect(page.getByTestId('nft-change-notice')).toContainText(
      'Quantidade ajustada para 2 conforme o estoque atual.',
    )

    await triggerMarketChange(page, 'emerald-ape-042')
    await expect(page.getByTestId('nft-availability')).toHaveText(
      'Esta edição está esgotada. Escolha outra edição.',
    )
    await expect(increase).toBeDisabled()
    await expect(page.getByRole('radio', { name: '1/50 (esgotada)' })).toBeDisabled()
  })

  test('reflete nft.updated nos cards do catálogo', async ({ page }) => {
    const socketConnected = waitForSocketConnection(page)
    await page.goto('/')
    await socketConnected
    const emeraldCard = page.getByRole('article').filter({ hasText: 'Emerald Ape #042' })
    await expect(emeraldCard.getByTestId('nft-price')).toHaveText('1.19 ETH')

    await triggerMarketChange(page, 'emerald-ape-042')
    await expect(emeraldCard.getByTestId('nft-price')).toHaveText('1.26 ETH')
  })

  test('exibe skeleton, erro de rede e recupera ao tentar novamente', async ({ page }) => {
    await page.addInitScript(() => {
      const failingRequestCount = 3
      let detailRequestCount = 0
      window.__KURIO_NETWORK_CONDITIONS__ = (request) => {
        if (new URL(request.url).pathname !== '/api/nfts/emerald-ape-042') return undefined
        detailRequestCount += 1
        return detailRequestCount <= failingRequestCount ? { delayMs: 1000, status: 503 } : { delayMs: 0 }
      }
    })
    await page.goto('/nfts/emerald-ape-042')

    await expect(page.getByTestId('nft-detail-skeleton')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Não foi possível carregar este NFT.' })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  })
})

test.describe('detalhe do NFT no mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'Layout mobile.')

  test('usa a barra de compra fixa, sem tab bar, e volta para a Home', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Golden Signal #160' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Golden Signal #160' })).toBeVisible()

    await expect(page.getByRole('navigation', { name: 'Navegação inferior' })).toHaveCount(0)
    const buyBar = page.getByRole('region', { name: 'Compra' })
    await expect(buyBar.getByTestId('nft-detail-price')).toHaveText('0.39 ETH')
    await buyBar.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(buyBar.getByRole('status', { name: 'Quantidade selecionada' })).toHaveText('2')
    await expect(buyBar.getByRole('button', { name: 'Comprar NFT' })).toBeEnabled()

    await page.getByRole('button', { name: 'Voltar' }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})
