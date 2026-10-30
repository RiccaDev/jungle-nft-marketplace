import { expect, test, type Page } from '@playwright/test'

const ANA = { email: 'ana@kurio.dev', password: 'kurio-ana-2026' }
const BRUNO = { email: 'bruno@kurio.dev', password: 'kurio-bruno-2026' }
const NFT_ID = 'emerald-ape-042'
const NFT_NAME = 'Emerald Ape #042'

async function login(page: Page, credentials: { email: string; password: string }) {
  await page.goto('/entrar')
  await page.getByRole('textbox', { name: 'E-mail' }).fill(credentials.email)
  await page.getByLabel('Senha', { exact: true }).fill(credentials.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
}

// The profile page offers "Sair" on every viewport; the mobile home has no header menu.
async function logout(page: Page) {
  await page.goto('/perfil')
  await page.getByRole('button', { name: 'Sair' }).first().click()
  await expect(page).not.toHaveURL(/\/perfil/)
  await page.goto('/')
}

function catalogFavoriteButton(page: Page, name = NFT_NAME) {
  return page.getByTestId('nft-grid').getByRole('button', { name: `Favoritar ${name}` })
}

function detailFavoriteButton(page: Page) {
  return page.getByTestId('favorite-button').filter({ visible: true }).first()
}

function favoritesList(page: Page) {
  return page.getByTestId('favorites-list')
}

async function failFavoriteWrites(page: Page) {
  await page.evaluate(() => {
    window.__KURIO_NETWORK_CONDITIONS__ = (request) =>
      request.method !== 'GET' && new URL(request.url).pathname.startsWith('/api/me/favorites')
        ? { status: 500, delayMs: 300 }
        : undefined
  })
}

test.describe('Favoritos', () => {
  test('visitante é levado ao login preservando o destino', async ({ page }) => {
    await page.goto(`/nfts/${NFT_ID}`)
    await detailFavoriteButton(page).click()
    await expect(page).toHaveURL(new RegExp(`/entrar\\?redirect=%2Fnfts%2F${NFT_ID}$`))
  })

  test('favorita e desfavorita pelo catálogo, persistindo após recarregar', async ({ page }) => {
    await login(page, ANA)
    const button = catalogFavoriteButton(page)
    await expect(button).toHaveAttribute('aria-pressed', 'false')

    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(button).toBeEnabled()

    await page.reload()
    await expect(catalogFavoriteButton(page)).toHaveAttribute('aria-pressed', 'true')

    await page.goto('/perfil/favoritos')
    await expect(favoritesList(page).getByRole('link', { name: NFT_NAME })).toBeVisible()

    await page.goto('/')
    await catalogFavoriteButton(page).click()
    await expect(catalogFavoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
    await expect(catalogFavoriteButton(page)).toBeEnabled()

    await page.reload()
    await expect(catalogFavoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
    await page.goto('/perfil/favoritos')
    await expect(page.getByText('Você ainda não favoritou nenhum NFT.')).toBeVisible()
  })

  test('favorita pelo detalhe e reflete o estado no catálogo', async ({ page }) => {
    await login(page, ANA)
    await page.goto(`/nfts/${NFT_ID}`)
    const button = detailFavoriteButton(page)

    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(button).toBeEnabled()

    await page.reload()
    await expect(detailFavoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
    await page.goto('/')
    await expect(catalogFavoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
  })

  test('desfaz a atualização otimista quando o servidor falha', async ({ page }) => {
    await login(page, ANA)
    await failFavoriteWrites(page)
    const button = catalogFavoriteButton(page)

    await button.click()
    // The optimistic state is visible while the request is in flight, then rolled back.
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByRole('alert').filter({ hasText: /Falha simulada \(HTTP 500\)/ })).toHaveCount(1)

    await page.reload()
    await expect(catalogFavoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
  })

  test('mantém os favoritos isolados entre Ana e Bruno', async ({ page }) => {
    await login(page, ANA)
    await catalogFavoriteButton(page).click()
    await expect(catalogFavoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(catalogFavoriteButton(page)).toBeEnabled()
    await logout(page)

    await expect(catalogFavoriteButton(page)).toHaveAttribute('aria-pressed', 'false')

    await login(page, BRUNO)
    await expect(catalogFavoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
    await page.goto('/perfil/favoritos')
    await expect(page.getByText('Você ainda não favoritou nenhum NFT.')).toBeVisible()
    await logout(page)

    await login(page, ANA)
    await expect(catalogFavoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
  })
})
