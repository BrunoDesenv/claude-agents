# Rule: Apply the focus areas that match the detected stack

Detect the tech stack from the changed file extensions, then apply the matching review lens. A PR can span multiple stacks (e.g. a C# API + Angular MFE monorepo) - in that case apply each lens to the files it covers.

## .NET / C# — `.cs`, `.csproj`, `.sln`
- **Correctness:** logic errors, edge cases, null-reference risks
- **C# / .NET patterns:** SOLID, modern C# (pattern matching, switch expressions, `?.` chains, records), no comments inside methods
- **Performance:** sync calls in loops, redundant IO, batchable APIs called single-element-at-a-time
- **Security:** input validation at boundaries, no injection vectors
- **Conventions:** follows patterns in the repo's CLAUDE.md / AGENTS.md
- **Tests:** are tests updated/added? reference existing test files

## Angular / TypeScript — `.ts`, `.html`, `.scss` (with Angular markers)
Angular markers: `@Component`, `angular.json`, `*.component.ts`, signals/`computed`/`effect`, standalone components.
- **Correctness:** logic errors, edge cases
- **Angular patterns:** signals, standalone components, OnPush change detection, `inject()` over constructor DI, new control flow (`@if`/`@for`)
- **Performance:** unnecessary re-renders, O(n²) operations, missing `trackBy`/track expressions
- **Security:** XSS, unsanitized bindings, injection vulnerabilities
- **Conventions:** follows patterns in the repo's CLAUDE.md / AGENTS.md
- **Tests:** are tests updated/added?

## Mixed monorepo (e.g. C# API + Angular MFEs)
Apply **both** lenses - the .NET lens to `.cs` files, the Angular/TS lens to `.ts`/`.html`/`.scss` files - file by file. Do not let one stack's checklist blind you to the other.

## Fallback (any other stack)
When the extensions don't map to a known lens, apply the generic checklist:
- **Correctness:** does it do what it claims? edge cases, off-by-one, error handling
- **Conventions:** matches the surrounding code's style and naming
- **Security:** input validation, secrets, injection
- **Tests:** is the change covered?

## Windows path gotcha
Native `gh.exe` and `az` are Windows binaries - any file path passed to `--input` / `--in-file` must be a Windows path (`C:/Users/bru_b/AppData/Local/Temp/c1.json`), not an MSYS `/tmp/` path. `/tmp/` works for `cat` and the Write tool but fails when handed to the native CLI.

## Why
A reviewer that applies a .NET checklist to Angular files (or vice versa) misses the real issues and raises irrelevant ones. Detecting the stack per file keeps the feedback on-target on any repo.
