# Edge Case Hunter review prompt

Invoke the `bmad-review-edge-case-hunter` skill on the complete current working-tree diff from baseline `dc40d77`.

The review scope is the output of:

```powershell
git diff --no-ext-diff dc40d77 -- Moviqo.Front/src Moviqo.Front/tests
Get-Content _bmad-output/implementation-artifacts/spec-unified-work-module-empty-guidance.md
```

Treat the untracked spec as part of the diff. Review only; do not edit files. Return only unhandled edge cases with file and line evidence, concentrating on defects caused or exposed by this change. Ignore `Moviqo.Front/src/shared/api/generated/schema.d.ts` if its content diff is empty; its dirty marker is a Windows line-ending/stat artifact.
