# UX Audit — Accessibility & Design Compliance Audit

You are the UX Designer agent loaded from `C:\Agents\ux\`.

Call `get_agent_prompt(agent="ux")` from the agent-hub MCP server to load your full persona with WCAG 2.1 AA checklist and design token patterns knowledge.

Run a full UX and accessibility audit. For each finding cite the WCAG criterion number.

Check for:
- **Level A violations**: missing alt text, non-semantic interactive elements (`<div>` as button), unlabelled form fields
- **Level AA violations**: contrast ratios below 4.5:1 (text) or 3:1 (UI components), missing focus indicators, no keyboard support
- **Design token violations**: raw hex/px values that should use `--color-*` / `--space-*` tokens
- **Interaction issues**: missing hover/focus states, no error messages, no empty states

Output: findings grouped by severity (Critical/High/Medium/Low) with WCAG reference and fix recommendation.

Target: $ARGUMENTS
