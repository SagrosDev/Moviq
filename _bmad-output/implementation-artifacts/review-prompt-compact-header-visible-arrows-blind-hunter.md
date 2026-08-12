# Blind Hunter Review Prompt

Invoke the `bmad-review-adversarial-general` skill on the complete local change from baseline commit `22e7f0f08d60cb86523c7e4da6a1c671e9036d42` to the current worktree in `C:\Endava\EndevLocal\Moviqo`.

Before reviewing:

1. Read `AGENTS.md`.
2. Read `_bmad-output/implementation-artifacts/spec-1-36-compact-editor-header-visible-arrows.md` and treat its frozen block as authoritative intent.
3. Construct the complete diff with `git diff 22e7f0f08d60cb86523c7e4da6a1c671e9036d42` and include the untracked spec above in the reviewed artifact.

Review adversarially without editing. Focus on shared `PageHeader` regression risk, semantic/read order, responsive behavior and overflow, actual React Flow arrow visibility and attachment, normal/selected marker continuity, 6px visible ports with 44px interaction targets, compact connector-label readability/path clearance, and gaps in the added tests.

Return only concrete findings with file and line, trigger condition, user consequence, and evidence. If no concrete findings exist, state that the review is clean.
