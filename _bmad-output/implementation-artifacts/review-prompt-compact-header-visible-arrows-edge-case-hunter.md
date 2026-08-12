# Edge Case Hunter Review Prompt

Invoke the `bmad-review-edge-case-hunter` skill on the complete local change from baseline commit `22e7f0f08d60cb86523c7e4da6a1c671e9036d42` to the current worktree in `C:\Endava\EndevLocal\Moviqo`.

Before reviewing:

1. Read `AGENTS.md`.
2. Read `_bmad-output/implementation-artifacts/spec-1-36-compact-editor-header-visible-arrows.md` and treat its frozen block as authoritative intent.
3. Construct the complete diff with `git diff 22e7f0f08d60cb86523c7e4da6a1c671e9036d42` and include the untracked spec above in the reviewed artifact.

Walk every relevant branch and boundary without editing. Focus on header behavior at 1280px, just below the breakpoint, long breadcrumb/workflow names, 200% text, absent actions/eyebrow/description, other `PageHeader` consumers, pointer and keyboard connection gestures, normal and selected edges, fitted zoom, vertical edges, 6px visual ports versus 44px targets, short/blank/wrapping connector labels, clipping/path overlap, and whether tests can pass while arrows remain visually occluded.

Return only unhandled concrete edge cases with file and line, trigger condition, consequence, and evidence. If no concrete findings exist, state that the review is clean.
