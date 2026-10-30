import { expect, test, type Page } from '@playwright/test'

const ANA = { email: 'ana@kurio.dev', password: 'kurio-ana-2026' }

async function login(page: Page) {
  await page.goto('/entrar')
  await page.getByRole('textbox', { name: 'E-mail' }).fill(ANA.email)
  await page.getByLabel('Senha', { exact: true }).fill(ANA.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
}

async function tabUntilFocused(page: Page, target: ReturnType<Page['locator']>, maxSteps = 60) {
  for (let step = 0; step < maxSteps; step += 1) {
    await page.keyboard.press('Tab')
    if (await target.evaluate((element) => element === document.activeElement)) return
  }
  throw new Error('O elemento não foi alcançado pela navegação por teclado.')
}

test.describe('navegação por teclado', () => {
  test('o primeiro Tab revela o atalho para o conteúdo principal', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('nft-grid')).toBeVisible()

    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toBeInViewport()

    await page.keyboard.press('Enter')
    await expect(page.locator('main#conteudo')).toBeFocused()
  })

  test('o zoom da galeria prende o foco e o devolve ao fechar', async ({ page }) => {
    await page.goto('/nfts/emerald-ape-042')
    const trigger = page.getByRole('button', { name: 'Ampliar imagem' }).filter({ visible: true })
    await tabUntilFocused(page, trigger)

    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Emerald Ape #042' })
    await expect(dialog).toBeVisible()
    for (let step = 0; step < 4; step += 1) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('favorita um NFT do catálogo usando apenas o teclado', async ({ page }) => {
    await login(page)
    const heart = page.getByTestId('nft-grid').getByRole('button', { name: 'Favoritar Emerald Ape #042' })
    await tabUntilFocused(page, heart)

    await page.keyboard.press('Space')
    await expect(heart).toHaveAttribute('aria-pressed', 'true')
    await expect(heart).toBeEnabled()
    await expect(heart).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(heart).toHaveAttribute('aria-pressed', 'false')
  })
})

test.describe('navegação por teclado no mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'A gaveta de filtros só existe no layout mobile.')

  test('a gaveta de filtros devolve o foco ao botão que a abriu', async ({ page }) => {
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Filtros e ordenação' })
    await trigger.focus()
    await page.keyboard.press('Enter')

    const drawer = page.getByRole('dialog', { name: 'Filtros' })
    await expect(drawer).toBeVisible()
    expect(await drawer.evaluate((element) => element.contains(document.activeElement))).toBe(true)

    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(trigger).toBeFocused()
  })
})
