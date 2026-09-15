# BFF architecture (frontend view)

Source: `../new-hires/docs/architecture-and-design-genai-lunaya-flow/index.md`. This is not a source audit of the backend repo. Confirm against the engineering repository before treating a claim as production behavior.

## Shape

```text
Browser
  ConnectRPC / HTTPS
    Web BFF (genai-web, :8090)
      JWT interceptor, CORS outermost
      Product stores (auth, IAM, canvas, credentials)
      Runtime proxy (genius.runtime.v1 → GENIUS_RUNTIME_URL)
      Some domains are documented as in-memory mocks
        lunaya-flow-runtime (cluster-internal, not public)
          Argo Workflows for published runs
          NATS JetStream for events and build events
          Harbor for action images
```

The UI never opens a runtime URL or a NATS connection. Clients are observers through Connect.

## Two layers the canvas must keep separate

| Layer | Service | What the UI owns |
| --- | --- | --- |
| Product canvas | `genius.workflows.v1.ProductWorkflows` | Nodes, edges, titles, handler config, publish and product runs |
| Runtime catalog | `genius.runtime.v1.RuntimeActions` and, for ops, `RuntimeWorkflows` | Action packages, schemas, images, builds |

Day-to-day create, update, publish, and start-run stay on `ProductWorkflows` so org ACL, compile, credentials, and stats stay consistent. Direct `RuntimeWorkflows` is an ops/debug surface (`runtime.manage`).

Publish compiles the canvas into a runtime definition, stores `runtimeDefId`, and sets `PUBLISHED`. There is no version-history RPC. Each publish overwrites `runtimeDefId`.

## Edges are not data

An edge is control or dependency (`fromNode`, `toNode`, optional `label`). It does not copy output. Data wiring is `config.bindings` on the downstream node (`fromStep` + `path`, or a literal). See [workflows.md](workflows.md).

## Tenancy

Org scope comes from the JWT `org_id`. Stores are org-scoped. The client must not send another tenant id to impersonate an org. **Unknown / Needs Verification:** whether any RPC accepts an explicit org id that the server ignores.

## Webhook path (not Connect)

Published webhook triggers can be invoked without a JWT:

`POST /hooks/v1/{path}` plus a webhook secret.

That is not a Connect procedure. The canvas still creates and publishes a workflow that has a webhook trigger. Do not call this path with the user access token as if it were `StartRun`.
