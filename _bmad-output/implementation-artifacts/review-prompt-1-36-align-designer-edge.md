# Edge Case Hunter review prompt

Invoke the `bmad-review-edge-case-hunter` skill on the implementation of:

- Spec: `_bmad-output/implementation-artifacts/spec-1-36-align-designer-header-and-direct-manipulation.md`
- Baseline commit: `35543b20debbecaf80e617ef65205eb1ac4af0d8`
- Current shared worktree: `C:\Endava\EndevLocal\Moviqo`

Construct the complete read-only diff with `git diff 35543b20debbecaf80e617ef65205eb1ac4af0d8 --` and also read the untracked spec above. Walk every branch and boundary condition, especially desktop/narrow/200% text hierarchy, long names, central node dragging versus canvas pan, centered 44px Handles, disabled/keyboard/pointer connection paths, fitted and panned viewports, edge endpoint compensation, arrow/label geometry, save/reload persistence, and Chromium/Firefox test coverage. Do not edit files. Return only raw, undeduplicated unhandled edge cases with exact paths/lines, trigger conditions, consequences, and evidence. Do not assign final workflow severity.
