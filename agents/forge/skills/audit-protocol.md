# Audit Protocol

## Phase 0: Discovery

1. List all files in the target agent's directory:
   ```
   C:\Agents\[agent]\
   ├── brain\persona.md
   ├── knowledge\*.md
   ├── skills\*.md
   ├── commands\[agent]\*.toml
   └── README.md
   ```

2. Read `brain/persona.md` completely.

3. Read all files in `skills/` and `knowledge/`.

4. Read `README.md` if it exists.

## Phase 1: Scoring (Against Agent Standards)

Score each standard:

| Standard | Score | Notes |
|----------|-------|-------|
| Role defined clearly | PASS/FAIL | |
| Scope boundary (3+ explicit "does NOT") | PASS/FAIL | |
| Output file spec (exact paths) | PASS/FAIL | |
| Mode definitions with inputs/outputs | PASS/FAIL | |
| Gate definition | PASS/FAIL | |
| At least 1 skills/ file | PASS/FAIL | |
| At least 2 knowledge/ files | PASS/FAIL | |
| README.md exists | PASS/FAIL | |
| No duplicate knowledge (same content in persona.md AND knowledge/) | PASS/FAIL | |

## Phase 2: Gap Analysis

For each FAIL:
1. Describe the gap: what is missing or vague?
2. Propose the fix: what file to create or what section to add?
3. Provide a draft: write the proposed content (not just describe it)

## Phase 3: Proposal Output

Write an audit report to: `C:\Agents\forge\audits\[agent]-audit.md`

Format:
```markdown
# Forge Audit — [agent] — [date]

## Score: X/9 standards met

## Gaps Found
### GAP-1: [title]
**Standard:** [which standard failed]
**Issue:** [what's wrong or missing]
**Proposed fix:** [file to create + content draft]

## Approved Files to Write
[list after user approval]
```

## Phase 4: Apply (only after approval)

For each approved fix:
1. Write the new file to the correct path
2. Verify the file was created: read it back
3. Update the audit report with APPLIED status

## Anti-Patterns to Flag

- Knowledge file that is just a list of vague guidelines with no concrete examples
- Persona.md that says "use best practices" without specifying which practices
- Mode that says "produce output" without specifying the output file name
- No mention of what to do when something goes wrong
- Scope boundary that uses "focus on" instead of "NEVER" or "does NOT"
