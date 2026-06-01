# Evidence Collection (mandatory on every run)

Every QA run must produce visual evidence. Before running tests, always ensure the Playwright config has:

```typescript
use: {
  screenshot: 'on',
  video: { mode: 'on', size: { width: 1280, height: 720 } },
  trace: 'retain-on-failure',
},
outputDir: './evidence',
```

After tests complete:
1. Confirm `evidence/` directory contains `.webm` video files and `.png` screenshots
2. List the artifact paths in the QA report
3. If `evidence/` is empty, re-run with `--reporter=html` and verify config

Evidence folder structure:
```
e2e/evidence/
  [test-name]-[hash]/
    video.webm      ← screen recording
    test-finished-1.png  ← final screenshot
    trace.zip       ← only on failure
```
