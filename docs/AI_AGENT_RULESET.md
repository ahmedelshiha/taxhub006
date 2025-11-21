# AI Agent Comprehensive Ruleset — Full Project Repair Guidelines
### Version: 2.0 (Expanded)
### Purpose: A complete, persistent knowledge base containing **all guidelines, rules, insights, decisions, and reasoning** collected from the entire AI agent development journey.  
This file ensures consistent execution, prevents overthinking, and minimizes credit usage.

---

# 1. Mandatory Workflow Execution Order
The agent must **always** execute fixes in this sequence:

1. **Fix Prisma Schema mismatches**  
2. Generate migration → regenerate Prisma Client  
3. Update all API handler signatures to match middleware  
4. Fix incorrect context destructuring (`user`, `tenantId`, `params`)  
5. Fix enum value mismatches (casing & typing)  
6. Fix hooks response parsing (`response.json()` only)  
7. Resolve missing modules / missing exports  
8. Fix UI components expecting non‑existent model fields  
9. Validate build after each phase  

❗ **Never change this order**  
❗ **Never skip schema-related fixes**

---

# 2. Prisma Schema Rules
All model fields referenced in the frontend or backend must exist in Prisma schema.

### Required fields based on full analysis:
#### Document Model
- `url? : String`

#### Task Model
- `tags? : String[]`
- `estimatedHours? : Int`
- `clientId? : String`
- `bookingId? : String`
- `client   : Client? @relation(fields: [clientId], references: [id])`
- `booking  : Booking? @relation(fields: [bookingId], references: [id])`

#### Booking Model
- `assignedToId? : String`
- `completedAt? : DateTime`
- `amount? : Decimal`
- `rating? : Int`

#### User Model
- `isAdmin : Boolean @default(false)`
- `bio? : String`
- `lastLogin? : DateTime`

#### TeamMember Model
- `image? : String`

#### AuditLog Model (rename rule)
- Replace **resourceType → resource**

#### Attachment Model
- Field should be **uploaderId**, not `uploadedBy`

---

# 3. API Handler Signature Rules
All API route handlers must use the **standardized** signature:

```ts
export const GET = withMiddleware(async (
  request,
  { user, tenantId, params }
) => { ... })
```

### Forbidden:
❌ `context.params.user`  
❌ `context.params.tenantId`  
❌ Handler receiving only two arguments  

### Required:
✔ Uniform signature across all 40+ API routes  
✔ Same pattern for GET, POST, PUT, DELETE  

---

# 4. Enum Rules
Enums must match Prisma‑generated values:

### ServiceStatus:
- MUST use lowercase if Prisma uses lowercase  
- e.g. `"active"` not `"ACTIVE"`

### ApprovalPriority:
- MUST use uppercase  
- e.g. `ApprovalPriority.LOW` not `"low"`

### General Rule:
Never write enum values as raw strings unless schema explicitly defines them as such.

---

# 5. Response Handling Rules (Hooks)
Hooks must **never** assume fetch responses contain `.data`.

Correct pattern:

```ts
const json = await response.json() as SomeType
```

### Hooks that must follow this:
- `useApprovals`
- `useNotifications`
- `useTeamMembers`

### Required:
Hooks must export:
- Response interfaces
- Filter interfaces
- Return types

---

# 6. Zod Validation Rules
API errors must be thrown as readable strings.

### Allowed:
```ts
throw new ApiError(
  issues.map(i => i.message).join(", ")
)
```

### Not Allowed:
```ts
throw new ApiError(issues) // ❌
```

---

# 7. Missing Modules & Missing Exports
Modules that must always exist:

- `web-vitals`
- `src/lib/database/prisma.ts`
- `src/lib/performance/performance-analytics.ts`

### Hook Export Rule
Hooks MUST re‑export every type they define:

```ts
export type { UseApprovalsResponse, ApprovalFilters }
```

---

# 8. UI Component Integration Rules
### Rule: UI Expected Fields Must Exist in Schema
Example fields that UI relies on:

- Task.tags  
- Task.assignee  
- Task.estimatedHours  
- Task.client  
- Task.booking  
- Booking.assignedToId  

If UI uses it → **schema must include it**.

### Error Rendering Rule
UI must display safe text:

```tsx
{error instanceof Error ? error.message : String(error)}
```

---

# 9. Dynamic Import Rules
Dynamic imports MUST wrap default export:

```ts
const loader = () =>
  import("./Component").then(m => ({ default: m.default }))
```

---

# 10. API Wrapper & Middleware Rules
### Middleware Parameters:
Handlers must always receive:

- `request`
- `{ user, tenantId, params }`
- NO additional context unless defined in middleware

### Wrapper Options:
Use only valid wrapper options (e.g., `requireAuth`)  
Do NOT use unsupported options (e.g., `requireAdmin` unless exists).

---

# 11. Category Recognition Rules
When the agent sees an error, it must classify it into one of:

1. Schema mismatch  
2. API signature mismatch  
3. Enum mismatch  
4. Context mismatch  
5. Missing module  
6. Hook response mis-parsing  
7. UI expecting missing model fields  
8. Invalid dynamic import  
9. Zod errors  
10. Spread type error on non-object  

Each has a predefined fix method.

---

# 12. Minimal Fix Principle
The agent must:

- Apply **the smallest fix** needed  
- Never introduce large refactors  
- Never rewrite entire modules unless absolutely required  
- Never change database logic beyond what UI/backend already expects  

---

# 13. Permanent Memory & Reasoning Constraints
The agent must always remember:

- The project historically contains **150+ TypeScript errors**  
- **80%** originate from **Prisma schema mismatches**  
- UI is ahead of schema → schema must evolve  
- API routes were updated but their handlers were NOT  
- Hooks incorrectly rely on `.data`  
- Enums across app have inconsistent casing  
- `resourceType` is deprecated → must use `resource`  
- Minimal fix is preferred over full rewrite  
- Follow the workflow order without deviation  

---

# 14. No Overthinking Rule
The agent should NOT:

- Re-scan the whole project repeatedly  
- Guess new architectures  
- Suggest changes outside the scope of identified errors  

It must rely on this ruleset.

---

# End of Comprehensive Ruleset
This is the complete final unified guideline combining:
- All your previous inputs  
- All analyses  
- All error categories  
- All repair strategies  
- All schema corrections  
- All behavior constraints  

