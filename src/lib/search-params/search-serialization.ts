// Router search (de)serializer: flat values only, arrays as comma-separated lists,
// so URLs stay readable (e.g. `?collections=music,photography&page=2`).
export function stringifySearch(search: Record<string, unknown>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(','))
      continue
    }
    params.set(key, String(value))
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

export function parseSearch(searchString: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(searchString))
}
