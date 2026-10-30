import { expect, test, type Page } from '@playwright/test'

const ANA = { email: 'ana@kurio.dev', password: 'kurio-ana-2026' }
const NFT_ID = 'emerald-ape-042'

// Baselines live in e2e/visual.spec.ts-snapshots and are generated per project (desktop/mobile).
// Update them only after reviewing the diff: npm run test:visual -- --update-snapshots
test.use({ reducedMotion: 'reduce' })

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    await document.fonts.ready
    // A full-page capture includes off-screen lazy images, which would otherwise never load.
    const images = Array.from(document.images)
    for (const image of images) image.loading = 'eager'
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)))
  })
}

async function expectPage(page: Page, name: string) {
  await settle(page)
  await expect(page).toHaveScreenshot(name, { fullPage: true, animations: 'disabled', caret: 'hide' })
}

async function login(page: Page) {
  await page.goto('/entrar')
  await page.getByRole('textbox', { name: 'E-mail' }).fill(ANA.email)
  await page.getByLabel('Senha', { exact: true }).fill(ANA.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
}

async function addToCart(page: Page) {
  await page.goto(`/nfts/${NFT_ID}`)
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  await expect(page.getByTestId('quote-total')).toHaveText(/ETH/)
}

test.describe('regressão visual', () => {
  test('home', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('nft-grid')).toBeVisible()
    await expectPage(page, 'home.png')
  })

  test('detalhe do NFT', async ({ page }) => {
    await page.goto(`/nfts/${NFT_ID}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectPage(page, 'nft-detail.png')
  })

  test('carrinho', async ({ page }) => {
    await login(page)
    await addToCart(page)
    await expectPage(page, 'cart.png')
  })

  test('pagamento', async ({ page }) => {
    await login(page)
    await addToCart(page)
    await page.goto('/pagamento')
    await expect(page.getByRole('heading', { level: 1, name: 'Pagamento' })).toBeVisible()
    await expect(page.getByTestId('checkout-total')).toBeVisible()
    await expectPage(page, 'checkout.png')
  })
})
