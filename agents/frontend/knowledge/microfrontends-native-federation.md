# Knowledge: Micro-Frontends with Native Federation

## 1. When to Federate

**Use federation when:**
- Teams deploy independently and cannot coordinate release cycles
- Shell + feature boundaries are stable and owned by separate squads
- Build times exceed ~5 min and independent rebuilds are desirable
- UX cohesion is required across separately deployed applications

**Avoid federation when:**
- Single team owns the entire app
- No independent deployment requirement
- First release of a product (federation is an optimisation, not a starting point)

**Alternatives to evaluate first:**
- **NX monorepo with library boundaries** — same codebase, enforced boundaries, zero runtime overhead
- **Separate apps with no sharing** — simplest when teams have no shared state or shared components

---

## 2. Library

**Install:** the Angular adapter package required by the target Angular/Native Federation major version.

For standard Angular Native Federation setups, this is `@angular-architects/native-federation`. For v4/orchestrator setups, verify whether the current official docs/schematic require `@angular-architects/native-federation-v4`.

The old `@angular-architects/native-federation-runtime` package is **stale and must not be installed** — the main package already re-exports the runtime.

**Version matrix:** Match the Angular **major** version (NF 17.x → Angular 17, NF 18.x → Angular 18, NF 19.x → Angular 19, NF 20.x → Angular 20, etc.). Always verify current release compatibility against official docs via **Context7 before generating any implementation plan** (`skills/protocol.md` requires up-to-date external library docs in every plan).

---

## 3. Host (Shell) Setup

### 3a. federation.config.js

Federation configuration lives in `federation.config.js` (or `.mjs`) — **not** `vite.config.ts` or `webpack.config.js`.

```js
// federation.config.js
const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' })
  }
});
```

### 3b. main.ts — initFederation before any other import

```ts
// main.ts
import { initFederation } from '@angular-architects/native-federation';

initFederation('/assets/federation.manifest.json')
  .catch(err => console.error(err))
  .then(() => import('./bootstrap'))
  .catch(err => console.error(err));
```

The manifest lives in `src/assets/` (or `public/` in newer schematics). It is swapped per environment at **deploy time**, not rebuild time.

### 3c. Routing with loadRemoteModule

For standard adapter setups, import `loadRemoteModule` explicitly:

```ts
// app.routes.ts
import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const APP_ROUTES: Routes = [
  {
    path: 'booking',
    loadChildren: () =>
      loadRemoteModule('booking', './Routes').then(m => m.BOOKING_ROUTES)
  }
];
```

> **Note:** For v4/orchestrator setups, the top-level loader can be deprecated or brittle. Prefer the `loadRemoteModule` returned by `initFederation()` and thread it through Angular DI or a route factory. Do not write route examples that reference `loadRemoteModule` without importing it or injecting/passing the returned loader.

---

## 4. Remote (Micro-Frontend) Setup

### 4a. federation.config.js — exposes map

```js
// federation.config.js
const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'booking',
  exposes: {
    './Routes': './src/app/booking/booking.routes.ts'
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' })
  }
});
```

Expose **public route/module barrel files** — never expose internal implementation files.

### 4b. main.ts — initFederation before bootstrapping

```ts
// main.ts
import { initFederation } from '@angular-architects/native-federation';

initFederation({ booking: './remoteEntry.json' })
  .catch(err => console.error(err))
  .then(() => import('./bootstrap'))
  .catch(err => console.error(err));
```

For v4/orchestrator setups, pass a self-map such as `{ booking: './remoteEntry.json' }` so the remote registers its own shared modules. Some generated v3/legacy setups use `initFederation()` with no argument; keep the schematic-generated pattern when verified.

```ts
// bootstrap.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
```

No manifest path needed for remotes. The remote **can** still bootstrap itself after federation initializes — the dynamic `import('./bootstrap')` pattern ensures federation is ready first.

Build output includes `remoteEntry.json` — this is what the host's manifest points to.

---

## 5. Federation Manifest

```json
{
  "booking": "https://booking.example.com/remoteEntry.json",
  "profile": "https://profile.example.com/remoteEntry.json"
}
```

- Manifest maps **remote name → `remoteEntry.json`** (not `mf-manifest.json` or `mf.manifest.json`)
- The manifest necessarily contains concrete URLs — that is expected and correct
- The anti-pattern is committing a **single manifest reused across all environments**, or hardcoding production remote URLs in routes or source code
- Correct approach: **deploy an environment-specific manifest alongside the shell** at deploy time (CI/CD swap); never rebuild app code just to change remote URLs

---

## 6. Shared Dependencies Strategy

`requiredVersion: 'auto'` with `singleton: true` and `strictVersion: true` is the **officially recommended pattern** — not an anti-pattern.

Real anti-patterns:
- Omitting `singleton: true` → duplicate Angular instance at runtime
- Omitting `strictVersion: true` → silent version mismatch failures
- Sharing across host/remote with mismatched Angular **major** versions

Use eager loading for shared state libraries (e.g. NgRx store) to ensure state is initialized before any remote loads.

---

## 7. State Sharing Strategies

| Strategy | When to use |
|----------|-------------|
| Shared NgRx store via singleton shared dep | Teams need live cross-app state; remotes import store from host's Angular instance |
| URL-only state | Maximum isolation; each remote reads params from the URL |
| BFF-per-remote | Full isolation; each remote has its own backend; no shared frontend state |

---

## 8. Anti-Patterns (Must Reject)

- `@angular-architects/native-federation-runtime` installed separately — stale package; main package includes the runtime
- `withNativeFederation()` placed in `vite.config.ts` — must be in `federation.config.js`
- `initFederation()` missing from remote `main.ts` before dynamic `import('./bootstrap')` — Angular bootstraps before federation is ready
- Single `federation.manifest.json` committed and reused across all environments
- Production remote URLs hardcoded in routes or TypeScript source files
- Manifest `remoteEntry.json` path wrong (e.g. pointing to `mf-manifest.json`)
- Exposing internal files instead of public route/module barrel exports
- `singleton: false` on Angular shared dep — causes duplicate Angular instance
- Installing NF version mismatched to Angular major (e.g. NF 17 with Angular 19)

---

## 9. Failure Modes (Must Flag)

| Symptom | Most likely cause |
|---------|-------------------|
| `ChunkLoadError` at runtime | Remote URL wrong, `remoteEntry.json` not in build output, or remote not deployed |
| Duplicate Angular instance error | `singleton: true` missing, or Angular version mismatch across host/remote |
| `loadRemoteModule is not a function` (v4+ DI pattern) | Returned loader not threaded through DI/route factory, or top-level deprecated loader used before federation finished initializing |
| Missing `remoteEntry.json` in build output | `exposes` misconfigured or remote build not run |
| Remote state undefined on load | Shared NgRx store not initialized; use eager loading |

---

## 10. Performance

- Budget ~200 KB gzipped per remote; each remote is a separate Lighthouse audit target
- Preload manifests eagerly on shell startup; defer remote module downloads until route activation (`@defer` / lazy routes)
- CI/CD must build and deploy **remotes before the host** (host manifest references remote artifacts)

---

## 11. Testing

- **Unit:** Mock `loadRemoteModule` in Vitest/Jest — do not actually load remote modules in unit tests
- **Integration:** Run host + all remotes concurrently (`concurrently` or `nx run-many`) against a shared test environment
- **E2E (Playwright):** Start all apps, navigate through the host shell — never test cross-app flows from an isolated remote

---

## 12. Context7 Requirement

Before writing any federation implementation plan, **fetch current Native Federation docs via Context7** (`skills/protocol.md` requires up-to-date external library docs in every plan). Version compatibility changes with each Angular major release.
