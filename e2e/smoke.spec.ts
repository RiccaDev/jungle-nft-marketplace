import { expect, test } from '@playwright/test'

test('renders the API status served by the MSW mock', async ({ page }) => {
  const healthResponse = page.waitForResponse((response) => response.url().endsWith('/api/health'))

  await page.goto('/')

  expect((await healthResponse).status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'Status da API' })).toBeVisible()
  await expect(page.getByTestId('health-status')).toHaveText('ok')
})

test('shows the not found page for unknown routes', async ({ page }) => {
  await page.goto('/rota-inexistente')

  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page).toHaveURL('/')
})
