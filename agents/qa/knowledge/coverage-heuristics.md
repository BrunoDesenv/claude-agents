# Coverage Heuristics — What to Test for Any Feature

## Mandatory Coverage Checklist

For every feature, the test suite must cover:

### 1. Happy Path (golden flow)
The main user journey from start to finish. If this fails, the feature is broken.
Example: login → see rooms → book a slot → see it in My Bookings.

### 2. Empty State
What does the user see when there is no data?
- Empty list: "No items yet" message should appear
- Empty form result: no data returned
- First-time user: no pre-existing records

### 3. Error State (API failure)
When the API returns an error, the UI must show a meaningful message, not crash or show blank.
- 401 Unauthorized → redirect to login or show "session expired"
- 404 Not Found → show "not found" message
- 409 Conflict → show specific conflict message inline, form stays open
- 500 Server Error → show generic error, allow retry

### 4. Auth Boundary
For any protected route:
- Without token → redirected to /login
- With expired token → redirected to /login
- With valid token → access granted, data loads

### 5. Form Validation
- Required field left empty → field-level error visible
- Invalid email format → "valid email required"
- Invalid date range (end before start) → error before submitting
- Submit button disabled while loading

### 6. Conflict / Business Rule Enforcement
For any create/update with constraints:
- 409 Overlap (booking) → inline message, form stays open, inputs preserved
- Duplicate email (register) → error message visible
- Past date (date picker) → validation error

### 7. Visual Quality (mandatory)
After the first authenticated page load, verify the page is actually styled:
```typescript
const containers = await page.locator('main, .container, .page, [role="main"]').count();
expect(containers).toBeGreaterThan(0);
// Screenshot: look for non-white background or visible borders
```

---

## Feature-Type Templates

### Auth Feature (login/register)
- Login happy path → navigates to dashboard
- Wrong credentials → error visible, stays on login
- Register duplicate email → error visible
- Auth integration: Bearer token sent → API returns 200

### List Feature (rooms, bookings, items)
- List loads with data
- Empty state shows placeholder
- Click item → navigates to detail or expands

### Form Feature (create/edit)
- Submit valid data → success, list updates
- Submit invalid data → validation errors visible
- Submit conflict → inline error, form stays open, inputs preserved
- Cancel → returns without saving

### Detail/View Feature
- Load with real data → fields populated
- Not found → 404 handling
- Back button → returns to list, list state preserved
