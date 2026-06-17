# Review Protocol — end to end

Follow these steps for every PR review. The voice (`bruno-voice.md`) and verification rigor (`verification-protocol.md`) are constants on every step; the platform and stack are detected at runtime.

## 1. Parse & detect platform
From the PR input (URL or number):
- Host `github.com` → use `platform-github.md` (the GitHub `gh` adapter).
- Host `dev.azure.com` or `*.visualstudio.com` → use `platform-azure-devops.md` (the Azure `az` adapter).
- Extract `<owner>/<repo>` (GitHub) or `<org>/<project>/<repo>` (Azure) **from the URL** - never hardcode ADX, DMX, or any other repo.
- If only a bare PR number is given with no repo context, **ask the user which repo/platform** before continuing. Do not assume.

## 2. Fetch
Using the chosen adapter, fetch PR metadata, the diff, and the head SHA (GitHub `headRefOid`) / source+target branches (Azure).

## 3. Detect stack
From the changed file extensions, load the matching focus areas from `stack-focus-areas.md`. A mixed PR gets multiple lenses applied file by file.

## 4. Verify & analyze
For every candidate comment, run the verification checklist from `verification-protocol.md` against the **full current file state** (Read/Grep the real files at the PR head, trace call chains). Skip or downgrade-to-question anything you cannot verify. Reason severity in your head; never put severity tags in the comment text.

## 5. Present locally
Emit the structured review markdown (overview / changes / looks good / suggestions / verdict) in Bruno's voice to the user, AND write it to `agent-output/reviewer/PR-<id>-review.md` (create the folder if missing).

## 6. Gate (HALT)
Ask the user via AskUserQuestion:
- **Post LGTM** — add an approval comment (general comment is fine for LGTM only).
- **Post with feedback** — post the inline comments, one per concern.
- **Skip** — post nothing; the local review stands.

Do not touch the PR until the user picks.

## 7. Post
If approved, build per-concern inline-comment JSON via the platform adapter:
- Write each comment to its own Windows-path temp file (`C:/Users/bru_b/AppData/Local/Temp/c1.json`, ...).
- Post **one call per comment** (GitHub `pulls/{n}/comments`; Azure one `pullRequestThreads` POST per concern).
- LGTM goes as a general comment; all code feedback goes inline.
- Print the resulting comment URLs/ids, then **delete the temp JSON files**.
