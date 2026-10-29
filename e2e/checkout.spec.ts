import { expect, test, type Page } from '@playwright/test'

const ANA = { email: 'ana@kurio.dev', password: 'kurio-ana-2026' }
const BRUNO = { email: 'bruno@kurio.dev', password: 'kurio-bruno-2026' }
const SESSION_TOKEN_KEY = 'kurio.session-token'
const SOCKET_IO_CONNECT_FRAME = /⬆.*\b40\b/
const ORDER_UPDATED_FRAME = /⬇.*42\["order\.updated"/

// Emerald Ape #042: 1.19 ETH on Ethereum (fee 0.012 ETH), default edition 1/50.
const NFT_ID = 'emerald-ape-042'
const EDITION = 'one-of-fifty'

type MockScenario = {
  walletConnection?: 'approve' | 'reject'
  payment?: 'confirm' | 'reject' | 'manual'
  settlementDelayMs?: number
}

function collectConsoleMessages(page: Page) {
  const messages: string[] = []
  page.on('console', (message) => messages.push(message.text()))
  return messages
}

function waitForSocketConnection(page: Page) {
  return page.waitForEvent('console', (message) => SOCKET_IO_CONNECT_FRAME.test(message.text()))
}

async function submitLogin(page: Page, credentials: { email: string; password: string }) {
  await page.getByRole('textbox', { name: 'E-mail' }).fill(credentials.email)
  await page.getByLabel('Senha', { exact: true }).fill(credentials.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

async function login(page: Page, credentials: { email: string; password: string }) {
  await page.goto('/entrar')
  await submitLogin(page, credentials)
  await expect(page).toHaveURL(/\/$/)
}

async function logout(page: Page) {
  await page.getByRole('button', { name: 'Sair' }).first().click()
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
}

async function addFromDetail(page: Page, nftId: string, quantity = 1) {
  await page.goto(`/nfts/${nftId}`)
  const increase = page.getByRole('button', { name: 'Aumentar quantidade' })
  for (let step = 1; step < quantity; step += 1) await increase.click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
}

// Mock control endpoints (scenario, settlement, outages) are not part of the product API.
async function postMockControl(page: Page, path: string, body?: unknown, method = 'POST') {
  const status = await page.evaluate(
    async ({ url, payload, httpMethod }) => {
      const response = await fetch(url, {
        method: httpMethod,
        headers: { 'Content-Type': 'application/json' },
        body: payload === undefined ? undefined : JSON.stringify(payload),
      })
      return response.status
    },
    { url: `/api/__mocks__/${path}`, payload: body, httpMethod: method },
  )
  expect(status).toBeLessThan(300)
}

function setScenario(page: Page, scenario: MockScenario) {
  return postMockControl(page, 'scenario', scenario, 'PUT')
}

function settleOrder(page: Page, orderId: string, outcome: 'confirmed' | 'rejected') {
  return postMockControl(page, `orders/${orderId}/settle`, { outcome })
}

// Product API read as the signed-in user, to check server state (orders, stock).
async function apiGet<Body>(page: Page, path: string): Promise<Body> {
  return page.evaluate(
    async ({ url, tokenKey }) => {
      const token = localStorage.getItem(tokenKey)
      const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      return response.json()
    },
    { url: `/api${path}`, tokenKey: SESSION_TOKEN_KEY },
  )
}

async function editionStock(page: Page, nftId = NFT_ID, tier = EDITION) {
  const nft = await apiGet<{ editions: { tier: string; availableQuantity: number }[] }>(page, `/nfts/${nftId}`)
  return nft.editions.find((edition) => edition.tier === tier)?.availableQuantity
}

async function listOrders(page: Page) {
  const { orders } = await apiGet<{ orders: { id: string; status: string }[] }>(page, '/orders')
  return orders
}

function orderIdFromUrl(page: Page) {
  return new URL(page.url()).pathname.split('/').pop() ?? ''
}

async function connectWallet(page: Page) {
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByTestId('wallet-connected')).toBeVisible()
}

async function goToReview(page: Page) {
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByRole('heading', { name: '3. Revisão do pedido' })).toBeFocused()
}

async function openCheckoutAndReview(page: Page) {
  await page.goto('/pagamento')
  await expect(page.getByRole('heading', { level: 1, name: 'Pagamento' })).toBeVisible()
  await connectWallet(page)
  await goToReview(page)
}

function orderStatus(page: Page) {
  return page.getByTestId('order-status')
}

test.describe('checkout no desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Layout desktop.')

  test('compra completa do carrinho ao recibo confirmado via order.updated', async ({ page }) => {
    const consoleMessages = collectConsoleMessages(page)
    await login(page, ANA)
    await setScenario(page, { payment: 'confirm', settlementDelayMs: 1500 })
    await addFromDetail(page, NFT_ID)
    const stockBefore = await editionStock(page)

    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL(/\/pagamento$/)
    await expect(page.getByRole('textbox', { name: 'Nome completo' })).toHaveValue('Ana Ribeiro')
    await expect(page.getByTestId('checkout-total')).toHaveText('1.202 ETH')

    // Required fields are validated before the review.
    await page.getByRole('textbox', { name: 'Nome completo' }).fill('Ana')
    await page.getByRole('button', { name: 'Revisar pedido' }).click()
    await expect(page.getByText('Informe nome e sobrenome.')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Nome completo' })).toBeFocused()
    await page.getByRole('textbox', { name: 'Nome completo' }).fill('Ana Ribeiro')

    await connectWallet(page)
    await goToReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(page).toHaveURL(/\/pedidos\/[\w-]+$/)
    await expect(orderStatus(page)).toContainText('Pedido pendente')
    await expect(orderStatus(page)).toContainText('Pedido confirmado', { timeout: 10_000 })
    await expect(page.getByTestId('order-transaction-hash')).toHaveText(/^0x[0-9a-f]{64}$/)
    await expect(page.getByTestId('order-total')).toHaveText('1.202 ETH')
    expect(consoleMessages.filter((message) => ORDER_UPDATED_FRAME.test(message))).toHaveLength(1)

    // Stock left the catalog exactly once and the purchased line left the cart.
    expect(await editionStock(page)).toBe((stockBefore ?? 0) - 1)
    await expect(page.getByTestId('cart-badge')).toHaveCount(0)

    // The receipt is a snapshot: later catalog changes do not alter it.
    await postMockControl(page, `nfts/${NFT_ID}/market-change`)
    await page.reload()
    await expect(orderStatus(page)).toContainText('Pedido confirmado')
    await expect(page.getByTestId('order-line')).toContainText('1 × 1.19 ETH')
    await expect(page.getByTestId('order-total')).toHaveText('1.202 ETH')

    await page.goto('/carrinho')
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio.' })).toBeVisible()
  })

  test('exige aceitar explicitamente o novo preço recebido via Socket.IO', async ({ page }) => {
    const socketConnected = waitForSocketConnection(page)
    await login(page, ANA)
    await socketConnected
    await setScenario(page, { payment: 'manual' })
    await addFromDetail(page, NFT_ID)
    await openCheckoutAndReview(page)
    await expect(page.getByTestId('checkout-total')).toHaveText('1.202 ETH')

    await postMockControl(page, `nfts/${NFT_ID}/market-change`)
    const changes = page.getByTestId('quote-changes')
    await expect(changes).toContainText('Emerald Ape #042 (1/50): preço de 1.19 ETH para 1.26 ETH.')
    await expect(changes).toContainText('Total: 1.202 ETH → 1.272 ETH.')
    const confirm = page.getByRole('button', { name: 'Confirmar compra' })
    await expect(confirm).toBeDisabled()
    await expect(page.getByTestId('checkout-block-reason')).toHaveText('Aceite os novos valores para continuar.')
    // The summary keeps the accepted values until the buyer accepts the new ones.
    await expect(page.getByTestId('checkout-total')).toHaveText('1.202 ETH')

    await page.getByRole('button', { name: 'Aceitar novos valores' }).click()
    await expect(changes).toHaveCount(0)
    await expect(page.getByTestId('checkout-total')).toHaveText('1.272 ETH')
    await confirm.click()

    await expect(page).toHaveURL(/\/pedidos\//)
    await expect(page.getByTestId('order-total')).toHaveText('1.272 ETH')
  })

  test('a API recusa uma cotação que mudou durante o envio e exige nova confirmação', async ({ page }) => {
    await login(page, ANA)
    await setScenario(page, { payment: 'manual' })
    await addFromDetail(page, NFT_ID)
    await page.addInitScript(() => {
      window.__KURIO_NETWORK_CONDITIONS__ = (request) =>
        request.method === 'POST' && new URL(request.url).pathname === '/api/orders' ? { delayMs: 1500 } : undefined
    })
    await openCheckoutAndReview(page)

    const orderResponse = page.waitForResponse(
      (response) => response.url().endsWith('/api/orders') && response.request().method() === 'POST',
    )
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    // The price changes on the server while the order request is in flight.
    await postMockControl(page, `nfts/${NFT_ID}/market-change`)
    expect((await orderResponse).status()).toBe(409)

    await expect(page.getByTestId('place-order-error')).toContainText('Os valores do pedido mudaram.')
    await expect(page.getByTestId('quote-changes')).toContainText('preço de 1.19 ETH para 1.26 ETH')
    expect(await listOrders(page)).toHaveLength(0)

    await page.getByRole('button', { name: 'Aceitar novos valores' }).click()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page).toHaveURL(/\/pedidos\//)
    await expect(page.getByTestId('order-total')).toHaveText('1.272 ETH')
  })

  test('simula recusa, aprovação e desconexão da carteira', async ({ page }) => {
    await login(page, ANA)
    await setScenario(page, { walletConnection: 'reject' })
    await addFromDetail(page, NFT_ID)
    await page.goto('/pagamento')

    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'A conexão foi recusada na carteira.' })).toBeVisible()
    await expect(page.getByTestId('wallet-connected')).toHaveCount(0)

    await setScenario(page, { walletConnection: 'approve' })
    await page.getByText('Carteira de coleção').click()
    await connectWallet(page)
    await expect(page.getByTestId('wallet-connected')).toContainText('Carteira de coleção')
    await expect(page.getByTestId('wallet-connected')).toContainText('Rede: Polygon')

    await page.getByRole('button', { name: 'Desconectar' }).click()
    await expect(page.getByTestId('wallet-connected')).toHaveCount(0)
    await page.getByRole('button', { name: 'Revisar pedido' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Conecte uma carteira para continuar.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Conectar carteira' })).toBeFocused()
  })

  test('pagamento recusado preserva o carrinho e devolve o estoque', async ({ page }) => {
    await login(page, ANA)
    await setScenario(page, { payment: 'reject', settlementDelayMs: 500 })
    await addFromDetail(page, NFT_ID, 2)
    const stockBefore = await editionStock(page)

    await openCheckoutAndReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(orderStatus(page)).toContainText('Pagamento recusado', { timeout: 10_000 })
    await expect(orderStatus(page)).toContainText('Nenhum valor foi cobrado')
    await expect(page.getByTestId('order-transaction-hash')).toHaveCount(0)
    expect(await editionStock(page)).toBe(stockBefore)
    expect((await listOrders(page)).map((order) => order.status)).toEqual(['rejected'])

    await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
    const line = page.getByTestId('cart-line').filter({ hasText: 'Emerald Ape #042' })
    await expect(line.getByRole('status', { name: 'Quantidade selecionada' })).toHaveText('2')
  })

  test('recupera o mesmo pedido após timeout, sem duplicar pedido nem estoque', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page, ANA)
    await setScenario(page, { payment: 'manual' })
    await addFromDetail(page, NFT_ID)
    const stockBefore = await editionStock(page)

    // The first creation is committed by the API, but its response only arrives after the
    // client timeout (10 s).
    await page.addInitScript(() => {
      let orderCreationCount = 0
      window.__KURIO_NETWORK_CONDITIONS__ = (request) => {
        if (request.method !== 'POST' || new URL(request.url).pathname !== '/api/orders') return undefined
        orderCreationCount += 1
        return orderCreationCount === 1 ? { delayAfterCommitMs: 20_000 } : undefined
      }
    })
    await openCheckoutAndReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    const error = page.getByTestId('place-order-error')
    await expect(error).toContainText('Não recebemos a resposta do pedido a tempo.', { timeout: 15_000 })
    expect(await listOrders(page)).toHaveLength(1)

    const retryResponse = page.waitForResponse(
      (response) => response.url().endsWith('/api/orders') && response.request().method() === 'POST',
    )
    await error.getByRole('button', { name: 'Tentar novamente' }).click()
    expect((await retryResponse).status()).toBe(200)
    await expect(page).toHaveURL(/\/pedidos\//)
    await expect(orderStatus(page)).toContainText('Pedido pendente')

    const orders = await listOrders(page)
    expect(orders).toHaveLength(1)
    expect(orders[0]?.id).toBe(orderIdFromUrl(page))
    expect(await editionStock(page)).toBe((stockBefore ?? 0) - 1)

    await settleOrder(page, orderIdFromUrl(page), 'confirmed')
    await expect(orderStatus(page)).toContainText('Pedido confirmado')
  })

  test('cliques repetidos e reenvios com a mesma chave criam um único pedido', async ({ page }) => {
    await login(page, ANA)
    await setScenario(page, { payment: 'manual' })
    await addFromDetail(page, NFT_ID)
    const stockBefore = await editionStock(page)
    await openCheckoutAndReview(page)

    let orderRequests = 0
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().endsWith('/api/orders')) orderRequests += 1
    })
    await page.getByRole('button', { name: 'Confirmar compra' }).dblclick()
    await expect(page).toHaveURL(/\/pedidos\//)
    expect(orderRequests).toBe(1)
    expect(await listOrders(page)).toHaveLength(1)
    expect(await editionStock(page)).toBe((stockBefore ?? 0) - 1)

    // While an order is pending, a new attempt (new key) is refused instead of buying twice.
    await page.goto('/pagamento')
    await expect(page.getByTestId('pending-order-notice')).toBeVisible()
  })

  test('a API devolve o mesmo pedido para a mesma chave e recusa a chave com outro conteúdo', async ({ page }) => {
    await login(page, ANA)
    await setScenario(page, { payment: 'manual' })
    await addFromDetail(page, NFT_ID)
    const stockBefore = await editionStock(page)
    await page.goto('/pagamento')
    await connectWallet(page)

    const result = await page.evaluate(async (tokenKey) => {
      const headers = { Authorization: `Bearer ${localStorage.getItem(tokenKey)}`, 'Content-Type': 'application/json' }
      const { connection } = await (await fetch('/api/me/wallet-connection', { headers })).json()
      const quote = await (await fetch('/api/cart/quote', { method: 'POST', headers })).json()
      const body = {
        buyer: { fullName: 'Ana Ribeiro', email: 'ana@kurio.dev' },
        walletConnectionId: connection.id,
        expectedQuote: {
          couponCode: null,
          lines: quote.lines.map(({ itemId, quantity, unitPriceEth }: Record<string, unknown>) => ({ itemId, quantity, unitPriceEth })),
          subtotalEth: quote.subtotalEth,
          discountEth: quote.discountEth,
          networkFeeEth: quote.networkFeeEth,
          totalEth: quote.totalEth,
        },
      }
      const send = (payload: unknown) =>
        fetch('/api/orders', {
          method: 'POST',
          headers: { ...headers, 'Idempotency-Key': 'e2e-same-attempt-key' },
          body: JSON.stringify(payload),
        })

      const responses = await Promise.all([send(body), send(body)])
      const orders = await Promise.all(responses.map((response) => response.json()))
      const conflict = await send({ ...body, buyer: { ...body.buyer, fullName: 'Ana Outra Pessoa' } })
      return {
        statuses: responses.map((response) => response.status).sort(),
        orderIds: orders.map((order: { id: string }) => order.id),
        conflictStatus: conflict.status,
        conflictCode: (await conflict.json()).error.code,
      }
    }, SESSION_TOKEN_KEY)

    expect(result.statuses).toEqual([200, 201])
    expect(result.orderIds[0]).toBe(result.orderIds[1])
    expect(result.conflictStatus).toBe(409)
    expect(result.conflictCode).toBe('IDEMPOTENCY_KEY_REUSED')
    expect(await listOrders(page)).toHaveLength(1)
    expect(await editionStock(page)).toBe((stockBefore ?? 0) - 1)
  })

  test('recupera o pedido pendente após refresh e após reconexão do socket', async ({ page }) => {
    const consoleMessages = collectConsoleMessages(page)
    await login(page, ANA)
    await setScenario(page, { payment: 'manual' })
    await addFromDetail(page, NFT_ID)
    await openCheckoutAndReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page).toHaveURL(/\/pedidos\//)
    const orderId = orderIdFromUrl(page)

    const socketConnected = waitForSocketConnection(page)
    await page.reload()
    await socketConnected
    await expect(orderStatus(page)).toContainText('Pedido pendente')

    // Server outage: the confirmation event is emitted while nobody is connected.
    await postMockControl(page, 'realtime/interrupt')
    await expect(page.getByTestId('order-realtime-offline')).toBeVisible()
    await settleOrder(page, orderId, 'confirmed')
    await expect(orderStatus(page)).toContainText('Pedido pendente')

    // After reconnecting, the client re-reads the order from REST.
    const orderRefetch = page.waitForResponse((response) => response.url().endsWith(`/api/orders/${orderId}`))
    await postMockControl(page, 'realtime/resume')
    await orderRefetch
    await expect(orderStatus(page)).toContainText('Pedido confirmado', { timeout: 15_000 })
    expect(consoleMessages.filter((message) => ORDER_UPDATED_FRAME.test(message))).toHaveLength(0)

    // Terminal states are final and survive a refresh.
    await page.reload()
    await expect(orderStatus(page)).toContainText('Pedido confirmado')
    expect(await listOrders(page)).toHaveLength(1)
  })

  test('isola pedidos, carteiras e eventos entre Ana e Bruno', async ({ page }) => {
    await login(page, ANA)
    await setScenario(page, { payment: 'manual' })
    await addFromDetail(page, NFT_ID)
    await openCheckoutAndReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page).toHaveURL(/\/pedidos\//)
    const anaOrderUrl = new URL(page.url()).pathname
    const anaOrderId = orderIdFromUrl(page)
    await logout(page)

    const socketConnected = waitForSocketConnection(page)
    await login(page, BRUNO)
    await socketConnected
    await page.goto(anaOrderUrl)
    await expect(page.getByRole('heading', { name: 'Pedido não encontrado' })).toBeVisible()
    expect(await listOrders(page)).toEqual([])

    // Ana's order settles while Bruno is connected: the private event never reaches him.
    const brunoMessages = collectConsoleMessages(page)
    await settleOrder(page, anaOrderId, 'confirmed')
    await page.waitForTimeout(500)
    expect(brunoMessages.filter((message) => ORDER_UPDATED_FRAME.test(message))).toHaveLength(0)

    await page.goto('/pagamento')
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio.' })).toBeVisible()
    await addFromDetail(page, 'golden-beat-207')
    await page.goto('/pagamento')
    await expect(page.getByText('Carteira principal')).toBeVisible()
    await expect(page.getByText('Carteira de coleção')).toHaveCount(0)
    await expect(page.getByTestId('checkout-line')).toHaveCount(1)
    await expect(page.getByTestId('checkout-line')).toContainText('Golden Beat #207')
    await logout(page)

    await login(page, ANA)
    await page.goto(anaOrderUrl)
    await expect(orderStatus(page)).toContainText('Pedido confirmado')
  })
})

test.describe('checkout no mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'Layout mobile.')

  test('exige login, preserva o carrinho e conclui a compra', async ({ page }) => {
    await page.goto('/nfts/golden-signal-160')
    const buyBar = page.getByRole('region', { name: 'Compra' })
    await buyBar.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
    await expect(buyBar.getByRole('status').filter({ hasText: '1 unidade adicionada ao carrinho.' })).toBeVisible()

    await page.goto('/pagamento')
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento$/)
    await submitLogin(page, ANA)
    await expect(page).toHaveURL(/\/pagamento$/)
    await setScenario(page, { payment: 'confirm', settlementDelayMs: 500 })

    await expect(page.getByTestId('checkout-line')).toContainText('Golden Signal #160')
    await expect(page.getByTestId('checkout-total')).toHaveText('0.394 ETH')
    await connectWallet(page)
    await goToReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(orderStatus(page)).toContainText('Pedido confirmado', { timeout: 10_000 })
    await expect(page.getByTestId('order-total')).toHaveText('0.394 ETH')
  })
})
