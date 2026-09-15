# Services

Every Connect service under `../new-hires/proto/genius`. Field-level source of truth is the `.proto`. This page is the index.

Shared pagination (`genius.common.v1`): `PageRequest` is `pageSize` + `pageToken`. `PageResponse` is `nextPageToken` + `totalSize`. There is no offset and no sort field. Services that omit `PageRequest` are not paged. Filtering exists only where a request message has a filter field. Sorting is **Unknown / Needs Verification** on every list.

Auth: every RPC except `Auth.Login` and `Auth.RefreshToken` uses the bearer interceptor. `Auth.Register` exists in the proto and is documented as disabled.

Durability notes are from the architecture-index maturity table, not a live check.

## Auth — `genius.auth.v1.Auth`

`Register`, `Login`, `RefreshToken`, `Logout`, `GetSession`, `ChangePassword`. See [authentication.md](authentication.md). Durable.

## IAM

`genius.iam.v1`. Durable (same store as auth, per the architecture index).

| Service | RPCs |
| --- | --- |
| `Organizations` | `GetOrganization`, `UpdateOrganization` (`name`, `timezone`, `defaultCurrency`) |
| `Users` | `InviteUser`, `ListUsers` (page), `GetUser`, `UpdateUser` (`displayName`, `active`), `DeactivateUser` |
| `Roles` | `ListRoles`, `CreateRole`, `UpdateRole` (permissions are a full replacement), `DeleteRole` (`force`), `GetResourceTree`, `SetUserRoles`, `GrantResourceAccess`, `RevokeResourceAccess`, `GrantPaths`, `RevokePaths` |

`User.roles` are org role ids. `Organization` has no list RPC. The session org is the only org the client can read. See [authorization.md](authorization.md).

## Overview — `genius.overview.v1.Overview`

| RPC | Kind |
| --- | --- |
| `GetOverview` | Unary `OverviewSnapshot` |
| `WatchOverview` | Server stream of the same snapshot. Request has `intervalSeconds` |

Snapshot: KPIs (`eventsToday`, `decisionsCaptured`, `activeWorkItems`, `pendingApprovals`), recent decisions, recent work items, agents, pending approvals, one `highlightedPipeline`. It embeds other domains’ messages. If those domains are mocks, the overview is a mock aggregate. **Unknown / Needs Verification** which snapshot fields are live.

## Workflows — `genius.workflows.v1.ProductWorkflows`

See [workflows.md](workflows.md). Durable.

## Runtime — `genius.runtime.v1`

`RuntimeActions`, `RuntimeWorkflows`. See [runtime.md](runtime.md). Durable catalog and runs. `SubscribeBuildEvents` is a documented stub.

## Work items — `genius.workitems.v1.WorkItems`

| RPC | Notes |
| --- | --- |
| `GetWorkItem` | By `id` |
| `ListWorkItems` | Filter `state`. Page. State `UNSPECIFIED` as “all” is **Unknown / Needs Verification** |
| `CreateWorkItem` | `title`, `kind`, `decisionId`, `productWorkflowId`, `owner` |
| `UpdateWorkItem` | `title`, `state`, `owner`, `currentStepLabel` |
| `GetWorkItemStats` | `active`, `running`, `blocked`, `completedToday` |

`WorkItemKind`: `HUMAN`, `AI`, `WORKFLOW`, `HUMAN_AI`. `WorkItemState`: `QUEUED`, `RUNNING`, `BLOCKED`, `DONE`, `FAILED`.

Not in the maturity table. Do not assume durable. Links: `decisionId`, `productWorkflowId`. This is not a runtime action.

## Agents — `genius.agents.v1.Agents`

`ListAgents` (page), `GetAgent`, `UpdateAgent`, `GetAgentLoad`, `WatchAgentFleet` (server stream, empty request).

`AgentHealth`: `HEALTHY`, `DEGRADED`, `OFFLINE`. `config` is a `Struct`. In-memory mock.

## Approvals — `genius.approvals.v1`

| Service | RPCs |
| --- | --- |
| `Approvals` | `ListPendingApprovals` (page), `GetApproval`, `DecideApproval` (`APPROVE` or `REJECT`, optional `note`), `ListApprovalHistory` (page), `GetApprovalStats` |
| `Policies` | `ListApprovalPolicies`, `SetApprovalPolicyEnabled`, `UpsertApprovalPolicy` (empty `id` creates) |

`Approval` links `agentId`, `policyRuleId`, `workItemId`. In-memory mock.

## Decisions — `genius.decisions.v1.Decisions`

`GetDecision`, `ListDecisions` (filter `category`, `status`, page), `ConfirmDecision`, `RejectDecision` (`reason`), `GetDecisionStats`.

`DecisionStatus`: `PROPOSED`, `CONFIRMED`, `REJECTED`, `SUPERSEDED`. `attributes` is a `Struct`. `sourceEventId` links to the bus. In-memory mock. No create RPC. **Unknown / Needs Verification** how a proposed decision is inserted.

## Connectors — `genius.connectors.v1.Connectors`

`ListConnectors` (page), `GetConnector`, `EnableConnector`, `DisableConnector`, `UpsertConnectorConfig`, `BeginConnectorAuth` (`redirectUri` → `authorizationUrl`, `state`), `CompleteConnectorAuth` (`state`, `code`).

`ConnectorStatus`: `CONNECTED`, `DISCONNECTED`, `DEGRADED`. `config` is a `Struct`. In-memory mock. OAuth2 credential helpers are called out of scope in the architecture index. Do not assume the auth URL flow is live.

## Credentials — `genius.credentials.v1.Credentials`

`CreateCredential`, `ListCredentials` (page), `GetCredential`, `DeleteCredential`.

`CredentialType`: `HTTP_HEADER`, `BEARER`, `BASIC`, `OAUTH2`. Create takes `secret` as `map<string, string>` and must not echo it. Get/list return a redacted `Credential`. Durable. AES-GCM at rest is a server concern.

## Bus — `genius.bus.v1`

| Service | RPCs |
| --- | --- |
| `EventBus` | `PublishEvent`, `GetEvent`, `ListEvents` (filter `type`, `origin`, `correlationId`, page), `SubscribeEvents` (server stream, `typePrefix`, `correlationId`), `GetEventChain` |
| `EventRules` | `CreateEventRule`, `UpdateEventRule`, `DeleteEventRule`, `GetEventRule`, `ListEventRules` (page), `SetEventRuleEnabled` |

`EventOrigin`: `EXTERNAL`, `INTERNAL`. `EventRuleWhenKind`: `DECISION`, `WORK_ITEM`, `EVENT`. `orgId` on a rule is set from auth and is read-only. Clients do not connect to NATS. Mock vs as-built conflict: see [overview.md](overview.md). Deep CEL rules are documented as not yet built.

Webhook ingress is HTTP `POST /hooks/v1/{path}`, not a Connect RPC.

## Settings — `genius.settings.v1.Settings`

`GetEngineSettings`, `UpdateEngineSettings`, `GetNotificationSettings`, `UpdateNotificationSettings`.

Engine flags: `autoExtractDecisions`, `autoPlanExecution`, `autoStartWorkflows`, `riskDetection`, `defaultModel`, `minConfidenceAutoExecute`, `scheduledJobs`. Notification `kind` is a string (`email`, `slack`, `push`, `whatsapp`, …), not an enum. Not in the durable list. Schedule triggers are palette-only in the maturity table. Do not treat `scheduledJobs` as a working scheduler.

## Workforce — `genius.workforce.v1`

| Service | RPCs |
| --- | --- |
| `Departments` | List, Get, Create, Update |
| `Positions` | List, Get, Create, Update, `AssignPosition`, `ListPositionAssignments` |
| `Actors` | List, Get, Create, Update, `PauseActor`, `ResumeActor` |
| `RoleContracts` | List, Get, `GetRoleContractByPosition`, `SaveRoleContractDraft`, `PublishRoleContract` |

No `PageRequest` on these lists. `state` on department/position/actor/contract is a string, not an enum. Allowed values are **Unknown / Needs Verification**.

`Actor.userId` must be a user in the same org or omitted. A foreign-key error means invite first (workforce foundations doc).

`RoleContract` has a current version and draft/publish. `authority` and `escalation` are `Struct`. `performance` is `ListValue`. Responsibilities include `autonomyLevel`, `workType`, `verificationPolicy`. This is the org chart and role-contract API, not `genius.iam.v1.Roles`.

Not listed in the architecture-index durability table. Persistence is **Unknown / Needs Verification**.

## Common — `genius.common.v1`

No service. `PageRequest` and `PageResponse` only.
