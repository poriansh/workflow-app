# Workflows

Sources: `../new-hires/proto/genius/workflows/v1/workflows.proto`, the GUI integration guide, and `workflow-debug-execute-to-node.md`.

Service: `genius.workflows.v1.ProductWorkflows`.

This is the API for a workflow canvas. It is not `WorkItems` and not `RuntimeActions`.

## Graph

`ProductWorkflow`: `id`, `name`, `triggerSummary`, `nodes`, `edges`, `runtimeDefId`, `state`, `stats`, `updatedAt`.

`WorkflowNode`:

| Field | Meaning |
| --- | --- |
| `id` | Stable canvas id. Becomes the runtime step id. Must stay stable across edits or bindings break. |
| `kind` | See enum below |
| `title` | Display name |
| `handler` | Palette or action name (`HttpRequest`, `Set`, `Branch`, `manual`, `end`, …) |
| `config` | `Struct`. Handler fields plus optional `bindings` |

`WorkflowEdge`: `fromNode`, `toNode`, `label`. Not `from` / `to`. Empty `label` means unconditional. Branch arms require a label (`true`, `false`, or a switch case id).

`NodeKind`: `UNSPECIFIED`, `TRIGGER`, `CONDITION`, `AI`, `HUMAN`, `APPROVAL`, `ACTION`, `END`, `BRANCH`.

`WorkflowPublishState`: `UNSPECIFIED`, `DRAFT`, `PUBLISHED`.

`ProductRunStatus`: `UNSPECIFIED`, `CREATED`, `RUNNING`, `FINISHED`, `FAILED`.

Create starts as `DRAFT` with an empty `runtimeDefId`. Duplicate creates a new id, stays draft, and clears `runtimeDefId`.

## RPCs

| RPC | Kind | Use |
| --- | --- | --- |
| `ListNodeHandlers` | Unary | Palette. `inputSchema` / `outputSchema` are `Struct` |
| `CreateWorkflow` | Unary | New draft |
| `GetWorkflow` | Unary | Full graph |
| `ListWorkflows` | Unary | `PageRequest` |
| `UpdateWorkflow` | Unary | See replace rules |
| `RenameWorkflow` | Unary | `id`, `name`. Not update |
| `DuplicateWorkflow` | Unary | `id`, optional `name` |
| `DeleteWorkflow` | Unary | |
| `PublishWorkflow` | Unary | Compile, set `runtimeDefId`, `PUBLISHED`. Needs `workflows.publish` |
| `GetWorkflowStats` | Unary | `runs`, `active`, `successPercent` |
| `BindRuntimeDef` | Unary | Manual link. Not a version list |
| `StartRun` | Unary | Needs `runtimeDefId`. Returns `ProductWorkflowRun` |
| `GetRun` / `ListRuns` | Unary | Status refreshed from runtime. List is paged by `workflowId` |
| `PreviewCompile` | Unary | Compile only. No def, no publish |
| `ExecuteToNode` | Server stream | Run-to-here without publish. Needs `workflows.edit` |
| `ResolveNodeBindings` | Unary | Dry-resolve one node input. No containers |

`UpdateWorkflow`: `id` required. `triggerSummary` applied when non-empty. `nodes` and `edges` replaced only when the arrays are non-empty. A save that sends empty arrays does not clear the graph.

`ListNodeHandlers` in the proto: `handler`, `kind`, `title`, `group`, `description`, `executable`, `inputSchema`, `outputSchema`. Field 6 is reserved (`config_schema_json`). The GUI guide still says `configSchemaJson`. Follow the proto: use `inputSchema` and `outputSchema`. A stringified config schema is **not** on this message.

## Bindings

Edges order steps. Bindings move data.

Store bindings on the **downstream** node at `config.bindings`:

```json
{ "param": "items", "fromStep": "filter", "path": "items" }
{ "param": "a", "literal": 2 }
```

- `param` is required and must match an input-schema property.
- Exactly one of `literal`, `fromStep`, or nested `source`.
- `fromStep` is an upstream node id.
- `path` is a JSON pointer into that step’s output. Leading `/` is optional. `""` or `"/"` is the whole output.
- Non-binding config keys (`url`, `method`, …) compile to literal bindings. Explicit `bindings` win on the same `param`.
- File, secret, and context binding sources are rejected by the engine. GUI phase-1 is literal and `fromStep` only.
- `credentialId` may sit in config. Publish resolves the secret and strips `credentialId`. The secret never comes back to the client.

Compile skips `TRIGGER` and `END` and non-executable handlers. At least one executable node (`ACTION`, `BRANCH`, or `AI` with a known handler) is required to publish. Branch mode is `if` or `switch`. Every outgoing branch edge needs a label.

HttpRequest publish validation: `config.method` and `config.url` required.

## Debug versus production run

| | `ExecuteToNode` | `PublishWorkflow` + `StartRun` |
| --- | --- | --- |
| Publish state | Unchanged | Sets `PUBLISHED` and `runtimeDefId` |
| Engine | Ephemeral def, daemon containers | Argo |
| Authz | `workflows.edit` | Publish needs `workflows.publish`, then edit to start |
| Result | Stream of `ExecuteToNodeEvent` | Unary run, then poll `GetRun` |
| Pins | `pinnedOutputs` keyed by node id, values must be JSON objects | Not on `StartRun` |

`ExecuteToNode` runs the ancestor closure of `nodeId` (depends-on plus `fromStep`), then stops. Downstream and sibling branches outside that closure do not run. Triggers and end nodes are rejected as `nodeId`.

Stream fields: `kind`, `runId`, `runtimeDefId`, `nodeId`, `stepId`, `stepName`, `action`, `stepStatus`, `output`, `error`, `pinned`. Example `kind`: `DEBUG_RUN_EVENT_KIND_STEP_FINISHED`. The proto types `kind` as a string, not an enum. Do not invent missing kind values. **Unknown / Needs Verification:** the full set of `kind` strings.

There is no product-run stream. After `StartRun`, poll `GetRun` or `ListRuns`.

## What the canvas can support from this contract

Supported by the API, not yet built in this app:

- Palette from `ListNodeHandlers`
- Graph save via create/update/rename
- Separate control edges and data bindings
- Publish and bind-runtime-def
- Run list and stats
- Preview compile
- Run-to-here stream and binding dry-run

Not in the proto:

- Version history / list of past publishes
- A run-event stream for Argo executions
- Automatic data flow along edges
- Sorting on `ListWorkflows` (only `page_size` and `page_token`)

`NodeKind` includes `CONDITION`, `HUMAN`, and `APPROVAL`. Whether those kinds compile is not fully specified beyond “executable = ACTION, BRANCH, AI with a known handler”. Treat other kinds as non-executable until `ListNodeHandlers.executable` says otherwise.
