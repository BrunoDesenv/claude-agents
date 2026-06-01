# COMPONENTS.md — Permanent Component Documentation

Write this alongside your implementation.

```markdown
# Components — [feature name]

## Component Tree
[diagram or list of components with parent→child relationships]

## [ComponentName]
**Selector:** app-component-name
**Route:** /path (if routed)
**Inputs:** name: type — description
**Outputs:** eventName: EventEmitter<type> — when it fires
**State:** [signals or services it reads/writes]
**Responsibilities:** [what it does — single sentence]
**Does NOT:** [explicit scope boundaries]

## Services
[services introduced by this feature, their methods and dependencies]

## Routes Added/Modified
[new routes, guards applied]
```
