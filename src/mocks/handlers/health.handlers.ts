import { http, HttpResponse } from 'msw'
import type { HealthResponse } from '@/features/health/health.api'
import { apiUrl } from '@/lib/http/config'

export const healthHandlers = [
  http.get(apiUrl('/health'), () =>
    HttpResponse.json<HealthResponse>({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
  ),
]
