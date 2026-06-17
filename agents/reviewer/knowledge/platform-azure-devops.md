# Rule: Azure DevOps adapter (any org/project/repo)

Use this adapter when the PR is hosted on `dev.azure.com` or `*.visualstudio.com`. The `<org>` / `<project>` / `<repo>` are **always parsed from the PR input** - never hardcoded.

## Prerequisites
Azure CLI must be installed and authenticated (one-time setup):
```bash
winget install -e --id Microsoft.AzureCLI   # Windows, once
az login
az extension add --name azure-devops
az devops configure --defaults organization=https://dev.azure.com/<org> project=<project>
```
Authentication persists in `~/.azure/` - no re-login unless the token expires.

## Azure CLI path
The Azure CLI may not be in the bash PATH. Use the full path:
```bash
"/c/Program Files/Microsoft SDKs/Azure/CLI2/wbin/az"
```

## 1. Parse PR input
Extract `<org>`, `<project>`, `<repo>`, and PR id from:
- Direct number (only valid if the repo is already known from context - otherwise ask)
- Azure DevOps URL: `https://dev.azure.com/<org>/<project>/_git/<repo>/pullrequest/<n>`
- Legacy host: `https://<org>.visualstudio.com/<project>/_git/<repo>/pullrequest/<n>`

## 2. Fetch PR details
```bash
"/c/Program Files/Microsoft SDKs/Azure/CLI2/wbin/az" repos pr show --id <n>
```
Returns JSON with: title, description, author, source/target branches, reviewers, status.

## 3. Get the diff
Fetch the source branch and compare to target (use the PR's actual target branch, not always `develop`):
```bash
git fetch origin
git diff origin/<target-branch>...origin/<source-branch> --stat
git diff origin/<target-branch>...origin/<source-branch>
```

## 4. Get exact line numbers / full current state
```bash
git show origin/<source-branch>:<file-path> | cat -n | sed -n 'A,Bp'
```
Always read the full current state before commenting, never the diff alone.

## 5. Inline comment JSON (threadContext)
Write each comment to its own temp JSON file:
```json
{
  "comments": [
    {
      "parentCommentId": 0,
      "content": "Your markdown comment here",
      "commentType": "text"
    }
  ],
  "status": "active",
  "threadContext": {
    "filePath": "/full/repo/path/to/file.ext",
    "rightFileStart": {"line": 15, "offset": 1},
    "rightFileEnd": {"line": 15, "offset": 40}
  }
}
```
Notes on `threadContext`:
- `filePath` **must start with `/`** and be the repo-relative path (e.g. `/MyRepo.Frontend/src/styles/components/_button.scss`). This is the opposite of GitHub, which uses no leading slash.
- `rightFileStart`/`rightFileEnd` are the lines on the PR (right) side. Use `leftFileStart`/`leftFileEnd` only when commenting on deleted lines.
- `offset` is 1-based column. For a whole-line comment, `offset: 1` to end-of-line is fine.
- For a multi-line selection, set `rightFileStart.line` and `rightFileEnd.line` to different values.

## 6. General comment (ONLY for LGTM / non-code replies)
Same JSON, but omit `threadContext`:
```json
{
  "comments": [{"parentCommentId": 0, "content": "lgtm, thanks", "commentType": "text"}],
  "status": "active"
}
```

## 7. Post via REST API (both styles, one call per concern)
```bash
"/c/Program Files/Microsoft SDKs/Azure/CLI2/wbin/az" devops invoke \
  --area git \
  --resource pullRequestThreads \
  --route-parameters project=<project> repositoryId=<repo> pullRequestId=<n> \
  --http-method POST \
  --api-version 7.1 \
  --in-file <path-to-json-file>
```
Clean up the temp JSON file after posting.

## 8. Close a mistakenly-posted thread (no hard-delete)
Azure DevOps does not allow hard-delete of threads - close them instead:
```bash
"/c/Program Files/Microsoft SDKs/Azure/CLI2/wbin/az" devops invoke \
  --area git \
  --resource pullRequestThreads \
  --route-parameters project=<project> repositoryId=<repo> pullRequestId=<n> threadId=<THREAD_ID> \
  --http-method PATCH \
  --api-version 7.1 \
  --in-file <status-closed.json>
```
where `status-closed.json` contains `{"status": "closed"}`.

## Why
Azure DevOps comments are threads anchored by `threadContext`, with file paths that require a leading slash and line+offset ranges - structurally different from GitHub's `commit_id`/`path`/`line`/`side` payload. Getting the `filePath` slash or the side wrong silently posts the comment to the wrong place, so verify the anchor against the actual file before posting.
