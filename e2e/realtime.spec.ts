import { expect, test, type Page } from '@playwright/test'

const NFT_UPDATED_FRAME = /⬇.*42\["nft\.updated"/

function collectConsoleMessages(page: Page) {
  const messages: string[] = []
  page.on('console', (message) => messages.push(message.text()))
  return messages
}

function waitForMockUpdateRequest(page: Page) {
  return page.waitForResponse(
    (response) => response.url().endsWith('/api/__mocks__/nft-updates') && response.status() === 202,
  )
}

async function openConnectedDemo(page: Page) {
  await page.goto('/diagnostico')
  await expect(page.getByTestId('socket-status')).toHaveText('Socket: conectado')
  await expect(page.getByTestId('demo-nft-version')).toHaveText('1')
}

test('delivers nft.updated through socket.io-client and updates the NFT', async ({ page }) => {
  const consoleMessages = collectConsoleMessages(page)
  await openConnectedDemo(page)
  await expect(page.getByTestId('demo-nft-price')).toHaveText('0.75 ETH')

  const mockUpdateRequest = waitForMockUpdateRequest(page)
  await page.getByRole('button', { name: 'Simular alteração no servidor' }).click()
  await mockUpdateRequest

  await expect(page.getByTestId('demo-nft-price')).toHaveText('0.82 ETH')
  await expect(page.getByTestId('demo-nft-available')).toHaveText('9')
  await expect(page.getByTestId('demo-nft-version')).toHaveText('2')
  await expect(page.getByTestId('realtime-last-event')).toHaveText(
    'Evento nft.updated:demo-nft-1:2 recebido via Socket.IO.',
  )

  const nftUpdatedFrames = consoleMessages.filter((message) => NFT_UPDATED_FRAME.test(message))
  expect(nftUpdatedFrames).toHaveLength(1)
})

test('ignores changes while disconnected and reconciles through REST after reconnecting', async ({
  page,
}) => {
  await openConnectedDemo(page)

  await page.getByRole('button', { name: 'Desconectar socket' }).click()
  await expect(page.getByTestId('socket-status')).toHaveText('Socket: desconectado')

  const mockUpdateRequest = waitForMockUpdateRequest(page)
  await page.getByRole('button', { name: 'Simular alteração no servidor' }).click()
  await mockUpdateRequest

  await expect(page.getByTestId('demo-nft-price')).toHaveText('0.75 ETH')
  await expect(page.getByTestId('demo-nft-version')).toHaveText('1')

  await page.getByRole('button', { name: 'Reconectar socket' }).click()
  await expect(page.getByTestId('socket-status')).toHaveText('Socket: conectado')

  await expect(page.getByTestId('demo-nft-price')).toHaveText('0.82 ETH')
  await expect(page.getByTestId('demo-nft-version')).toHaveText('2')
  await expect(page.getByTestId('realtime-last-event')).toHaveText('Nenhum evento recebido.')
})
