# Runtime

Sources: `../new-hires/proto/genius/runtime/v1/runtime.proto`, architecture index, GUI guide §6, workflow debug doc.

`genius.runtime.v1` is a thin BFF adapter over lunaya-flow-runtime. Comments in the proto say full fidelity stays in internal `genai.*` types. Some payloads are an opaque `Struct` (`detail`). Do not invent fields inside `detail`.

The runtime API is cluster-internal. The browser uses only this proxy.

## RuntimeActions

Permission: `runtime.manage`.

| RPC | Notes |
| --- | --- |
| `ListActions` | Catalog. No pagination fields on the request. |
| `GetAction` | By `name` |
| `BuildAction` | `gitUrl`, `branch` → `BuildStatus` |
| `DeleteAction` | By `name` |
| `SubscribeBuildEvents` | Server stream of `ActionBuildEvent`. Architecture index: stub toward NATS. Do not treat the stream as a complete build log. |

`RuntimeAction`: `name`, `gitUrl`, `branch`, `description`, `imageRef`, `buildStatus`, `inputSchema`, `outputSchema`, `packagePath`.

`BuildStatus`: `UNSPECIFIED`, `ACCEPTED`, `READY`, `FAILED`.

Node `handler` for a catalog action must equal `RuntimeAction.name`. Bindings map to `inputSchema`. `fromStep.path` must address the upstream `outputSchema`.

Product workflow RPCs do not build images. Palette builtins come from `ListNodeHandlers`. Custom packages come from this service.

## RuntimeWorkflows

Permission for `DebugRun`: `runtime.manage`. Other methods are not given a separate permission in the docs. Assume the same runtime permission until verified. **Unknown / Needs Verification.**

| RPC | Notes |
| --- | --- |
| `CreateWorkflowDef` | `name`, `description`, `body` as `Struct` (“steps/bindings as JSON until shared types land”) |
| `GetWorkflowDef` | `id` and/or `name` |
| `ListWorkflowDefs` | No pagination |
| `StartWorkflowRun` | `defId` or `defName`. This is not the product `StartRun`. |
| `GetWorkflowRun` | By run id. `detail` is opaque. |
| `DebugRun` | Server stream. `stopAfterStepId` empty means full DAG. Set means ancestor closure, then finish. `pinnedOutputs` skips container invoke for those steps. |
| `ListReadySteps` | Opaque `detail`. Documented as advanced / future step-through. |

`RuntimeRunStatus`: `UNSPECIFIED`, `CREATED`, `RUNNING`, `FINISHED`, `FAILED`. Same names as product run status, different enum. Do not mix the two types in one switch without a boundary.

## How product publish uses the runtime

`PublishWorkflow` compiles the canvas and creates a runtime def, then stores `runtimeDefId` and sets `PUBLISHED`. The UI should call `PublishWorkflow`, not `CreateWorkflowDef`, for a canvas publish.

`ExecuteToNode` creates an ephemeral def and does not change `runtimeDefId` or publish state. Debug execution uses the daemon container path, not Argo. Missing action images fail the invoke. `BuildAction` must have succeeded first for non-builtin images.

`StartRun` on the product service needs a `runtimeDefId` and then runs via Argo. Poll `GetRun` / `ListRuns`. Those refresh status from the runtime. There is no product run-event stream. Do not subscribe to `DebugRun` to watch a published Argo run.

## Opaque detail

`RuntimeWorkflowDefDetail.detail`, `RuntimeWorkflowRunDetail.detail`, and `ListReadyStepsResponse.detail` are `Struct` with the comment “opaque”. Render them as JSON for an ops screen, or ignore them. Do not invent `steps[]` on those messages.
