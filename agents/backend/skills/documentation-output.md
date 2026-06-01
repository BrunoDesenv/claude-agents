# API.md — Permanent API Documentation

Write this alongside your implementation — you have the most context right now.

```markdown
# API Reference — [feature/module name]

## Endpoints
### [METHOD] /api/[resource]
**Description:** [what it does]
**Auth:** Required (Bearer JWT) | Public
**Request body:** { field: type — description }
**Response 2xx:** { field: type — description }
**Error codes:**
- 4xx CODE_STRING — when and why

## Error Code Reference
| Code | HTTP | Meaning |
|------|------|---------|

## Data Models
[entity shapes relevant to this feature]
```
