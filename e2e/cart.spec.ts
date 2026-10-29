import { expect, test, type Page } from '@playwright/test'

const ANA = { email: 'ana@kurio.dev', password: 'kurio-ana-2026' }
const BRUNO = { email: 'bruno@kurio.dev', password: 'kurio-bruno-2026' }
const SOCKET_IO_CONNECT_FRAME = /⬆.*\b40\b/

function cartLine(page: Page, name: string) {
  return page.getByTestId('cart-line').filter({ hasText: name })
}

function cartBadge(page: Page) {
  return page.getByTestId('cart-badge')
}

async function addFromDetail(page: Page, nftId: string, quantity = 1) {
  await page.goto(`/nfts/${nftId}`)
  const increase = page.getByRole('button', { name: 'Aumentar quantidade' })
  for (let step = 1; step < quantity; step += 1) await increase.click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
}

async function login(page: Page, credentials: { email: string; password: string }) {
  await page.goto('/entrar')
  await page.getByRole('textbox', { name: 'E-mail' }).fill(credentials.email)
  await page.getByLabel('Senha', { exact: true }).fill(credentials.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
}

async function logout(page: Page) {
  await page.getByRole('button', { name: 'Sair' }).first().click()
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
}

async function triggerMarketChange(page: Page, nftId: string) {
  const status = await page.evaluate(
    async (url) => (await fetch(url, { method: 'POST' })).status,
    `/api/__mocks__/nfts/${nftId}/market-change`,
  )
  expect(status).toBe(202)
}

test.describe('carrinho no desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Layout desktop.')

  test('adiciona pelo detalhe, respeita o limite por pedido e remove pelo detalhe', async ({ page }) => {
    await addFromDetail(page, 'emerald-ape-042', 2)

    await expect(cartLine(page, 'Emerald Ape #042').getByTestId('cart-line-total')).toHaveText('2.38 ETH')
    await expect(cartBadge(page)).toHaveText('2')

    await page.goto('/nfts/emerald-ape-042')
    await expect(page.getByTestId('nft-availability')).toContainText('Você já tem 2 no carrinho.')
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
    await expect(page.getByTestId('nft-cart-quantity')).toHaveText('No carrinho: 2')

    await page.getByRole('button', { name: 'Remover do carrinho' }).click()
    await expect(page.getByTestId('nft-cart-quantity')).toHaveCount(0)
    await expect(cartBadge(page)).toHaveCount(0)
  })

  test('altera quantidades e remove itens com a cotação recalculada pela API', async ({ page }) => {
    await addFromDetail(page, 'golden-signal-160')
    const line = cartLine(page, 'Golden Signal #160')
    await expect(page.getByTestId('quote-total')).toHaveText('0.394 ETH')

    const increase = line.getByRole('button', { name: 'Aumentar quantidade' })
    await increase.click()
    await increase.click()
    await expect(line.getByRole('status', { name: 'Quantidade selecionada' })).toHaveText('3')
    await expect(line.getByTestId('cart-line-total')).toHaveText('1.17 ETH')
    await expect(page.getByTestId('quote-subtotal')).toHaveText('1.17 ETH')
    await expect(page.getByTestId('quote-total')).toHaveText('1.174 ETH')

    await increase.click()
    await increase.click()
    await expect(line.getByRole('status', { name: 'Quantidade selecionada' })).toHaveText('5')
    await expect(increase).toBeDisabled()

    await line.getByRole('button', { name: /Remover Golden Signal #160/ }).click()
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio.' })).toBeVisible()
  })

  test('aplica cupom válido e recusa cupons inválidos ou expirados', async ({ page }) => {
    await addFromDetail(page, 'emerald-ape-042')
    const couponInput = page.getByRole('textbox', { name: 'Código promocional' })

    await couponInput.fill('NAOEXISTE')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Cupom inválido.' })).toBeVisible()
    await expect(couponInput).toHaveAttribute('aria-invalid', 'true')

    await couponInput.fill('VERAO2025')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Este cupom expirou.' })).toBeVisible()

    await couponInput.fill('kurio10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByTestId('applied-coupon')).toContainText('KURIO10')
    await expect(page.getByTestId('quote-discount')).toHaveText('(-) 0.119 ETH')
    await expect(page.getByTestId('quote-total')).toHaveText('1.083 ETH')

    await page.getByRole('button', { name: 'Remover', exact: true }).click()
    await expect(page.getByTestId('quote-discount')).toHaveText('(-) 0.00 ETH')
    await expect(page.getByTestId('quote-total')).toHaveText('1.202 ETH')
  })

  test('mantém o carrinho do visitante após o refresh', async ({ page }) => {
    await addFromDetail(page, 'golden-beat-207', 2)
    await page.reload()

    await expect(cartLine(page, 'Golden Beat #207').getByRole('status', { name: 'Quantidade selecionada' })).toHaveText('2')
    await expect(cartBadge(page)).toHaveText('2')
  })

  test('mescla o carrinho do visitante ao entrar, sem somar quantidades', async ({ page }) => {
    await login(page, ANA)
    await addFromDetail(page, 'emerald-ape-042', 2)
    await logout(page)

    await addFromDetail(page, 'emerald-ape-042', 3)
    await addFromDetail(page, 'golden-beat-207', 1)
    await login(page, ANA)

    await expect(page.getByRole('status').filter({ hasText: 'combinados com o carrinho da sua conta' })).toBeVisible()
    await page.goto('/carrinho')
    await expect(cartLine(page, 'Emerald Ape #042').getByRole('status', { name: 'Quantidade selecionada' })).toHaveText('3')
    await expect(cartLine(page, 'Golden Beat #207')).toBeVisible()
    await expect(cartBadge(page)).toHaveText('4')
  })

  test('isola os carrinhos de usuários diferentes', async ({ page }) => {
    await login(page, ANA)
    await addFromDetail(page, 'emerald-ape-042')
    await logout(page)
    await expect(cartBadge(page)).toHaveCount(0)

    await login(page, BRUNO)
    await page.goto('/carrinho')
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio.' })).toBeVisible()
    await addFromDetail(page, 'golden-beat-207')
    await logout(page)

    await login(page, ANA)
    await page.goto('/carrinho')
    await expect(cartLine(page, 'Emerald Ape #042')).toBeVisible()
    await expect(cartLine(page, 'Golden Beat #207')).toHaveCount(0)
  })

  test('aplica nft.updated no carrinho, avisa e exige nova cotação', async ({ page }) => {
    await login(page, ANA)
    const socketConnected = page.waitForEvent('console', (message) => SOCKET_IO_CONNECT_FRAME.test(message.text()))
    await addFromDetail(page, 'emerald-ape-042', 2)
    await socketConnected
    await expect(page.getByTestId('quote-total')).toHaveText('2.392 ETH')
    await expect(page.getByRole('link', { name: 'Conectar e finalizar' })).toHaveAttribute('href', '/pagamento')

    await triggerMarketChange(page, 'emerald-ape-042')
    const line = cartLine(page, 'Emerald Ape #042')
    await expect(line.getByTestId('cart-unit-price')).toHaveText('1.26 ETH')
    await expect(line.getByTestId('cart-line-total')).toHaveText('2.52 ETH')
    await expect(page.getByTestId('quote-total')).toHaveText('2.532 ETH')
    await expect(page.getByTestId('cart-change-notices')).toContainText(
      'Emerald Ape #042 (1/50): preço alterado de 1.19 ETH para 1.26 ETH.',
    )

    await triggerMarketChange(page, 'emerald-ape-042')
    await expect(line).toContainText('Edição esgotada. Remova o item para continuar.')
    await expect(page.getByTestId('cart-change-notices')).toContainText('Emerald Ape #042 (1/50): edição esgotada.')
    await expect(page.getByTestId('quote-subtotal')).toHaveText('0.00 ETH')
    await expect(page.getByTestId('checkout-readiness')).toHaveText('Ajuste os itens indisponíveis antes de continuar.')
  })

  test('oferece ajuste quando o estoque fica abaixo da quantidade', async ({ page }) => {
    const socketConnected = page.waitForEvent('console', (message) => SOCKET_IO_CONNECT_FRAME.test(message.text()))
    await addFromDetail(page, 'emerald-ape-042', 3)
    await socketConnected

    await triggerMarketChange(page, 'emerald-ape-042')
    const line = cartLine(page, 'Emerald Ape #042')
    await expect(line).toContainText('Restam 2 disponíveis nesta edição.')

    await line.getByRole('button', { name: 'Ajustar para 2' }).click()
    await expect(line.getByRole('status', { name: 'Quantidade selecionada' })).toHaveText('2')
    await expect(line).not.toContainText('Restam')
    await expect(line.getByTestId('cart-line-total')).toHaveText('2.52 ETH')
  })

  test('recupera falhas ao carregar e desfaz a alteração otimista rejeitada', async ({ page }) => {
    await addFromDetail(page, 'golden-signal-160')

    await page.addInitScript(() => {
      const failingRequestCount = 3
      let cartReadCount = 0
      window.__KURIO_NETWORK_CONDITIONS__ = (request) => {
        const { pathname } = new URL(request.url)
        if (request.method === 'PATCH' && pathname.startsWith('/api/cart/items/')) return { status: 500 }
        if (request.method !== 'GET' || pathname !== '/api/cart') return undefined
        cartReadCount += 1
        return cartReadCount <= failingRequestCount ? { status: 503 } : undefined
      }
    })
    await page.reload()

    await expect(page.getByRole('heading', { name: 'Não foi possível carregar o carrinho.' })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: 'Tentar novamente' }).click()

    const line = cartLine(page, 'Golden Signal #160')
    const quantity = line.getByRole('status', { name: 'Quantidade selecionada' })
    await expect(quantity).toHaveText('1')
    await line.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(line.getByRole('alert')).toHaveText('Falha simulada (HTTP 500).')
    await expect(quantity).toHaveText('1')
  })
})

test.describe('carrinho no mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'Layout mobile.')

  test('adiciona pela barra de compra e edita no carrinho', async ({ page }) => {
    await page.goto('/nfts/golden-signal-160')
    const buyBar = page.getByRole('region', { name: 'Compra' })
    await buyBar.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
    await expect(buyBar.getByRole('status').filter({ hasText: '1 unidade adicionada ao carrinho.' })).toBeVisible()

    await page.goto('/carrinho')
    await expect(page.getByRole('heading', { level: 1, name: 'Carrinho de NFTs' })).toBeVisible()
    const line = cartLine(page, 'Golden Signal #160')
    await line.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(line.getByTestId('cart-line-total')).toHaveText('0.78 ETH')
    await expect(page.getByTestId('quote-total')).toHaveText('0.784 ETH')
  })
})
