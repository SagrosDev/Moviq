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
```

Run the deployed synthetic-only release journey from `Moviqo.Front/` when the UAT host and synthetic helper secret are available:

```powershell
$env:PLAYWRIGHT_DEPLOYED_JOURNEY="1"
$env:MOVIQO_E2E_BASE_URL="https://your-uat-host"
$env:MOVIQO_E2E_SYNTHETIC_KEY="your-synthetic-helper-key"
$env:MOVIQO_E2E_BUILD_ID="build-identifier"
npm run test:e2e:deployed-journey
```

Run infrastructure validation from the repository root:

```powershell
python Moviqo.Infrastructure/operations/validate_uat.py
```
