# Moviq
A modern workflow platform for designing, executing, and automating operational processes.

## Verification Contract

Run backend checks from `Moviqo.Back/`:

```powershell
uv sync --frozen
uv run ruff check src tests
uv run pytest
uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json --format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test
git -C .. ls-files --error-unmatch docs/api/openapi-v1.json
git -C .. diff --exit-code -- docs/api/openapi-v1.json
uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run
uv run python src/manage.py migrate --settings=moviqo.settings.test --noinput
uv run pytest tests/integration --ds=moviqo.settings.integration
uv run python src/manage.py check --deploy --settings=moviqo.settings.production
uv run python src/manage.py health_start
python ../Moviqo.Infrastructure/operations/validate_uat.py
```

Run frontend checks from `Moviqo.Front/`:

```powershell
npm run check:node
npm run test:architecture
npm run check:api-client
npm run test:unit
npm run typecheck
npm run build
npm run test:e2e
npm run test:e2e:preview-qualification
```

`test:e2e:preview-qualification` runs explicit Spanish and English profiles for desktop authoring at 1280 x 720 CSS pixels and representative Pixel 5 / 390 x 844 mobile participation. Its sanitized evidence records the actual Playwright project, browser name and version, viewport, language, reduced-motion mode, and 200% text profile. The result is an accessibility baseline verification, not a formal WCAG conformance claim.

The automated baseline covers axe WCAG A/AA checks, focus visibility, practical 44 x 44 targets, reduced motion, and 200% text reflow. Complete the Spanish and English manual keyboard walkthrough in `Moviqo.Infrastructure/UAT-RELEASE-RUNBOOK.md` before Story 1.35 approval. Playwright's bundled Chromium/WebKit identities do not by themselves prove the current-and-previous released Chrome, Edge, Firefox, and Safari support window; record actual vendor/version coverage and carry gaps as known limitations.

Run the deployed synthetic-only release journey from `Moviqo.Front/` when the UAT host and synthetic helper secret are available:

```powershell
$env:PLAYWRIGHT_DEPLOYED_JOURNEY="1"
$env:MOVIQO_E2E_BASE_URL="https://your-uat-host"
$env:MOVIQO_E2E_SYNTHETIC_KEY="your-synthetic-helper-key"
$env:MOVIQO_E2E_BUILD_ID="build-identifier"
npm run test:e2e:deployed-journey
```

`MOVIQO_E2E_BUILD_ID` must match the build reported by the deployed UAT health contract. The command runs the real thin journey in Spanish and English on the supported desktop-authoring profile. Each run creates a short-lived synthetic scope, waits for confirmed outbox delivery, and retires the generated account in cleanup. CI retains only sanitized JSON evidence and masked screenshots, including the actual browser/version, language, project, and viewport.

Run infrastructure validation from the repository root:

```powershell
python Moviqo.Infrastructure/operations/validate_uat.py
```
