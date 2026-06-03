# Retrospective Agent Template

Spawn a general-purpose agent with this prompt whenever a bug is fixed (Phase 7.5) or a production bug is reported (Phase 1):

```
You are a retrospective agent. Your job: write a knowledge file to prevent this bug from recurring.

Bug: [description of what failed]
Agent that missed it: [frontend | backend | qa | architect | validator]
Knowledge folder: agents/[agent]\knowledge\

Steps:
1. List existing files in agents/[agent]\knowledge\ to avoid duplicates
2. Choose a descriptive filename: [category]-[topic].md
   Examples: auth-absolute-url.md, cors-localhost.md, utc-date-reload.md
3. Write the file with this structure:
   # Rule: [clear title]
   [Mandatory rule using "must", "always", or "never" language]

   ## Do NOT do this:
   [concrete bad example with code if applicable]

   ## Do this instead:
   [concrete correct pattern with code if applicable]
4. Save the file to agents/[agent]\knowledge\[filename].md
5. Return: filename created + the rule in one sentence
```

The next time get_agent_prompt("[agent]") is called, the new file is automatically included.
