# WCAG 2.1 AA — Practical Checklist

Reference: https://www.w3.org/TR/WCAG21/

## Level A (must pass)

### 1.1.1 Non-text Content
- Every `<img>` must have `alt` attribute
- Decorative images: `alt=""` (empty, not omitted)
- Icon buttons: `aria-label="Descriptive name"` on the button, `aria-hidden="true"` on the icon

### 1.3.1 Info and Relationships
- Use semantic HTML: `<button>` not `<div onclick>`, `<nav>` not `<div class="nav">`
- Form fields: `<label for="field-id">` linked to `<input id="field-id">`
- Tables: `<th scope="col/row">` for headers
- Lists: `<ul>/<ol>` for lists, not `<div>` with bullets

### 1.3.3 Sensory Characteristics
- Never use color as the ONLY indicator (also use icon, pattern, or text label)
- "The required fields are shown in red" → also add `*` or "(required)"

### 2.1.1 Keyboard
- All interactive elements reachable via Tab key
- All actions executable via Enter/Space/Arrow keys
- No keyboard traps (focus never gets stuck)

### 2.4.2 Page Titled
- Every page has a meaningful `<title>` tag

### 3.3.1 Error Identification
- Form errors: identify the specific field + describe what's wrong in text
- "This field is required" is OK; just a red border is not

### 4.1.2 Name, Role, Value
- Custom components (dropdown, modal, tab): have `role`, `aria-label`, and state attributes
- `aria-expanded` on accordions and dropdowns
- `aria-selected` on tab panels
- `aria-checked` on custom checkboxes

---

## Level AA (must pass)

### 1.4.3 Contrast Minimum
- **Normal text** (< 18pt / < 14pt bold): minimum 4.5:1 ratio against background
- **Large text** (≥ 18pt or ≥ 14pt bold): minimum 3:1 ratio
- Tool: https://webaim.org/resources/contrastchecker/

**Common failures:**
- `#aaaaaa` on white = 2.32:1 ❌
- `#767676` on white = 4.54:1 ✅
- `#595959` on white = 7.0:1 ✅

### 1.4.11 Non-text Contrast
- UI components (button border, input border, focus ring): minimum 3:1 against adjacent colors
- Icons that convey meaning: minimum 3:1

### 2.4.3 Focus Order
- Tab order follows logical reading order (usually left-to-right, top-to-bottom)
- Modal: focus moves into modal when opened, returns to trigger when closed

### 2.4.7 Focus Visible
- Keyboard focus indicator always visible
- Minimum: 2px solid outline
- Never: `outline: none` without a replacement

### 3.3.2 Labels or Instructions
- Complex inputs have visible hint text or examples (e.g., "Format: YYYY-MM-DD")
- Required fields are clearly marked before form submission

---

## Common Violations to Flag in UX Plans

| Violation | What to flag |
|-----------|-------------|
| `<div>` used as button | Replace with `<button type="button">` |
| Icon-only button without label | Add `aria-label` or visually-hidden text |
| Color-only error indicator | Add text message and/or icon |
| Missing focus ring | Add `outline` or `box-shadow` on `:focus-visible` |
| Low contrast text | Specify a higher-contrast color token |
| Form without field labels | Add `<label>` elements linked to inputs |
