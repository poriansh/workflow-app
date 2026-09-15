const accessTokenKey = 'accessToken'
const refreshTokenKey = 'refreshToken'

export function readAccessToken() {
  return localStorage.getItem(accessTokenKey) ?? ''
}

export function readRefreshToken() {
  return localStorage.getItem(refreshTokenKey) ?? ''
}

export function hasAccessToken() {
  return readAccessToken().length > 0
}

export function writeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(accessTokenKey, accessToken)
  localStorage.setItem(refreshTokenKey, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(accessTokenKey)
  localStorage.removeItem(refreshTokenKey)
}
