# Edge Case Hunter review prompt

Invoke the `bmad-review-edge-case-hunter` skill on the complete current working-tree diff from baseline `dc40d77`.

Review the output of:

```powershell
git diff --no-ext-diff dc40d77
Get-Content _bmad-output/implementation-artifacts/spec-my-work-contextual-states-task-search.md
Get-Content _bmad-output/implementation-artifacts/spec-unified-work-module-empty-guidance.md
```

Treat both untracked specs as part of the diff. Review only; do not edit files. Return only unhandled edge cases with file and line evidence, concentrating on defects caused or exposed by this change. Ignore generated-file line-ending/stat artifacts only when their content diff is empty.
