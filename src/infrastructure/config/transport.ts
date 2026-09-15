import { createConnectTransport } from '@connectrpc/connect-web'
import { authInterceptor } from '../auth/authInterceptor.ts'

export const transport = createConnectTransport({
  baseUrl: import.meta.env.VITE_GENIUS_API_URL ?? 'http://localhost:8090',
  interceptors: [authInterceptor],
})
