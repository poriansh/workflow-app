# Errors

## What the briefing pack actually specifies

`../new-hires/docs/bff-connect-client.md` specifies one code:

- Connect code `unauthenticated` (also described as `Unauthenticated`).
- Response: `refreshToken` once and retry once, or send the user to login.
- Do not retry forever.

The GUI guide says publish can fail for invalid bindings, missing branch labels, an empty executable graph, missing `method`/`url` on HttpRequest, and edges that use `from`/`to` instead of `fromNode`/`toNode`. It says to show those errors on the offending nodes. The proto does not define a field-error message. How the BFF attaches node ids to a Connect error is **Unknown / Needs Verification**.

## What is proposed, not an as-built envelope

Workforce OS goal §17.4 asks for stable reason codes, a safe message, correlation id, retryability, and field details. It says to match concrete Connect codes to a protobuf error envelope in P0. That envelope is not in `proto/genius`. Do not invent `ErrorDetail` messages or parse a custom trailer until it exists in a proto.

Until then, use the Connect error the client throws:

- `code` (Connect error code string)
- `message` (raw message; do not show stack traces or secrets)
- `metadata` if present

Do not build a giant mapper with a case for every code. Map only codes the product docs name, and show a generic failure otherwise.

## Codes to handle when they appear

| Code | Documented? | Frontend |
| --- | --- | --- |
| `unauthenticated` | Yes | Refresh once and retry, or login. Keep an unsubmitted local draft if the user was editing. Do not clear the canvas draft before refresh fails. |
| `permission_denied` | Implied by RBAC docs, not named as a Connect code in the BFF client guide | Explain that the action is not allowed. Do not reveal the hidden record. |
| `not_found` | Not named | Show not-found. Do not guess an id. |
| `invalid_argument` | Not named. Publish validation is described in prose. | If the message identifies a node or field, show it there. Do not retry without a change. |
| `already_exists` / `aborted` / `failed_precondition` | Not named | **Unknown / Needs Verification.** Do not optimistic-retry a mutation. |
| `resource_exhausted` | Not named | **Unknown / Needs Verification.** No rate-limit contract in the protos. |
| `unavailable` / `deadline_exceeded` | Not named | Safe to refetch a query. Do not blindly replay a mutation. |
| `internal` / `unknown` | Not named | Generic failure. Do not show internals. |

Connect’s standard code list is larger than this table. Absence from this table means the briefing pack does not define UI behavior for that code.

## Mutations

The Workforce OS goal says a success state appears only after server confirmation or an explicitly labeled accepted job. None of the `genius.*` RPCs document an accepted-but-not-done mutation except streams (`ExecuteToNode`, `DebugRun`, `SubscribeBuildEvents`). Do not optimistic-update a list and then hope the server agrees.

`UpdateWorkflow` is not a conflict-token API. There is no version or etag field. Concurrent editors are **Unknown / Needs Verification**. Last write wins is not documented. Do not invent `If-Match`.

## Credentials

`CreateCredential` accepts `secret` and must not echo it. Never put secret material in an error toast, a log, or a published graph.
