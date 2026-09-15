# Backend overview (frontend reading)

Source of truth is the sibling briefing pack `../new-hires`, not this file.

Read in this order:

1. `../new-hires/docs/bff-connect-client.md`
2. `../new-hires/proto/genius/**/*.proto`
3. `../new-hires/docs/architecture-and-design-genai-lunaya-flow/index.md`
4. `../new-hires/docs/architecture-and-design-genai-lunaya-flow/product-workflows-actions-bff-gui-integration-guide.md`

If a prose doc and a `.proto` disagree on request or response shape, follow the proto and note the conflict. Product meaning still comes from the docs.

This app does not contain the BFF or the runtime. It will call a ConnectRPC BFF.

| Concern | Where it is documented here |
| --- | --- |
| System split | [architecture.md](architecture.md) |
| Auth | [authentication.md](authentication.md) |
| Permissions | [authorization.md](authorization.md) |
| Transport and codegen | [connectrpc.md](connectrpc.md) |
| Every service | [services.md](services.md) |
| Canvas | [workflows.md](workflows.md) |
| Runtime proxy | [runtime.md](runtime.md) |
| Errors | [errors.md](errors.md) |
| React mapping | [frontend-integration.md](frontend-integration.md) |

## What the frontend is talking to

The browser talks only to the BFF (`genius.*` Connect services). It does not talk to NATS, Argo, or the runtime daemon.

Documented endpoints:

- Staging BFF: `https://web.geniusai.io`
- Local BFF: `http://localhost:8090` (`VITE_GENIUS_API_URL`)
- Browser protocol: Connect JSON over HTTP/1.1 (`@connectrpc/connect-web`), not raw gRPC

`genius-web` has `@connectrpc/connect`, `@connectrpc/connect-web`, and `@bufbuild/protobuf`. Generated clients live in `src/gen` (`npm run generate` from `../new-hires`). Do not hand-roll HTTP to Connect paths. Do not edit `src/gen`.

## Maturity (from the architecture index, not re-verified against a live BFF)

| Area | Stated state |
| --- | --- |
| Auth, IAM, product workflows, credentials | Durable |
| Runtime defs, runs, action catalog | Durable |
| Decisions, agents, approvals, connectors, event bus | In-memory mock |
| Schedule / webhook triggers | Palette only in the maturity table |
| `SubscribeBuildEvents` → NATS | Stub |

The webhooks doc says webhook ingress and EventRules are as-built. The Workforce OS goal says end-to-end webhook routing is unverified until a staging test proves it. Treat webhook and bus durability as **Unknown / Needs Verification** before building production UX on them.

## Do not merge these names

- **Product workflow** (`ProductWorkflows`): the canvas the UI owns.
- **Runtime action** (`RuntimeActions`): an executable handler package.
- **Work item** (`WorkItems`): an accepted business obligation.

Folder names `admin`, `agent`, `member`, `reseller` in this app are UI areas. They are not BFF services and not IAM roles.
