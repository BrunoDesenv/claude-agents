# Test Evidence (mandatory after every test run)

The backend agent owns the developer test suite (xUnit). After every `dotnet test` run:

```bash
dotnet test \
  --logger "console;verbosity=normal" \
  --logger "trx;LogFileName=evidence/results.trx" \
  --logger "html;LogFileName=evidence/results.html" \
  2>&1 | tee evidence/test-output.txt
```

Evidence folder: `api/evidence/`
- `results.trx` — XML machine-readable results
- `results.html` — human-readable HTML report
- `test-output.txt` — full console output

Include in agent-output/backend-impl.md:
- Every test name and PASS/FAIL status
- Paths to the 3 evidence files
- If any test FAILS: root cause analysis and the fix applied before shipping

**The QA agent does NOT run xUnit tests. Developer tests are the backend agent's exclusive responsibility.**
