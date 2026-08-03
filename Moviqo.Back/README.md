# Moviqo.Back

Backend spine for Moviqo.

## Local verification

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
```

The project intentionally excludes AI, broker, Redis, Celery, distributed cache, and microservice dependencies.
