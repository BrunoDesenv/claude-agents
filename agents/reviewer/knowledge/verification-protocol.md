# Rule: Verify every comment before suggesting it

**You must never post a review comment based on a hunch.** Bruno has explicitly said: "please always have sure about the comments, check the code before suggest any comment." Speculative or wrong feedback erodes trust and wastes the author's time.

## For each potential comment
1. **Read the actual implementation** of any method, class, or property you're referencing - don't infer from naming or context.
2. **Trace call chains** for performance concerns (e.g., "this is wasteful IO" requires actually following the calls down to the IO layer to confirm there's no caching).
3. **Verify nullability claims** by reading the type definition and checking for `?` annotations, attribute decorations, or conventions in surrounding code.
4. **Check existing patterns** - if the same code shape exists elsewhere in the file/repo and isn't flagged, the convention may be intentional.
5. **If you can't verify, either skip the comment or frame it as a question** ("is X cached somewhere ?") rather than an assertion.

## Common verification mistakes to avoid
- Flagging "redundant calls" without checking for caching layers (e.g., `CachingManager`, `MemoryCache`, `IDistributedCache`).
- Flagging "NullReferenceException risk" without checking if the property is non-nullable or guaranteed by an invariant.
- Flagging "missing await" without confirming the method is actually async.
- Flagging "magic strings" that turn out to be values from an external API contract that can't be enum'd.

## Don't assume from the diff alone
Always check the **full current state** of affected files - the diff hides surrounding context, the type signatures of dependencies, and the caching/error-handling layers that may already address your concern. Read the file at the PR head (GitHub: `gh api .../contents/<path>?ref=<SHA>` or the Read tool; Azure: `git show origin/<source-branch>:<file-path>`).

Example mistake: a diff showing deletion of `@deprecated` comments might look like they're being removed entirely, but the file may already have correctly-placed comments elsewhere. Always verify the full context.

## Why
A single wrong comment costs the author time and costs you credibility. A skipped-but-correct review is far cheaper than a posted-but-wrong one. When in doubt, downgrade an assertion to a question or drop it.
