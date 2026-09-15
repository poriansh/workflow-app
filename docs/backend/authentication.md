# Authentication

Sources: `../new-hires/proto/genius/auth/v1/auth.proto`, `../new-hires/docs/bff-connect-client.md`, GUI integration guide §2.2.

## Service

`genius.auth.v1.Auth`

| RPC | Request | Response | Bearer |
| --- | --- | --- | --- |
| `Login` | `email`, `password` | `AuthTokens` | Do not send |
| `RefreshToken` | `refreshToken` | `AuthTokens` | Do not send |
| `Logout` | `refreshToken` | empty | Documented as an authenticated-style call after login. **Unknown / Needs Verification** whether the server requires the access bearer as well as the refresh token body. |
| `GetSession` | empty | `Session` | Yes |
| `ChangePassword` | `currentPassword`, `newPassword` | empty | Yes (any non-login RPC) |
| `Register` | `email`, `password`, `displayName`, `organizationName` | `AuthTokens` in the proto | Proto exists. Docs say it is disabled. Registration is invite-only via authenticated `Users.InviteUser`. Do not build a public signup screen on `Register`. |

## Tokens

`AuthTokens`:

- `accessToken`, `refreshToken`
- `accessExpiresAt`, `refreshExpiresAt` (`google.protobuf.Timestamp`)
- `session` (`User`, `Organization`, `permissions[]`, `roles[]`)

Persist both tokens. The briefing-pack example uses `localStorage` keys `accessToken` and `refreshToken`. That storage choice is an example, not a field in the proto. Do not put tokens in Zustand server caches. When an auth module is added, keep it in infrastructure and pass the access token only through the Connect interceptor.

## Call flow

1. `login({ email, password })`.
2. Store both tokens and the session snapshot if the UI needs it.
3. Every other RPC: interceptor sets `Authorization: Bearer <accessToken>`.
4. On Connect code `unauthenticated`: `refreshToken({ refreshToken })` once, store the new tokens, retry once. If refresh fails, clear tokens and send the user to login.
5. `logout({ refreshToken })`, then clear storage.

Do not send a bearer on `Login` or `RefreshToken`.

## Session

`GetSession` returns the current user, org, permission strings, and role strings. Use it to rehydrate after reload. The login response already includes a session, so a second call is not required on the happy path. **Unknown / Needs Verification:** whether `GetSession` is cheaper or more current than the session embedded in `AuthTokens`.

`Session.roles` is a list of strings. `User.roles` is documented as org role ids, not seed names. Do not assume the two lists use the same identifier. **Unknown / Needs Verification.**

## Expiration

Timestamps are on the token message. The docs do not require the client to schedule refresh before expiry. The documented trigger is an `unauthenticated` response. A proactive refresh from `accessExpiresAt` is an unspecified optimization. Do not invent a refresh interval.

## Current frontend

Login calls `Auth.Login`, `GetSession`, and `Logout` through `src/infrastructure/auth/authClient.ts` (shared `src/infrastructure/config/transport.ts`). Tokens live in `src/shared/lib/tokenStorage.ts`. The screen is `features/auth` at `/login`. A failed login stays on that form. There is no post-login route. `Auth.Register` is not implemented.

## What not to do

- Do not attach the access token to `POST /hooks/v1/{path}`.
- Do not retry `unauthenticated` more than once.
- Do not treat a successful dashboard sample as a logged-in session.
