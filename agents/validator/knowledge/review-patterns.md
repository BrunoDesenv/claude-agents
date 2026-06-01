# Review Patterns by Mode

## PLAN_REVIEW — What to Check

### 1. Requirements Coverage Matrix
Build a mental matrix: every item in `task.md` → which plan covers it.
Mark UNCOVERED if no plan mentions it. One uncovered requirement = FAIL.

### 2. Contract Completeness
For every API endpoint in the plan:
- HTTP method + path defined?
- Auth requirement stated (public or requires Bearer)?
- Request body shape defined?
- Success response shape defined?
- Error codes listed?

For every UI component:
- What data does it need?
- Where does the data come from (which API endpoint)?
- What happens on loading, error, empty, success?

### 3. Auth Requirements Explicit
If the feature touches user data:
- Is `[Authorize]` mentioned for relevant endpoints?
- Is ownership validation mentioned (user can only access their own data)?
- Is the frontend guard mentioned (redirect to /login if unauthenticated)?

### 4. Edge Cases Named
At minimum, the plan should name:
- What happens if the resource doesn't exist (404)
- What happens with invalid input (400)
- What happens with a conflicting operation (409)

---

## DRIFT_REVIEW — What to Check

### 1. Endpoint Inventory
List every endpoint from `*-plan.md`. For each:
- Is it in `*-impl.md`? If not → MISSING IMPLEMENTATION
- Does the HTTP method/path match? If not → CHANGED CONTRACT

### 2. Response Shape Comparison
If the plan defined a response shape (e.g., `{ id, name, capacity }`):
- Does the impl mention returning the same fields?
- Any extra fields added? (generally OK)
- Any fields removed? → CHANGED CONTRACT

### 3. Requirement Checklist from Plan
Every requirement the plan said "will be implemented":
- Find evidence in impl notes or code
- If no evidence → SKIPPED REQUIREMENT

### 4. SOLID Quick Scan
Read the implementation notes. Flag if:
- A controller/component does more than one thing
- Business logic is described as being in a controller (not a service)
- New `new ConcreteClass()` instantiation in business logic

### 5. Test Coverage Spot Check
- Every new service method should have a corresponding test
- Bug fixes should have a regression test
- If tests are not mentioned → flag as MISSING TESTS

---

## Output Format

Every finding needs:
1. Severity: BLOCKING / HIGH / MEDIUM / LOW
2. Location: file name, section, or endpoint
3. What's wrong: one sentence
4. What to do: one sentence

STATUS: PASS only if zero BLOCKING and zero HIGH findings.
APPROVED_WITH_NOTES: zero BLOCKING, some HIGH/MEDIUM that are non-fatal.
FAIL: any BLOCKING finding.
