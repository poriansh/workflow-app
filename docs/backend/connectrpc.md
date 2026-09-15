# ConnectRPC

Sources: `../new-hires/docs/bff-connect-client.md`, `../new-hires/buf.yaml`, `../new-hires/buf.gen.yaml`.

## Packages the frontend needs

Installed in `genius-web`:

- `@bufbuild/protobuf`
- `@connectrpc/connect`
- `@connectrpc/connect-web`
- dev: `@bufbuild/buf`, `@bufbuild/protoc-gen-es`

Do not add Axios for BFF calls.

## Generate

Contracts live in `../new-hires/proto`. Config: `buf.yaml` (module root `proto/`), `buf.gen.yaml` (plugin `protoc-gen-es`, `target=ts`, `import_extension=.js`, default `out: src/gen` relative to the hire pack).

Prefer generating into this app’s API boundary:

```text
genius-web/src/gen/
```

Keep `buf.yaml` next to `proto/`. Either point `out` at this app or copy the hire pack’s `src/gen`. Do not edit generated files. Do not commit a hand-written clone of a service client.

Well-known types (`google.protobuf.Timestamp`, `Struct`, `ListValue`) need `buf dep update` before generate. That dependency is already locked in `../new-hires/buf.lock`.

## Call

**Current implementation / project standard:** one shared transport owns the BFF base URL and app-wide interceptors:

```ts
// src/infrastructure/config/transport.ts
import { createConnectTransport } from "@connectrpc/connect-web"
import { authInterceptor } from "../auth/authInterceptor.ts"

export const transport = createConnectTransport({
  baseUrl: import.meta.env.VITE_GENIUS_API_URL ?? "http://localhost:8090",
  interceptors: [authInterceptor],
})
```

Every service client reuses that export:

```ts
// e.g. src/infrastructure/auth/authClient.ts
import { createClient } from "@connectrpc/connect"
import { Auth } from "../../gen/genius/auth/v1/auth_pb.ts"
import { transport } from "../config/transport.ts"

export const authClient = createClient(Auth, transport)
```

```ts
// ❌ BAD — second transport / hardcoded URL in a feature client
const transport = createConnectTransport({ baseUrl: "http://localhost:8090" })
```

`authInterceptor` attaches `Authorization: Bearer` except on `Auth.Login` and `Auth.RefreshToken`, refreshes once on `unauthenticated`, then retries. Refresh uses a bare transport so it does not re-enter the interceptor.

Procedure paths look like `/genius.workflows.v1.ProductWorkflows/StartRun`. That path is what the generated client calls. Do not `fetch` it.

JSON field names are protojson camelCase: `fromNode`, `accessToken`, `runtimeDefId`. Protobuf source uses snake_case. Generated TypeScript follows the codegen, which matches camelCase JSON.

## Generated artifacts

Examples after generate:

- `src/gen/genius/auth/v1/auth_pb.ts`
- `src/gen/genius/workflows/v1/workflows_pb.ts`

Each file has message types, enums, and a service descriptor. `createClient(Service, transport)` is the client. Import the service from the generated `_pb` file, not from a handwritten wrapper that re-declares RPCs.

## Protobuf semantics the UI must not flatten incorrectly

- Proto3 scalars have no presence unless marked `optional`. These protos do not use `optional`. Empty string, `0`, and `false` are the same on the wire as “unset” for scalars. Server notes that matter: `UpdateWorkflow` applies `triggerSummary` when non-empty, and replaces `nodes` / `edges` only when the arrays are non-empty.
- Enum `0` is `*_UNSPECIFIED`. Do not treat it as a real status.
- `repeated` is an array. An empty array is not null.
- `google.protobuf.Struct` and `Timestamp` are messages. They can be absent. `Struct` is dynamic JSON. Keep it at the boundary. Do not type it as `any` in feature code. Parse it against the handler schema from `ListNodeHandlers` / `RuntimeAction.inputSchema`.
- `map<string, Struct>` (pins, pinned outputs) is a string-keyed object of JSON objects.
- Timestamps serialize as RFC 3339 strings in Connect JSON.

## Where types live

Generated types stay in `src/gen` and in infrastructure adapters. Feature components should take a frontend model (stable node id, title, handler, config object) when the screen should not depend on protobuf enums. Map at the service boundary. Do not import `*_pb` from a presentational component.

## Streaming

Server-stream RPCs return an async iterable on the Connect-ES client. Pass an `AbortSignal` and stop on unmount. They are not a single `useQuery` result. The list is in [frontend-integration.md](frontend-integration.md).

Reconnect behavior is **Unknown / Needs Verification**. The Workforce OS goal says to treat watch/stream events as updates to a projection and reconcile with the authoritative get/list RPC. That is the safe frontend rule until the BFF documents resume tokens. These streams have no resume field in the protos.
