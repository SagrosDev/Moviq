# Blind Hunter review prompt

Invoke the `bmad-review-adversarial-general` skill on the implementation of:

- Spec: `_bmad-output/implementation-artifacts/spec-1-36-align-designer-header-and-direct-manipulation.md`
- Baseline commit: `35543b20debbecaf80e617ef65205eb1ac4af0d8`
- Current shared worktree: `C:\Endava\EndevLocal\Moviqo`

Construct the complete read-only diff with `git diff 35543b20debbecaf80e617ef65205eb1ac4af0d8 --` and also read the untracked spec above. Review every tracked and untracked change against the frozen intent, acceptance criteria, `AGENTS.md`, current React Flow behavior, localization, accessibility, and test validity. Do not edit files. Return raw, undeduplicated findings with exact paths/lines, trigger conditions, consequences, and evidence. Do not assign final workflow severity.
