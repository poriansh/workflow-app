# Authorization

Sources: `../new-hires/proto/genius/iam/v1/iam.proto`, GUI integration guide §2.3, architecture index security notes, workforce foundations (Casbin session permissions).

The server enforces access. The UI may hide or disable controls from `Session.permissions`. It must not treat a hidden button as the authorization check. A 403-style denial can still happen.

## Model

- Roles belong to an org. `Role.permissions` are dotted ACL paths, for example `workflows.read` or `workflows.{id}.edit` (comment in `iam.proto`).
- `Role.seedKey` is set when the role was seeded (`owner`, `admin`, and others). The full seed list is **Unknown / Needs Verification**.
- `GetResourceTree` returns the ACL catalog: instance-addressable `roots` and non-instance `capabilities` (`iam`, `overview`, and others). Use this for an admin permission picker. Do not hard-code a permission list that the tree can supply.
- `SetUserRoles` accepts role ids or names resolved in-org. Empty clears all roles.
- `GrantPaths` / `RevokePaths` and `GrantResourceAccess` / `RevokeResourceAccess` are the write APIs for extra grants. Exact path grammar beyond the proto comment is **Unknown / Needs Verification**.

Org scope is the JWT `org_id`. Do not add an org switcher that sends a different org id unless a proto field requires it. None of the current list RPCs take an org id.

## Permissions documented per operation

From the GUI guide (workflows and runtime). Other services are not given a complete matrix in the briefing pack.

| Operation | Documented permission |
| --- | --- |
| Create, list workflows, list runs, get run, list node handlers | `workflows.edit` / `workflows.read` “as coded” — the split is **Unknown / Needs Verification** |
| Get, update, rename, duplicate, delete, bind, start run | `workflows.read` or `workflows.edit`; resource `workflow/{id}` also allowed |
| Publish | `workflows.publish` |
| Runtime action build, list, get, delete | `runtime.manage` |
| `ExecuteToNode`, `PreviewCompile`, `ResolveNodeBindings` | `workflows.edit` (not `runtime.manage`) |
| `RuntimeWorkflows.DebugRun` | `runtime.manage` |

Typical roles in the GUI guide: owner/admin can publish and manage runtime; operator can edit without publish; viewer is read-only. Treat that as a product sketch. Enforce from the permission strings on the session, not from those three labels alone.

Workforce foundations also mentions owner/admin Casbin paths including `workforce.manage`, `settings.write`, `workitems.write`, `runtime.manage`. That is not a full catalog.

Architecture index also names `credentials.*` and `workflows.*`. Exact strings for credentials, decisions, agents, and approvals are **Unknown / Needs Verification**.

## Frontend behavior

- After login or `GetSession`, keep `permissions` and `roles` next to the session, not copied into every feature store.
- Hide a control only when the session lacks the documented permission for that action. If the permission string is unknown, show the control and handle the server error. Do not invent a deny.
- Permission roles (owner, workflow designer) are not job titles (Accounts Receivable). Do not use `features/admin` as a stand-in for the `admin` seed role.
- Login is the public route `/login`. Other routes, when added, check `Session.permissions` and still handle `permission_denied`. Do not add a guard that invents permission strings.
- Never reveal the contents of a record the user could not read. A permission-denied state explains that the action is not allowed. It does not fetch the hidden object another way.

## Invite

`Users.InviteUser` is the invite path (`email`, `displayName`, `roles`, `temporaryPassword`). It requires an authenticated caller. Which permission is required is **Unknown / Needs Verification**.
