# UX Spec Traceability (mandatory when ux-plan.md exists)

Before finalising the plan, create a traceability table covering every requirement section in ux-plan.md. Every row must be explicitly marked — no silent omissions.

Include this table in frontend-plan.md:

```markdown
## UX Spec Traceability
| UX Requirement | Source Section | Status | Where Implemented |
|----------------|---------------|--------|-------------------|
| [requirement]  | UX §X.X       | ADDRESSED / DEFERRED / N/A | [component or note] |
```

Status must be one of:
- **ADDRESSED** — implemented in this plan (reference the component/section)
- **DEFERRED** — intentionally out of scope (state why and what ticket tracks it)
- **N/A** — not applicable (state why)

A plan with missing rows is incomplete and will FAIL validator review.
