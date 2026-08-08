FROM python:3.14.6-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml uv.lock README.md ./

RUN python -m pip install --no-cache-dir uv==0.8.4 \
    && uv sync --frozen --no-dev

COPY src ./src

ENV PYTHONPATH=/app/src
ENV DJANGO_SETTINGS_MODULE=moviqo.settings.production

CMD ["/bin/sh", "-c", "exec /app/.venv/bin/gunicorn moviqo.wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers 2 --threads 4 --timeout 60 --access-logfile - --error-logfile -"]
