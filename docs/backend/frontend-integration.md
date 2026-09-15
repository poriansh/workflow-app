# Frontend integration

How a React screen in `genius-web` should call the BFF. Contracts: [connectrpc.md](connectrpc.md) and [services.md](services.md). Placement: `docs/architecture.md`.

**Current implementation:** Login is wired. `QueryProvider` is mounted. Connect clients are generated in `src/gen`. Shared transport: `infrastructure/config/transport.ts`. Auth client: `infrastructure/auth/authClient.ts` (`createClient(Auth, transport)`). Other screens in this file are standards, not built screens.

**Standard:** Before a new BFF call, read this folder and the matching `../new-hires` proto. Reuse `transport` from `infrastructure/config/transport.ts`. Add a thin `createClient(Service, transport)` module under `infrastructure/` (same pattern as `authClient`). Do not invent RPCs, fields, or URLs. Do not add REST or Axios for BFF calls. Do not create a second `createConnectTransport` for normal clients.

## Boundary

```text
page / component
  feature hook (useQuery / useMutation / stream subscription)
    feature service (maps protobuf ↔ view model)
      infrastructure client (createClient(Service, transport))
        infrastructure/config/transport.ts
          BFF
```

Components do not import `src/gen` or `createConnectTransport`. They do not build `Authorization` headers.

Generated files live in `src/gen` after Buf. Never edit them.

## Query vs mutation vs stream

Use the RPC shape, not one wrapper for every method.

| RPC shape | React |
| --- | --- |
| Unary read (`Get*`, `List*`, `GetSession`, `GetOverview`, `PreviewCompile`, `ResolveNodeBindings`, `ListNodeHandlers`) | `useQuery` |
| Unary write (`Create*`, `Update*`, `Delete*`, `Publish*`, `Decide*`, `Login`, `Logout`) | `useMutation` |
| Paged list (`PageRequest` / `nextPageToken`) | `useInfiniteQuery`. `pageParam` is the page token. Stop when `nextPageToken` is empty |
| Server stream | Async iteration on the generated client, cancelled with `AbortSignal`. Not `useQuery` |

Lists without `PageRequest` (`ListActions`, `ListRoles`, workforce lists, `ListNodeHandlers`) are a single `useQuery`. Do not invent pages.

There is no sort field. Do not send `orderBy`. Client-side sort of one page is a UI choice and must be labeled as such. It is not a sorted backend query.

Filter only with fields that exist (`ListWorkItems.state`, `ListDecisions.category` and `status`, `ListEvents.type`, `origin`, `correlationId`, `ListRuns.workflowId`). Do not add a generic filter object.

## Query keys

Frontend convention, not a proto field. Keep keys stable and specific:

```text
['genius', service, method, args]
```

Examples: `['genius', 'ProductWorkflows', 'get', id]`, `['genius', 'ProductWorkflows', 'list', { pageToken }]`.

Invalidate the get and the list for that service after a mutation that changes them. Do not invalidate every query on every success. Do not refetch a stream by invalidating a query.

`staleTime`: **Unknown / Needs Verification** as a product requirement. Prefer refetch-on-focus for durable reads (workflows, credentials, IAM). For documented mocks, a short `staleTime` is enough. Do not cache secrets.

## Optimistic updates

Not documented. Do not optimistic-update. Success UI waits for the unary response or for a stream event that says the step finished. `StartRun` returns a run in `CREATED` or similar. Show that status. Poll `GetRun` until `FINISHED` or `FAILED`. There is no product run stream.

## Streams

| RPC | What it streams | When to use | Query interaction |
| --- | --- | --- | --- |
| `ProductWorkflows.ExecuteToNode` | Debug events for one node and its ancestors | Canvas “run to here”. Does not publish | Local execution state for that session. Optionally invalidate `GetRun` only if a product run id is returned and a get exists. Ephemeral def does not replace `runtimeDefId` |
| `RuntimeWorkflows.DebugRun` | Runtime debug events | Ops surface. Needs `runtime.manage` | Same. Do not use this for a normal canvas publish |
| `RuntimeActions.SubscribeBuildEvents` | Build events | Ops, and only if the stub is acceptable | Reconcile with `GetAction`. The stream is a documented stub |
| `Overview.WatchOverview` | Full snapshots on an interval | Live overview. `intervalSeconds` is the server hint | Seed or replace overview query data from the latest snapshot. On stream end, `GetOverview` |
| `Agents.WatchAgentFleet` | Fleet snapshots | Agent fleet screen | Same pattern against `ListAgents` / load |
| `EventBus.SubscribeEvents` | `BusEvent` filtered by prefix and correlation id | Live bus. Mock vs durable is unverified | Append to local stream state. Reconcile with `ListEvents` |

Lifecycle:

- Start the stream in an effect or a dedicated hook owned by the screen that needs it.
- Pass `AbortSignal`. Abort on unmount and when `workflowId` / `nodeId` / filters change.
- Do not reconnect in a tight loop. Resume tokens are not in the protos. Reconnect policy is **Unknown / Needs Verification**. After a drop, call the matching get/list once, then decide whether to subscribe again.
- `pinnedOutputs` values must be JSON objects.

## Auth in the UI

See [authentication.md](authentication.md).

- Login and refresh run outside the bearer interceptor.
- Access and refresh tokens are client secrets, not server-state query data. Do not put them in the query cache.
- `GetSession` may be a `useQuery` enabled only when an access token exists.
- On `unauthenticated`, refresh once and retry that call. If refresh fails, clear tokens and show login. Do not drop an unsubmitted form draft.

Login is composed only from `src/app/routes/index.tsx` at `/login` (lazy default export + Suspense `LoadingPage`). Do not redirect to a screen that does not exist. There is no `/` → `/login` redirect today; `/` matches `*` and shows `NotFoundPage`. The not-found action currently links to `/`. Other routes, when added, check `Session.permissions` and still handle `permission_denied`. See [authorization.md](authorization.md).

Expected `ConnectError` values stay in the feature (login shows a form alert). They are not React render errors. The app error boundary does not replace that handling.

## Forms

React Hook Form holds form state. Zod validates what the docs and proto require, for example a non-empty workflow `name` for create, HttpRequest `method` and `url` before publish, branch edge `label`.

Login uses `zodResolver` from `@hookform/resolvers/zod`. Use that integration. Do not write a custom resolver unless the stock one cannot do the job.

Do not copy an entire unpublished ruleset into Zod. Publish still validates on the server. Show the server message on the node or field when it identifies one. The error envelope for field errors is **Unknown / Needs Verification** ([errors.md](errors.md)).

Handler config is a `Struct` whose shape comes from `inputSchema` / `outputSchema`. A schema for one handler is not a schema for every node. Do not build one giant workflow Zod object that pretends every handler has the same config.

## Workflow UI mapping

| UI | Backend |
| --- | --- |
| Palette | `ListNodeHandlers` |
| Canvas nodes and edges | `ProductWorkflow.nodes` / `edges` |
| Data wire | `config.bindings`, not an extra edge type |
| Save | `CreateWorkflow` or `UpdateWorkflow` (remember empty-array replace rules) |
| Rename | `RenameWorkflow` |
| Publish | `PublishWorkflow` |
| Production run | `StartRun`, then poll `GetRun` |
| History | `ListRuns` |
| Debug | `ExecuteToNode` stream, `PreviewCompile`, `ResolveNodeBindings` |
| Stats | `GetWorkflowStats` |
| Custom action ops | `RuntimeActions`, not the canvas save path |

Node execution state during debug comes from stream events (`stepStatus`, `output`, `error`, `pinned`), keyed by `nodeId`. Do not store that map in Zustand as server state. Component state or a query-cache patch for that run id is enough, and it dies with the session.

## What not to build

- A REST client over Connect paths
- A generic `useRequest` that hides stream versus unary
- Version history for workflows
- A second workflow executor
- Signup on `Auth.Register`
- Sorting query params
- A global Zod folder
