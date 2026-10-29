import { expect, test, type Page } from '@playwright/test'

const ANA = { email: 'ana@kurio.dev', password: 'kurio-ana-2026', displayName: 'Ana Ribeiro' }
const BRUNO = { email: 'bruno@kurio.dev', password: 'kurio-bruno-2026', displayName: 'Bruno Tavares' }
const SESSION_TOKEN_KEY = 'kurio.session-token'
// 1×1 transparent PNG.
const PNG_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)
const NEW_WALLET_ADDRESS = '0xAbCdEf0123456789aBcDeF0123456789AbCdEf01'

type Credentials = { email: string; password: string }

// Fills the login form (desktop dialog or mobile page) once it is ready to receive input.
async function submitLogin(page: Page, credentials: Credentials) {
  const form = page.getByRole('form', { name: 'Entrar' })
  const email = form.getByRole('textbox', { name: 'E-mail' })
  await expect(async () => {
    await email.fill(credentials.email)
    await expect(email).toHaveValue(credentials.email, { timeout: 500 })
  }).toPass()
  await form.getByLabel('Senha', { exact: true }).fill(credentials.password)
  await form.getByRole('button', { name: 'Entrar', exact: true }).click()
}

async function login(page: Page, credentials: Credentials) {
  await page.goto('/entrar')
  await submitLogin(page, credentials)
  await expect(page).toHaveURL(/\/$/)
}

async function logout(page: Page) {
  await page.getByRole('button', { name: 'Sair' }).first().click()
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
}

function profileLink(page: Page, displayName: string) {
  return page.getByRole('link', { name: `Perfil de ${displayName}` })
}

async function postMockControl(page: Page, path: string, body?: unknown, method = 'POST') {
  const status = await page.evaluate(
    async ({ url, payload, httpMethod }) =>
      (
        await fetch(url, {
          method: httpMethod,
          headers: { 'Content-Type': 'application/json' },
          body: payload === undefined ? undefined : JSON.stringify(payload),
        })
      ).status,
    { url: `/api/__mocks__/${path}`, payload: body, httpMethod: method },
  )
  expect(status).toBeLessThan(300)
}

async function apiRequest(page: Page, path: string, init: { method?: string; body?: unknown } = {}) {
  return page.evaluate(
    async ({ url, tokenKey, method, body }) => {
      const token = localStorage.getItem(tokenKey)
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      return { status: response.status, body: response.status === 204 ? null : await response.json() }
    },
    { url: `/api${path}`, tokenKey: SESSION_TOKEN_KEY, method: init.method ?? 'GET', body: init.body },
  )
}

async function buyFirstAvailable(page: Page, nftId: string) {
  await page.goto(`/nfts/${nftId}`)
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  await page.goto('/pagamento')
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByTestId('wallet-connected')).toBeVisible()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/pedidos\//)
}

test.describe('perfil no desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Layout desktop.')

  test('edita o perfil, valida conflitos, atualiza o cabeçalho e persiste após F5', async ({ page }) => {
    await login(page, ANA)
    await page.goto('/perfil')
    const displayName = page.getByRole('textbox', { name: 'Nome de exibição' })
    const username = page.getByRole('textbox', { name: 'Nome de usuário' })
    const email = page.locator('#profile-email')
    const save = page.getByRole('button', { name: 'Salvar perfil' })
    await expect(displayName).toHaveValue(ANA.displayName)

    await displayName.fill('')
    await save.click()
    await expect(page.getByText('Informe seu nome de exibição.')).toBeVisible()
    await expect(displayName).toBeFocused()

    // Conflicts come from the API and are attached to the fields.
    await displayName.fill('Ana R. Colecionadora')
    await username.fill('bruno.criador')
    await save.click()
    await expect(page.getByText('Este nome de usuário já está em uso.')).toBeVisible()
    await expect(username).toHaveAttribute('aria-invalid', 'true')
    await username.fill('ana.r')
    await email.fill(BRUNO.email)
    await save.click()
    await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()

    await email.fill('ana.nova@kurio.dev')
    await save.click()
    await expect(page.getByRole('status').filter({ hasText: 'Perfil atualizado.' })).toBeVisible()
    await expect(profileLink(page, 'Ana R. Colecionadora')).toBeVisible()
    await expect(page.getByTestId('account-details')).toContainText('ana.nova@kurio.dev')

    await page.reload()
    await expect(page.getByTestId('account-details')).toContainText('@ana.r')
    await expect(displayName).toHaveValue('Ana R. Colecionadora')
    await expect(profileLink(page, 'Ana R. Colecionadora')).toBeVisible()

    // The new e-mail is the login from now on.
    await logout(page)
    await login(page, { email: 'ana.nova@kurio.dev', password: ANA.password })
    await expect(profileLink(page, 'Ana R. Colecionadora')).toBeVisible()
  })

  test('sessão expirada ao salvar leva ao login e retorna ao perfil', async ({ page }) => {
    await login(page, ANA)
    await page.goto('/perfil')
    await expect(page.getByRole('textbox', { name: 'Nome de exibição' })).toHaveValue(ANA.displayName)
    await page.waitForLoadState('networkidle')
    const status = await page.evaluate(async (tokenKey) => {
      const response = await fetch('/api/__mocks__/auth/expire-session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey)}` },
      })
      return response.status
    }, SESSION_TOKEN_KEY)
    expect(status).toBe(202)

    await page.getByRole('textbox', { name: 'Nome de exibição' }).fill('Nome Que Não Salva')
    await page.getByRole('button', { name: 'Salvar perfil' }).click()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil&reason=session-expired$/)
    await expect(page.getByRole('dialog')).toBeVisible()
    await submitLogin(page, ANA)
    await expect(page).toHaveURL(/\/perfil$/)
    await expect(page.getByTestId('account-details')).toContainText(ANA.displayName)
  })

  test('atualiza o avatar com pré-visualização e valida o arquivo no cliente e na API', async ({ page }) => {
    await login(page, ANA)
    await page.goto('/perfil')
    const fileInput = page.locator('input[type="file"]')
    const avatarSection = page.getByRole('region', { name: 'Avatar' })
    await expect(page.getByRole('img', { name: 'Avatar de Ana Ribeiro (iniciais)' })).toHaveCount(2)

    await fileInput.setInputFiles({ name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('texto') })
    await expect(avatarSection.getByRole('alert')).toHaveText('Use uma imagem PNG, JPEG ou WebP.')

    await fileInput.setInputFiles({ name: 'grande.png', mimeType: 'image/png', buffer: Buffer.alloc(600 * 1024, 1) })
    await expect(avatarSection.getByRole('alert')).toHaveText('A imagem deve ter no máximo 512 KB.')

    // Declared as PNG but not a PNG: only the API, which checks the content, can tell.
    await fileInput.setInputFiles({ name: 'falso.png', mimeType: 'image/png', buffer: Buffer.from('não sou uma imagem') })
    await page.getByRole('button', { name: 'Salvar avatar' }).click()
    await expect(avatarSection.getByRole('alert')).toHaveText('O conteúdo do arquivo não é uma imagem válida.')

    await fileInput.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG_PIXEL })
    await expect(page.getByRole('img', { name: 'Pré-visualização do novo avatar' })).toBeVisible()
    await expect(avatarSection).toContainText('Arquivo selecionado: avatar.png.')
    await page.getByRole('button', { name: 'Salvar avatar' }).click()
    await expect(avatarSection.getByRole('status')).toHaveText('Avatar atualizado.')

    const savedAvatar = page.getByTestId('account-details').locator('..').getByRole('img', { name: 'Avatar de Ana Ribeiro', exact: true })
    await expect(savedAvatar).toHaveAttribute('src', /^data:image\/png;base64,/)
    await page.reload()
    await expect(savedAvatar).toHaveAttribute('src', /^data:image\/png;base64,/)

    await page.getByRole('button', { name: 'Remover avatar' }).click()
    await expect(avatarSection.getByRole('status')).toHaveText('Avatar removido.')
    await expect(page.getByRole('img', { name: 'Avatar de Ana Ribeiro (iniciais)' })).toHaveCount(2)
  })

  test('altera a senha, recusa a senha atual incorreta e só aceita a nova no login', async ({ page }) => {
    await login(page, ANA)
    await page.goto('/perfil')
    const current = page.getByLabel('Senha atual')
    const next = page.getByLabel('Nova senha', { exact: true })
    const confirmation = page.getByLabel('Confirmar nova senha')
    const submit = page.getByRole('button', { name: 'Alterar senha' })

    await current.fill(ANA.password)
    await next.fill('nova-senha-2026')
    await confirmation.fill('outra-senha-2026')
    await submit.click()
    await expect(page.getByText('As senhas não conferem.')).toBeVisible()

    await current.fill('senha-errada-1')
    await confirmation.fill('nova-senha-2026')
    await submit.click()
    await expect(page.getByText('A senha atual está incorreta.')).toBeVisible()
    await expect(current).toBeFocused()

    await current.fill(ANA.password)
    await submit.click()
    await expect(page.getByRole('status').filter({ hasText: 'Senha alterada.' })).toBeVisible()
    await expect(current).toHaveValue('')

    await logout(page)
    await page.goto('/entrar')
    await submitLogin(page, ANA)
    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
    await login(page, { email: ANA.email, password: 'nova-senha-2026' })
    await expect(profileLink(page, ANA.displayName)).toBeVisible()
  })

  test('cadastra, edita e seleciona carteiras e usa a principal no checkout', async ({ page }) => {
    await login(page, BRUNO)
    await postMockControl(page, 'scenario', { payment: 'manual' }, 'PUT')
    await page.goto('/perfil/carteiras')
    const cards = page.getByTestId('wallet-card')
    await expect(cards).toHaveCount(1)

    await page.getByRole('button', { name: 'Adicionar carteira' }).click()
    const form = page.getByRole('form', { name: 'Nova carteira' })
    await form.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(form.getByText('Dê um nome à carteira.')).toBeVisible()
    await expect(form.getByText('Selecione ao menos uma rede.')).toBeVisible()

    await form.getByRole('textbox', { name: 'Nome da carteira' }).fill('Carteira Polygon')
    await form.getByRole('textbox', { name: 'Endereço (0x…)' }).fill('0x123')
    await form.getByRole('checkbox', { name: 'Polygon' }).check()
    await form.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(form.getByText('Use um endereço 0x com 40 caracteres hexadecimais.')).toBeVisible()

    // Same address as Bruno's primary wallet (case-insensitive): conflict from the API.
    await form.getByRole('textbox', { name: 'Endereço (0x…)' }).fill('0x51de0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f')
    await form.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(form.getByText('Este endereço já está cadastrado em outra carteira sua.')).toBeVisible()

    await form.getByRole('textbox', { name: 'Endereço (0x…)' }).fill(NEW_WALLET_ADDRESS)
    await form.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Carteira cadastrada.' })).toBeVisible()
    await expect(cards).toHaveCount(2)
    await expect(page.getByRole('button', { name: 'Adicionar carteira' })).toHaveCount(0)
    await expect(page.getByText('Limite atingido: uma carteira principal e uma secundária.')).toBeVisible()

    await page.getByRole('button', { name: 'Editar Carteira Polygon' }).click()
    const editForm = page.getByRole('form', { name: 'Editar Carteira Polygon' })
    await editForm.getByRole('textbox', { name: 'Nome da carteira' }).fill('Polygon do Bruno')
    await editForm.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Carteira atualizada.' })).toBeVisible()

    await page.getByRole('button', { name: 'Tornar Polygon do Bruno a carteira principal' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Polygon do Bruno agora é a carteira principal.' })).toBeVisible()
    // Only one primary: the previous one became secondary.
    await page.reload()
    await expect(cards.first()).toContainText('Polygon do Bruno')
    await expect(cards.first()).toContainText('Principal')
    await expect(cards.nth(1)).toContainText('Carteira principal')
    await expect(cards.nth(1)).toContainText('Secundária')

    // The checkout lists the registered wallets with the primary preselected.
    await buyFirstAvailable(page, 'golden-beat-207')
    await expect(page.getByText('Polygon do Bruno · 0xAbCd…Ef01')).toBeVisible()
    const orderId = new URL(page.url()).pathname.split('/').pop() ?? ''

    // The wallet paying the pending order cannot be edited (UI and API).
    await page.goto('/perfil/carteiras')
    await expect(cards.first()).toContainText('Em uso por um pedido pendente')
    await expect(page.getByRole('button', { name: 'Editar Polygon do Bruno' })).toBeDisabled()
    const walletId = (await apiRequest(page, '/me/wallets')).body.wallets[0].id
    const blocked = await apiRequest(page, `/me/wallets/${walletId}`, {
      method: 'PATCH',
      body: { label: 'Mudança indevida', address: NEW_WALLET_ADDRESS, networks: ['polygon'] },
    })
    expect(blocked.status).toBe(409)
    expect(blocked.body.error.code).toBe('WALLET_IN_USE')

    await postMockControl(page, `orders/${orderId}/settle`, { outcome: 'confirmed' })
    await page.reload()
    await expect(page.getByRole('button', { name: 'Editar Polygon do Bruno' })).toBeEnabled()
    await expect(cards.first()).not.toContainText('Em uso por um pedido pendente')
  })

  test('mostra o histórico de pedidos com estados, recibos e nova tentativa após falha', async ({ page }) => {
    await login(page, ANA)
    await page.goto('/perfil/pedidos')
    await expect(page.getByText('Você ainda não fez pedidos.')).toBeVisible()

    await postMockControl(page, 'scenario', { payment: 'reject', settlementDelayMs: 300 }, 'PUT')
    await buyFirstAvailable(page, 'golden-signal-160')
    await expect(page.getByTestId('order-status')).toContainText('Pagamento recusado')
    await postMockControl(page, 'scenario', { payment: 'confirm', settlementDelayMs: 300 }, 'PUT')
    await page.goto('/pagamento')
    await expect(page.getByTestId('wallet-connected')).toBeVisible()
    await page.getByRole('button', { name: 'Revisar pedido' }).click()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByTestId('order-status')).toContainText('Pedido confirmado')
    const confirmedNumber = (await page.getByRole('heading', { level: 1 }).textContent())?.replace('Pedido ', '') ?? ''

    await page.getByRole('link', { name: 'Meus pedidos' }).click()
    const items = page.getByTestId('order-history-item')
    await expect(items).toHaveCount(2)
    // Most recent first.
    await expect(items.first()).toContainText(confirmedNumber)
    await expect(items.first()).toContainText('1 item')
    await expect(items.first()).toContainText('0.394 ETH')
    await expect(items.first()).toContainText('Confirmado')
    await expect(items.nth(1)).toContainText('Recusado')

    await items.first().getByRole('link', { name: `Ver recibo do pedido ${confirmedNumber}` }).click()
    await expect(page.getByRole('heading', { level: 1, name: `Pedido ${confirmedNumber}` })).toBeVisible()
    await expect(page.getByTestId('order-total')).toHaveText('0.394 ETH')

    // Failure (after the automatic retries) and recovery by the retry button.
    await page.addInitScript(() => {
      let listRequests = 0
      window.__KURIO_NETWORK_CONDITIONS__ = (request) => {
        if (request.method !== 'GET' || new URL(request.url).pathname !== '/api/orders') return undefined
        listRequests += 1
        return listRequests <= 3 ? { status: 503 } : undefined
      }
    })
    await page.goto('/perfil/pedidos')
    await expect(page.getByText('Não foi possível carregar seus pedidos.')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(items).toHaveCount(2)
  })

  test('isola perfil, carteiras e pedidos entre Ana e Bruno, inclusive respostas atrasadas', async ({ page }) => {
    await login(page, ANA)
    await postMockControl(page, 'scenario', { payment: 'manual' }, 'PUT')
    await buyFirstAvailable(page, 'golden-signal-160')
    const anaOrderPath = new URL(page.url()).pathname

    // Ana saves a wallet; the API commits it, but the answer only arrives after the switch to Bruno.
    await page.goto('/perfil/carteiras')
    await page.evaluate(() => {
      window.__KURIO_NETWORK_CONDITIONS__ = (request) =>
        request.method === 'PATCH' && new URL(request.url).pathname.startsWith('/api/me/wallets/')
          ? { delayMs: 0, delayAfterCommitMs: 3000 }
          : undefined
    })
    await page.getByRole('button', { name: 'Editar Carteira de coleção' }).click()
    const editForm = page.getByRole('form', { name: 'Editar Carteira de coleção' })
    await editForm.getByRole('textbox', { name: 'Nome da carteira' }).fill('Coleção da Ana')
    const lateResponse = page.waitForResponse((response) => response.request().method() === 'PATCH')
    await editForm.getByRole('button', { name: 'Salvar carteira' }).click()
    // The API already committed the change (read with Ana's token) while the answer is still on its way.
    await expect
      .poll(async () => JSON.stringify((await apiRequest(page, '/me/wallets')).body))
      .toContain('Coleção da Ana')

    // Client-side navigation keeps the page (and the in-flight request) alive.
    await page.getByRole('button', { name: 'Sair' }).first().click()
    await page.getByRole('link', { name: 'Entrar' }).click()
    await submitLogin(page, BRUNO)
    await expect(profileLink(page, BRUNO.displayName)).toBeVisible()
    // Ana's late answer is dropped instead of being written to any cache.
    expect((await lateResponse).status()).toBe(200)

    await profileLink(page, BRUNO.displayName).click()
    await expect(page.getByTestId('account-details')).toContainText(BRUNO.email)
    await expect(page.getByTestId('account-details')).not.toContainText(ANA.email)
    await page.getByRole('link', { name: 'Carteiras' }).click()
    const cards = page.getByTestId('wallet-card')
    await expect(cards).toHaveCount(1)
    await expect(cards).toContainText('0x51dE0a9B8c7D6e5F4a3B2c1D0e9F8a7B6c5D4e3F')
    await expect(page.getByText('Coleção da Ana')).toHaveCount(0)
    await expect(page.getByText('Carteira de coleção')).toHaveCount(0)

    await page.getByRole('link', { name: 'Pedidos' }).click()
    await expect(page.getByText('Você ainda não fez pedidos.')).toBeVisible()
    await page.goto(anaOrderPath)
    await expect(page.getByRole('heading', { name: 'Pedido não encontrado' })).toBeVisible()
    const anaWalletAsBruno = await apiRequest(page, '/me/wallets/wallet-ana-secondary', {
      method: 'PATCH',
      body: { label: 'Invasão', address: NEW_WALLET_ADDRESS, networks: ['polygon'] },
    })
    expect(anaWalletAsBruno.status).toBe(404)

    // Ana's own (committed) change is visible to her only.
    await logout(page)
    await login(page, ANA)
    await page.goto('/perfil/carteiras')
    await expect(page.getByText('Coleção da Ana')).toBeVisible()
    await page.getByRole('link', { name: 'Pedidos' }).click()
    await expect(page.getByTestId('order-history-item')).toHaveCount(1)
  })
})

test.describe('respostas atrasadas da sessão anterior', () => {
  test.skip(({ isMobile }) => isMobile, 'Layout desktop.')

  test('um 401 atrasado da sessão anterior não encerra a sessão seguinte', async ({ page }) => {
    await login(page, ANA)
    await page.goto('/perfil')
    await expect(page.getByRole('textbox', { name: 'Nome de exibição' })).toHaveValue(ANA.displayName)
    await page.evaluate(() => {
      window.__KURIO_NETWORK_CONDITIONS__ = (request) =>
        request.method === 'PATCH' && new URL(request.url).pathname === '/api/me/account' ? { delayMs: 3000 } : undefined
    })
    const lateResponse = page.waitForResponse((response) => response.request().method() === 'PATCH')
    await page.getByRole('textbox', { name: 'Nome de exibição' }).fill('Nome Atrasado')
    await page.getByRole('button', { name: 'Salvar perfil' }).click()

    // Logout revokes Ana's token, so her pending request ends with 401 after Bruno signs in.
    await page.getByRole('button', { name: 'Sair' }).first().click()
    await page.getByRole('link', { name: 'Entrar' }).click()
    await submitLogin(page, BRUNO)
    await expect(profileLink(page, BRUNO.displayName)).toBeVisible()
    expect((await lateResponse).status()).toBe(401)

    await expect(profileLink(page, BRUNO.displayName)).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Sua sessão expirou' })).toHaveCount(0)
    expect(await page.evaluate((tokenKey) => localStorage.getItem(tokenKey), SESSION_TOKEN_KEY)).not.toBeNull()
    await profileLink(page, BRUNO.displayName).click()
    await expect(page.getByTestId('account-details')).toContainText(BRUNO.displayName)
  })
})

test.describe('perfil no mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'Layout mobile.')

  test('edita perfil e carteira e consulta pedidos pela tab bar', async ({ page }) => {
    await page.goto('/entrar')
    await submitLogin(page, ANA)
    await expect(page).toHaveURL(/\/$/)
    await page.getByRole('link', { name: 'Perfil' }).click()
    await expect(page).toHaveURL(/\/perfil$/)

    await page.getByRole('textbox', { name: 'Nome de exibição' }).fill('Ana no Celular')
    await page.getByRole('button', { name: 'Salvar perfil' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Perfil atualizado.' })).toBeVisible()
    await expect(page.getByTestId('account-details')).toContainText('Ana no Celular')

    await page.getByRole('link', { name: 'Carteiras' }).click()
    await page.getByRole('button', { name: 'Editar Carteira de coleção' }).click()
    const editForm = page.getByRole('form', { name: 'Editar Carteira de coleção' })
    await editForm.getByRole('checkbox', { name: 'Ethereum' }).check()
    await editForm.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByTestId('wallet-card').nth(1)).toContainText('Redes: Ethereum, Polygon')

    await page.getByRole('link', { name: 'Pedidos' }).click()
    await expect(page.getByText('Você ainda não fez pedidos.')).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasHorizontalOverflow).toBe(false)
    await page.reload()
    await expect(page.getByTestId('account-details')).toContainText('Ana no Celular')
  })
})
