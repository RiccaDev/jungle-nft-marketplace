// Mirrors the hook read by src/mocks/network/network-conditions.ts inside the browser.
interface Window {
  __KURIO_NETWORK_CONDITIONS__?: (
    request: Request,
  ) => { delayMs?: number; status?: number } | undefined
}
