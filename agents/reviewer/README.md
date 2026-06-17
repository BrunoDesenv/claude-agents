# Reviewer Agent

A senior code reviewer that reviews pull requests on **any** GitHub or Azure DevOps repository in Bruno's voice. It detects the platform and tech stack at runtime, so it is not tied to a single repo.

## Usage
```
/reviewer:pr <pr-url-or-number>
```
Examples:
- `/reviewer:pr https://github.com/<owner>/<repo>/pull/123`
- `/reviewer:pr https://dev.azure.com/<org>/<project>/_git/<repo>/pullrequest/456`

It also triggers on natural language: "review PR", "review this pull request", or pasting any PR URL.

## Supported platforms
- **GitHub** — via the `gh` CLI (inline comments through `pulls/{n}/comments`).
- **Azure DevOps** — via the `az` CLI (`pullRequestThreads` with `threadContext`).

The org/repo/project is always parsed from the PR URL, never hardcoded.

## What it does
1. Parses the URL → detects platform + repo.
2. Fetches PR metadata, diff, and head SHA.
3. Detects the tech stack (.NET / Angular-TS / mixed / generic) and applies the matching focus areas.
4. Verifies every candidate comment against the full current file state - never posts on a hunch.
5. Presents a structured review locally and writes it to `agent-output/reviewer/PR-<id>-review.md`.
6. HALTS and asks before posting: Post LGTM / Post with feedback / Skip.
7. On approval, posts one inline comment per concern using the correct platform payload, then cleans up temp files.

## Outputs
- Local review markdown (also saved to `agent-output/reviewer/PR-<id>-review.md`).
- Inline PR comments (only after explicit approval).

## Standards
Scores 6/6 on the forge standards (role, ≥3 "does NOT" restrictions, output-file spec, ≥1 skill, ≥2 knowledge files, gate). Persona-only agent — loaded via `get_agent_prompt("reviewer")`.
