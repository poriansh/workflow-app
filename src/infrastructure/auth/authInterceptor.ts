import { Code, ConnectError, createClient, type Interceptor } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { Auth } from '../../gen/genius/auth/v1/auth_pb.ts'
import { clearTokens, readAccessToken, readRefreshToken, writeTokens } from '@/shared/lib/tokenStorage.ts'

const publicMethods = new Set(['Login', 'RefreshToken'])

const apiBaseUrl = import.meta.env.VITE_GENIUS_API_URL ?? 'http://localhost:8090'

// Refresh must not go through the bearer interceptor (avoids recursion / shared-transport cycle).
const refreshClient = createClient(
  Auth,
  createConnectTransport({ baseUrl: apiBaseUrl }),
)

let refreshInFlight: Promise<string | null> | null = null

function refreshAccessToken() {
  const refreshToken = readRefreshToken()
  if (!refreshToken) return Promise.resolve(null)

  if (!refreshInFlight) {
    refreshInFlight = refreshClient
      .refreshToken({ refreshToken })
      .then((tokens) => {
        writeTokens(tokens.accessToken, tokens.refreshToken)
        return tokens.accessToken
      })
      .catch(() => {
        clearTokens()
        return null
      })
      .finally(() => {
        refreshInFlight = null
      })
  }

  return refreshInFlight
}

export const authInterceptor: Interceptor = (next) => async (request) => {
  if (publicMethods.has(request.method.name)) {
    return next(request)
  }

  const accessToken = readAccessToken()
  if (accessToken) {
    request.header.set('Authorization', `Bearer ${accessToken}`)
  }

  try {
    return await next(request)
  } catch (error) {
    if (!(error instanceof ConnectError) || error.code !== Code.Unauthenticated) {
      throw error
    }

    const nextAccessToken = await refreshAccessToken()
    if (!nextAccessToken) throw error

    request.header.set('Authorization', `Bearer ${nextAccessToken}`)
    return next(request)
  }
}
