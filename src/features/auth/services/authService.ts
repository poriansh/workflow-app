
import { Code, ConnectError } from '@connectrpc/connect'
import { authClient } from '../../../infrastructure/auth/authClient.ts'
import { clearTokens, readRefreshToken, writeTokens } from '@/shared/lib/tokenStorage.ts'


export const sessionQueryKey = ['genius', 'Auth', 'getSession'] as const

export type SignedInAccount = {
  email: string
  displayName: string
}

function toAccount(user: { email: string; displayName: string } | undefined): SignedInAccount {
  return {
    email: user?.email ?? '',
    displayName: user?.displayName || user?.email || 'وارد شده‌اید',
  }
}

export async function login(email: string, password: string) {
  const tokens = await authClient.login({ email, password })
  writeTokens(tokens.accessToken, tokens.refreshToken)
  return toAccount(tokens.session?.user)
}

export async function getSession() {
  const session = await authClient.getSession({})
  return toAccount(session.user)
}

export function loginErrorMessage(error: unknown) {
  if (error instanceof ConnectError && error.code === Code.Unauthenticated) {
    return 'ایمیل یا رمز عبور نادرست است.'
  }
  return 'ورود انجام نشد. دوباره تلاش کنید.'
}

export async function logout() {
  const refreshToken = readRefreshToken()
  try {
    if (refreshToken) {
      await authClient.logout({ refreshToken })
    }
  } finally {
    clearTokens()
  }
}

