# Rule: GitHub adapter (any owner/repo)

Use this adapter when the PR is hosted on `github.com`. The `<owner>/<repo>` is **always parsed from the PR input** - never hardcoded.

## Prerequisites
GitHub CLI must be installed and authenticated (one-time setup):
```bash
winget install -e --id GitHub.cli   # Windows, once
gh auth login                        # restart terminal after install, then run once
```
Authentication persists in `~/.config/gh/` - no re-login unless the token expires.

## 1. Parse PR input
Extract PR number + `<owner>/<repo>` from:
- Direct number (only valid if the repo is already known from context - otherwise ask)
- GitHub URL: `https://github.com/<owner>/<repo>/pull/<n>`
- With subpath: `https://github.com/<owner>/<repo>/pull/<n>/files`, `/changes`, etc.

## 2. Fetch PR details
```bash
gh pr view <n> --repo <owner>/<repo>
gh pr view <n> --repo <owner>/<repo> --json title,body,headRefName,baseRefName,headRefOid,author,additions,deletions,changedFiles
```
Capture the head SHA (`headRefOid`) - it's required for posting inline comments.

## 3. Get the diff
```bash
gh pr diff <n> --repo <owner>/<repo>
```
Machine-readable file list with patches:
```bash
gh api "repos/<owner>/<repo>/pulls/<n>/files" --jq '.[] | {filename, additions, deletions, patch}'
```

## 4. Get exact line numbers
**Don't trust diff hunk-relative line counts.** Inline comments need real file line numbers in the new file. Fetch the file at the PR head SHA:
```bash
gh api "repos/<owner>/<repo>/contents/<file-path>?ref=<HEAD_SHA>" --jq '.content' | base64 -d > "C:/Users/bru_b/AppData/Local/Temp/<filename>"
```
Or use the Read tool with `offset` / `limit` for the same effect.

## 5. Inline comment JSON
Write each comment to its own Windows-path temp file (`C:/Users/bru_b/AppData/Local/Temp/c1.json`, ...) so `gh.exe` can read it.

**Single-line comment:**
```json
{
  "commit_id": "<HEAD_SHA>",
  "path": "TE/Core/Quotes/MarginDataManager.cs",
  "line": 316,
  "side": "RIGHT",
  "body": "your markdown comment here"
}
```

**Multi-line comment (anchored to a range):**
```json
{
  "commit_id": "<HEAD_SHA>",
  "path": "TE/Core/Quotes/MarginDataManager.cs",
  "start_line": 308,
  "start_side": "RIGHT",
  "line": 309,
  "side": "RIGHT",
  "body": "your markdown comment here"
}
```

Payload notes:
- `path` is repo-relative, **no leading slash** (different from Azure DevOps).
- `commit_id` must be the PR head SHA at review time (`headRefOid`).
- `side`: `RIGHT` for added/unchanged lines on the new file side, `LEFT` for deleted lines from the old side.
- `start_line` + `start_side` only for multi-line ranges; omit for a single line.
- `line` is the file line number on the PR head (NOT the diff position).

## 6. Post inline comments (one call per comment)
```bash
gh api -X POST "repos/<owner>/<repo>/pulls/<n>/comments" \
  --input "C:/Users/bru_b/AppData/Local/Temp/c1.json" \
  --jq '{id, path, line, html_url}'
```
For multiple comments, write each to its own file and loop:
```bash
for i in 1 2 3 4 5; do
  echo "=== Posting c$i.json ==="
  gh api -X POST "repos/<owner>/<repo>/pulls/<n>/comments" \
    --input "C:/Users/bru_b/AppData/Local/Temp/c$i.json" \
    --jq '{id, path, line, html_url}' || echo "FAILED c$i"
done
```
Clean up the temp JSON files after posting.

## 7. General comment (ONLY for LGTM / non-code replies)
```bash
gh pr comment <n> --repo <owner>/<repo> --body "lgtm, thanks"
```

## 8. Delete a mistakenly-posted comment
```bash
# Inline comment (DEFAULT):
gh api -X DELETE "repos/<owner>/<repo>/pulls/comments/<COMMENT_ID>"
# Top-level PR conversation comment:
gh api -X DELETE "repos/<owner>/<repo>/issues/comments/<COMMENT_ID>"
```

## 9. Formal review (ONLY if the user explicitly asks)
Default is independent inline comments. A formal Approve / Request Changes review is rare:
```bash
gh pr review <n> --repo <owner>/<repo> --approve --body "lgtm"
gh pr review <n> --repo <owner>/<repo> --request-changes --body "see inline"
gh pr review <n> --repo <owner>/<repo> --comment --body "see inline"
```

## Why
`gh.exe` is a native Windows binary, so MSYS-style `/tmp/` paths won't resolve - always pass Windows-style paths to `--input`. Posting per concern (not as one `reviews` submission) and inline (not top-level) matches Bruno's preference and keeps each thread independently resolvable.
