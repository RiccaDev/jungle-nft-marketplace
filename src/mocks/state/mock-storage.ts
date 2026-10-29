// Every persisted mock state lives under this prefix, so a reset can drop all of it at once.
const MOCK_STORAGE_PREFIX = 'kurio-mock:'

export function loadMockState<State>(name: string, createInitialState: () => State): State {
  try {
    const stored = localStorage.getItem(`${MOCK_STORAGE_PREFIX}${name}`)
    if (stored) return JSON.parse(stored) as State
  } catch {
    // Corrupted or unavailable storage falls back to the initial state.
  }
  return createInitialState()
}

export function saveMockState(name: string, state: unknown) {
  try {
    localStorage.setItem(`${MOCK_STORAGE_PREFIX}${name}`, JSON.stringify(state))
  } catch {
    // The in-memory state keeps working without storage.
  }
}

// Restores the known initial scenario on the next page load (in-memory state is rebuilt then).
export function clearMockStorage() {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
    for (const key of keys) {
      if (key?.startsWith(MOCK_STORAGE_PREFIX)) localStorage.removeItem(key)
    }
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
