# Moviqo Infrastructure

This root contains the synthetic-only UAT deployment contract for Story 1.5.

## Verification

Run the static UAT validation from the repository root:

```powershell
python Moviqo.Infrastructure/operations/validate_uat.py
```

## Operator prerequisites

Operators must provide the following runtime values before deploying `moviqo-back-uat`:

- `MOVIQO_ENVIRONMENT_CLASS=synthetic-only`
- `MOVIQO_BUILD_ID`
- `MOVIQO_SERVICE_CLASS`
- `MOVIQO_SERVICE_NAME`
- `MOVIQO_SECRET_KEY`
- `MOVIQO_ALLOWED_HOSTS`
- `MOVIQO_DB_NAME`
- `MOVIQO_DB_USER`
- `MOVIQO_DB_HOST`
- `MOVIQO_DB_PORT`
- `MOVIQO_CLOUD_PROJECT_ID`
- `MOVIQO_DJANGO_SECRET_KEY_SECRET`
- `MOVIQO_DB_PASSWORD_SECRET`
- `MOVIQO_RESEND_API_KEY_SECRET`
- `MOVIQO_GCS_PRIVATE_BUCKET`
- `MOVIQO_GCS_QUARANTINE_BUCKET`
- `MOVIQO_GCS_CLEAN_BUCKET`
- `MOVIQO_FILE_INSPECTION_ADAPTER=synthetic`
- `MOVIQO_MESSAGE_DELIVERY_ADAPTER=resend-outbox`
- `MOVIQO_CACHE_POLICY=firebase-hosting-no-store`
- `MOVIQO_LIVE_MALWARE_SCANNING=disabled-by-gate`
- `MOVIQO_INDEPENDENT_BACKUPS=disabled-by-gate`
- `MOVIQO_LIFECYCLE_SCHEDULES=disabled-by-gate`

Cloud Run injects server-side secrets into the runtime environment:

- `MOVIQO_SECRET_KEY` from `MOVIQO_DJANGO_SECRET_KEY_SECRET`
- `MOVIQO_DB_PASSWORD` from `MOVIQO_DB_PASSWORD_SECRET`
- `MOVIQO_RESEND_API_KEY` from `MOVIQO_RESEND_API_KEY_SECRET`

Firebase Hosting serves the built SPA from `Moviqo.Front/dist`, rewrites `/api/**` to the Cloud Run service in `us-east1`, applies `no-store` to the SPA shell and authenticated routes, and keeps only public landing content plus hashed assets cacheable.
