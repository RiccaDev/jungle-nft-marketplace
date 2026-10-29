import { loadMockState, saveMockState } from './mock-storage'

// Deterministic outcomes for the parts of the purchase owned by external parties
// (the buyer's wallet and the payment network). Changed through /api/__mocks__/scenario.
export type MockScenario = {
  // Answer of the simulated wallet to a connection request.
  walletConnection: 'approve' | 'reject'
  // Outcome of the payment of new orders; "manual" keeps them pending until settled by the
  // control endpoint.
  payment: 'confirm' | 'reject' | 'manual'
  // Time between the order creation and its settlement.
  settlementDelayMs: number
}

export const DEFAULT_MOCK_SCENARIO: MockScenario = {
  walletConnection: 'approve',
  payment: 'confirm',
  settlementDelayMs: 2500,
}

const STORAGE_NAME = 'scenario:v1'
const MAX_SETTLEMENT_DELAY_MS = 60_000

let scenario = { ...DEFAULT_MOCK_SCENARIO, ...loadMockState<Partial<MockScenario>>(STORAGE_NAME, () => ({})) }

export function getMockScenario(): MockScenario {
  return scenario
}

// Unknown fields and invalid values are ignored, so a partial update never breaks the scenario.
export function updateMockScenario(changes: Partial<Record<keyof MockScenario, unknown>>) {
  const next = { ...scenario }
  if (changes.walletConnection === 'approve' || changes.walletConnection === 'reject') {
    next.walletConnection = changes.walletConnection
  }
  if (changes.payment === 'confirm' || changes.payment === 'reject' || changes.payment === 'manual') {
    next.payment = changes.payment
  }
  const delayMs = changes.settlementDelayMs
  if (typeof delayMs === 'number' && Number.isInteger(delayMs) && delayMs >= 0 && delayMs <= MAX_SETTLEMENT_DELAY_MS) {
    next.settlementDelayMs = delayMs
  }
  scenario = next
  saveMockState(STORAGE_NAME, scenario)
  return scenario
}
