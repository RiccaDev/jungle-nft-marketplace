import { expect, test, type Page } from '@playwright/test'

const ANA = { email: 'ana@kurio.dev', password: 'kurio-ana-2026', displayName: 'Ana Ribeiro' }
const BRUNO = { email: 'bruno@kurio.dev', password: 'kurio-bruno-2026', displayName: 'Bruno Tavares' }
const SESSION_TOKEN_KEY = 'kurio.session-token'

async function submitLogin(page: Page, credentials: { email: string; password: string }) {
  await page.getByRole('textbox', { name: 'E-mail' }).fill(credentials.email)
  await page.getByLabel('Senha', { exact: true }).fill(credentials.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

async function loginFromScreen(page: Page, credentials: { email: string; password: string }) {
  await page.goto('/entrar')
  await submitLogin(page, credentials)
  await expect(page).toHaveURL(/\/$/)
}

function profileLink(page: Page, displayName: string) {
  return page.getByRole('link', { name: `Perfil de ${displayName}` })
}

async function expireCurrentSession(page: Page) {
  // Requests still in flight (e.g. the account cart loaded after login) would hit the expired
  // session first; settle them so the expiration is observed by the next user action.
  await page.waitForLoadState('networkidle')
  const status = await page.evaluate(async (tokenKey) => {
    const token = localStorage.getItem(tokenKey)
    const response = await fetch('/api/__mocks__/auth/expire-session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.status
  }, SESSION_TOKEN_KEY)
  expect(status).toBe(202)
}

test.describe('autenticação no desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Modais de autenticação do desktop.')

  test('valida o cadastro, trata conflitos e cria a conta', async ({ page }) => {
    await page.goto('/cadastro')
    const dialog = page.getByRole('dialog', { name: 'Criar conta' })
    await dialog.getByRole('button', { name: 'Criar conta' }).click()

    await expect(dialog.getByText('Informe um nome de usuário.')).toBeVisible()
    await expect(dialog.getByText('Informe seu e-mail.')).toBeVisible()
    await expect(dialog.getByText('Informe uma senha.')).toBeVisible()
    await expect(dialog.getByRole('textbox', { name: 'Nome de usuário' })).toBeFocused()

    await dialog.getByRole('textbox', { name: 'Nome de usuário' }).fill('ana.colecionadora')
    await dialog.getByRole('textbox', { name: 'Digite seu e-mail' }).fill('nova@kurio.dev')
    await dialog.getByLabel('Senha', { exact: true }).fill('curta')
    await dialog.getByLabel('Confirmar senha').fill('outra')
    await expect(dialog.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeVisible()
    await expect(dialog.getByText('As senhas não conferem.')).toBeVisible()

    await dialog.getByLabel('Senha', { exact: true }).fill('colecao2026')
    await dialog.getByLabel('Confirmar senha').fill('colecao2026')
    await dialog.getByRole('button', { name: 'Criar conta' }).click()
    await expect(dialog.getByText('Este nome de usuário já está em uso.')).toBeVisible()

    await dialog.getByRole('textbox', { name: 'Nome de usuário' }).fill('nova.colecionadora')
    await dialog.getByRole('textbox', { name: 'Digite seu e-mail' }).fill('ANA@kurio.dev')
    await dialog.getByRole('button', { name: 'Criar conta' }).click()
    await expect(dialog.getByText('Este e-mail já está cadastrado.')).toBeVisible()
    await expect(dialog.getByRole('textbox', { name: 'Digite seu e-mail' })).toHaveAttribute('aria-invalid', 'true')

    await dialog.getByRole('textbox', { name: 'Digite seu e-mail' }).fill('nova@kurio.dev')
    await dialog.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(profileLink(page, 'nova.colecionadora')).toBeVisible()
  })

  test('recusa credenciais inválidas e entra com credenciais válidas', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByRole('textbox', { name: 'E-mail' }).fill('ana@kurio')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
    await expect(page.getByText('Informe sua senha.')).toBeVisible()

    await submitLogin(page, { email: ANA.email, password: 'senha-errada-1' })
    await expect(page.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
    expect(await page.evaluate((key) => localStorage.getItem(key), SESSION_TOKEN_KEY)).toBeNull()

    await submitLogin(page, ANA)
    await expect(page).toHaveURL(/\/$/)
    await expect(profileLink(page, ANA.displayName)).toBeVisible()
  })

  test('protege rotas privadas e retoma o destino original após o login', async ({ page }) => {
    await page.goto('/perfil')
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil$/)

    await submitLogin(page, ANA)
    await expect(page).toHaveURL(/\/perfil$/)
    await expect(page.getByTestId('account-details')).toContainText(ANA.email)
  })

  test('recupera a sessão após o refresh', async ({ page }) => {
    await loginFromScreen(page, ANA)
    await page.reload()
    await expect(profileLink(page, ANA.displayName)).toBeVisible()

    await page.goto('/perfil')
    await page.reload()
    await expect(page.getByTestId('account-details')).toContainText(ANA.email)
  })

  test('faz logout, limpa a sessão e volta a exigir login', async ({ page }) => {
    await loginFromScreen(page, ANA)
    await profileLink(page, ANA.displayName).click()
    await expect(page.getByTestId('account-details')).toContainText(ANA.email)

    await page.getByRole('button', { name: 'Sair' }).first().click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
    expect(await page.evaluate((key) => localStorage.getItem(key), SESSION_TOKEN_KEY)).toBeNull()

    await page.goto('/perfil')
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil$/)
  })

  test('troca de usuário sem vazar dados e refaz o handshake do socket', async ({ page }) => {
    const handshakeFrames: string[] = []
    page.on('console', (message) => {
      if (/⬆.*40\{"token"/.test(message.text())) handshakeFrames.push(message.text())
    })

    await page.goto('/entrar?redirect=%2Fperfil')
    await submitLogin(page, ANA)
    await expect(page.getByTestId('account-details')).toContainText(ANA.email)

    await page.getByRole('button', { name: 'Sair' }).first().click()
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()

    await page.goto('/entrar?redirect=%2Fperfil')
    const accountResponse = page.waitForResponse((response) => response.url().endsWith('/api/me/account'))
    await submitLogin(page, BRUNO)
    expect(await (await accountResponse).json()).toMatchObject({ email: BRUNO.email })

    const accountDetails = page.getByTestId('account-details')
    await expect(accountDetails).toContainText(BRUNO.displayName)
    await expect(accountDetails).not.toContainText(ANA.email)
    await expect(profileLink(page, BRUNO.displayName)).toBeVisible()

    await expect.poll(() => handshakeFrames.some((frame) => frame.includes('40{"token":null'))).toBe(true)
    await expect
      .poll(() => handshakeFrames.filter((frame) => !frame.includes('40{"token":null')).length)
      .toBeGreaterThanOrEqual(2)
  })

  test('redireciona ao login quando a sessão expira durante a navegação', async ({ page }) => {
    await loginFromScreen(page, ANA)
    await expireCurrentSession(page)

    await profileLink(page, ANA.displayName).click()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil&reason=session-expired$/)
    await expect(page.getByRole('status').filter({ hasText: 'Sua sessão expirou' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible()

    await submitLogin(page, ANA)
    await expect(page).toHaveURL(/\/perfil$/)
    await expect(page.getByTestId('account-details')).toContainText(ANA.email)
  })

  test('avisa sobre sessão expirada após o refresh em página pública', async ({ page }) => {
    await loginFromScreen(page, ANA)
    await expireCurrentSession(page)
    await page.reload()

    await expect(page.getByRole('status').filter({ hasText: 'Sua sessão expirou' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible()
    expect(await page.evaluate((key) => localStorage.getItem(key), SESSION_TOKEN_KEY)).toBeNull()
  })

  test('responde 401 a requisições privadas sem sessão', async ({ page }) => {
    await page.goto('/')
    // The app renders only after the MSW worker is active, so requests below are mocked.
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
    const response = await page.evaluate(async () => {
      const result = await fetch('/api/me/account')
      return { status: result.status, body: await result.json() }
    })
    expect(response).toEqual({
      status: 401,
      body: { error: { code: 'UNAUTHENTICATED', message: 'É necessário entrar para continuar.' } },
    })
  })
})

test.describe('autenticação no mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'Telas de autenticação do mobile.')

  test('usa páginas de login e cadastro e retoma o perfil pela tab bar', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Perfil' }).click()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await page.getByRole('link', { name: 'Novo na Kurio? Crie uma conta' }).click()
    await expect(page).toHaveURL(/\/cadastro\?redirect=%2Fperfil$/)
    await page.getByRole('link', { name: 'Já tem uma conta? Entre' }).click()

    await submitLogin(page, BRUNO)
    await expect(page).toHaveURL(/\/perfil$/)
    await expect(page.getByTestId('account-details')).toContainText(BRUNO.email)
  })
})
