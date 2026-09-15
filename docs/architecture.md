# Architecture

This document is the placement contract for `genius-web`. Cursor enforces related rules in `.cursor/rules/`.

The codebase is the source of truth. Two kinds of statements live here. Do not mix them.

- **Current implementation** — what exists in the repository today.
- **Project standard** — rules for the next change. Not a claim that a folder, screen, or route already exists.

---

## Current implementation

The app is a Vite + React + TypeScript client. Tailwind v4. Persian RTL shell (`lang="fa"` `dir="rtl"` in `index.html`). Font is Vazirmatn. `index.html` has **no** theme initialization script.

### Folder tree (as it exists)

```text
src/
├── index.css
├── main.tsx
├── App.tsx
├── vite-env.d.ts
├── app/
│   ├── layouts/
│   │   └── pageFrame.tsx
│   ├── providers/
│   │   ├── errorBoundary.tsx
│   │   ├── queryProvider.tsx
│   │   └── index.tsx
│   └── routes/
│       └── index.tsx
├── features/
│   └── auth/
│       ├── components/
│       │   ├── FlowBackground.tsx
│       │   └── LoginForm.tsx
│       ├── hooks/
│       │   ├── useLogin.ts
│       │   ├── useLogout.ts
│       │   └── useSession.ts
│       ├── pages/
│       │   └── LoginPage.tsx          # default export
│       ├── schemas/
│       │   └── LoginSchema.ts
│       └── services/
│           └── authService.ts
├── infrastructure/
│   ├── auth/
│   │   ├── authClient.ts
│   │   └── authInterceptor.ts
│   └── config/
│       └── transport.ts
├── shared/
│   ├── components/
│   │   ├── LoadingPage/
│   │   │   └── Loadingpage.tsx
│   │   └── ToggleThem/
│   │       └── ThemeToggle.tsx
│   ├── hooks/
│   │   └── darkmode/
│   │       └── useThemeStore.ts
│   ├── lib/
│   │   └── tokenStorage.ts
│   ├── pages/
│   │   └── NotFoundPage.tsx           # default export
│   ├── ui/                            # button, input, label, card, alert
│   └── utils/
│       └── utils.ts                   # cn()
└── gen/                               # Buf output. Never edit.
```

Not present today: `src/assets/`, `features/admin|agent|member|reseller|public`, `store-panel`, `infrastructure/http`. Do not create them for symmetry.

### Layer responsibilities (from what the code actually does)

| Area | Current role |
| --- | --- |
| `src/app` | Shell: `PageFrame`, providers (`QueryProvider`, `ErrorBoundary`), single route table |
| `src/features` | Product domains. Only `auth` exists |
| `src/infrastructure` | Shared Connect `transport` + service clients (`auth/`) |
| `src/shared` | Reused UI (`ui/`), theme store, `ThemeToggle`, tokens helper, `LoadingPage`, `NotFoundPage` |
| `src/gen` | Generated protobuf / Connect clients |

Note (current fact, not a redesign): `PageFrame` lives in `app/layouts` and imports `FlowBackground` from `features/auth`. `LoadingPage` (shared) imports `PageFrame` (app). Prefer extending existing placement; do not rearrange for purity unless explicitly asked.

### Boot sequence

1. `main.tsx` mounts `QueryProvider` → `App`.
2. `App.tsx` reads `useThemeStore().theme` and toggles `document.documentElement` class `dark`. Wraps `AppRoutes` in `ErrorBoundary`.
3. `AppRoutes` uses React Router `createBrowserRouter` + `RouterProvider`.

### Routing (current)

All routes live in **one file**: `src/app/routes/index.tsx`.

| Path | Element | Notes |
| --- | --- | --- |
| `/login` | lazy `LoginPage` | Suspense → `LoadingPage` |
| `*` | lazy `NotFoundPage` | Suspense → `LoadingPage` |

There is **no** dedicated `/` route and **no** redirect from `/` to `/login`. The path `/` matches `*` and renders `NotFoundPage`.

Page modules use **default exports** and `React.lazy(() => import(...))`. `LoadingPage` is imported eagerly so the fallback itself is not lazy.

There are no admin/agent/member/reseller routes yet.

### Loading (current)

`src/shared/components/LoadingPage/Loadingpage.tsx`

- Reuses `PageFrame` (brand + theme toggle + flow background).
- Centered spinner (`size-8`, `border-border` / `border-t-foreground-muted`, `animate-spin`).
- `motion-reduce:animate-none`.
- Accessible via `role="status"` and `aria-label="در حال بارگذاری"` (no visible loading text).
- Used as the Suspense fallback for every lazy page route.

### Login (current)

**Primary visual reference** for the product.

- Page: `src/features/auth/pages/LoginPage.tsx` (default export), route `/login`.
- Own layout (not `PageFrame`): `FlowBackground`, header «جینیوس» + `ThemeToggle`, `main` `max-w-md` `text-center`.
- States: session fetch message; signed-in account + logout; or title/description + `LoginForm`.
- Form: `LoginForm` + RHF + Zod (`LoginSchema.ts`) + `zodResolver`.
- Hooks: `useLogin` (`useMutation`), `useSession` (`useQuery`, key `['genius', 'Auth', 'getSession']`, enabled when access token exists), `useLogout`.
- Service: `authService` maps Auth responses to `{ email, displayName }`, stores tokens, Persian `loginErrorMessage`.
- Client: `infrastructure/auth/authClient.ts` via shared `infrastructure/config/transport.ts` (Connect `Auth`, bearer interceptor on that transport, one refresh retry).
- Tokens: `shared/lib/tokenStorage.ts` (`accessToken` / `refreshToken` in `localStorage`). Not in Zustand. Not in the query cache as secrets.
- Success stays on `/login`. No post-login route exists.
- Expected API/validation errors stay in the form (`role="alert"`). Not error-boundary failures.

Visual conventions on Login (copy for future screens): Persian RTL, Vazirmatn, center-aligned text, `text-2xl` headings, `text-sm` muted body, open layout (no card), borderless `bg-surface` fields, `shadow-none` buttons, semantic tokens only, short `login-enter` / `flow-path` motion with reduced-motion off.

### Not found (current)

- File: `src/shared/pages/NotFoundPage.tsx` (default export).
- Reached via route `path: '*'`.
- Uses `PageFrame`, Persian RTL, center-aligned copy («صفحه پیدا نشد»), `login-enter`.
- Navigation: `Link` to `/` labeled «بازگشت به صفحه اصلی». Because `/` is not a separate route today, that link also hits `*` / `NotFoundPage`.

### Error boundary (current)

- File: `src/app/providers/errorBoundary.tsx`.
- Library: `react-error-boundary`.
- Mounted in `App.tsx` around `AppRoutes`.
- Fallback: Persian centered UI in `PageFrame` («مشکلی پیش آمد»); button «تلاش دوباره» calls `resetErrorBoundary`.
- `onReset` runs `window.location.reload()`.
- No stack trace in the UI.
- The current wrapper does **not** implement custom `onError` / console logging beyond what the library does by default.

**Limitations (standard understanding of this approach):** catches render errors in the child tree (including failed lazy imports that surface as render errors). Does not replace feature handling for Connect / Zod / mutation errors. Does not catch all event-handler or detached promise failures.

### Theme (current)

```text
Theme = 'dark' | 'light'
API = theme + toggleTheme
```

- Store: `src/shared/hooks/darkmode/useThemeStore.ts` (Zustand + `persist`, name `'theme'`).
- Initial value when nothing is persisted: from `prefers-color-scheme` inside the store (not a live `system` mode).
- `ThemeToggle` only reads `theme` / calls `toggleTheme`. No `useEffect`, no `document` writes.
- `App.tsx` is the only place that toggles `html` class `dark`.
- No `ThemeProvider`, no `system` theme value, no `setTheme`, no `resetTheme`, no theme script in `index.html`.

### Forms (current)

Login uses:

```text
React Hook Form + Zod + @hookform/resolvers/zod (zodResolver)
```

No custom resolver is used.

### State (current)

```text
TanStack Query → server state (session, login/logout mutations)
Zustand        → client UI state (theme only today)
```

Do not put tokens or server entities in Zustand.

### API (current)

```text
../new-hires/proto
  → Buf generate → src/gen
  → infrastructure/config/transport.ts   # single createConnectTransport
  → createClient(Service, transport)     # e.g. infrastructure/auth/authClient.ts
  → BFF (VITE_GENIUS_API_URL, default http://localhost:8090)
```

**Project standard:** Every Connect client must reuse `transport` from `src/infrastructure/config/transport.ts`. Do not call `createConnectTransport` again inside a feature or a second client module (except the dedicated refresh helper inside `authInterceptor`, which must not run the bearer interceptor). Auth bearer + one refresh retry live on that shared transport via `authInterceptor`.

Only `Auth` is wired as an app client today. Proto + `docs/backend/` win on contract shape. Do not invent RPCs. Axios is not the BFF standard.

---

## Project standards

Rules for future work. They are not inventory of unfinished folders.

### Documentation-first development

Enforced by `.cursor/rules/workflow.mdc` (always apply).

```text
READ docs + rules → INSPECT code → PLAN → IMPLEMENT → UPDATE docs → VERIFY
```

- Read relevant documentation and all applicable Cursor rules before non-trivial work.
- Do not implement from the user prompt alone when project docs exist.
- Distinguish **Current implementation**, **Project standard**, and **Planned** behavior.
- After code changes that affect architecture, API, auth, routing, state, infrastructure, or conventions, update docs automatically — do not wait to be asked.
- Verify with the smallest relevant command; never claim unverified results.

### Git hooks (current)

Husky is configured in this repo (npm + `.husky/`).

| Hook | Command | Purpose |
| --- | --- | --- |
| `pre-commit` | `npm run lint` | Block commits when ESLint fails |
| `pre-push` | `npm run build` | Block pushes when the production build fails |

`prepare` runs `husky` after `npm install`. Do not invent alternate lint/build commands for hooks; use these scripts.

### Layers

```text
app → features → infrastructure / shared
```

- Extend the existing architecture. Do not replace it.
- `shared` should not grow feature-only screens; prefer `features/<domain>` for domain UI.
- Feature API hooks/services stay in the feature. Generic Connect clients stay in `infrastructure`.
- Create `admin` / `agent` / `member` / `reseller` only when implementing that feature. Those names are UI areas, not IAM roles.

### Naming (observed)

- Component files / folders: PascalCase (note existing path typos such as `ToggleThem`, `Loadingpage.tsx` — do not rename unless asked).
- Hooks / utils: camelCase (`useLogin.ts`).
- Schemas: `SomethingSchema.ts`.
- Avoid dump folders: `common/`, `misc/`, `helpers/`, `temp/`, `new/`.

### Design language (Login is the reference)

Prefer: modern, minimal, premium SaaS/AI, Persian RTL, clean type, generous whitespace, clear hierarchy, soft surfaces, subtle borders/shadows, restrained color, responsive, accessible, center-aligned shell copy where Login does.

Avoid: generic dashboards, excessive cards/rounding, heavy borders/shadows, large gradients, glassmorphism, noisy backgrounds, extra palette colors, giant headings, template-looking shadcn stacks, unnecessary decoration.

### Motion

Subtle and purposeful. Prefer CSS/Tailwind (`animate-spin`, `login-enter`, `flow-path`, `motion-safe` / `motion-reduce`). Do not add an animation library for a simple effect. Always honor `prefers-reduced-motion`.

### Accessibility

Semantic HTML, keyboard use, visible focus, labels, form errors linked to fields, one `h1` per screen, token contrast, real buttons/links, reduced motion, ARIA only when native HTML is not enough. Loading uses `role="status"`.

### Clean code

Prefer simple, readable, explicit, maintainable code; small components; reuse existing patterns.

Avoid unnecessary abstractions, generic wrappers, premature optimization, clever TypeScript, duplicated logic, needless hooks/utils, unrelated refactors.

### Do not change architecture unless asked

Never move/rename layers, replace the router, replace Query/Zustand theme, or invent a parallel pattern because another structure “looks cleaner.” Prefer the option most consistent with current code.

### Documentation discipline

Always separate **Current implementation** from **Project standard**. Never describe a plan as if it already shipped.

---

## Existing constraints

- Colors: `src/index.css` + `.cursor/rules/theme.mdc`.
- Domain product boundaries: `.cursor/rules/domain-boundaries.mdc`.
- BFF reading: [`docs/backend/overview.md`](backend/overview.md). Protos in `../new-hires` win on shape.
