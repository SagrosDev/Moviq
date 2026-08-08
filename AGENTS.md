# Repository Agent Instructions

## Frontend

- Functions in `Moviqo.Front/src/**/*.{ts,tsx}` and frontend tests/build scripts should be declared as arrow function constants, for example `export const HomePage = () => { ... };` or `const normalizeValue = (value: string) => { ... };`.
- Avoid `function` declarations for new frontend implementation code unless TypeScript/framework constraints require them, such as overload signatures or intentionally hoisted declarations.

## UAT Backend Deployment

- The actual public UAT application and deployed-journey base URL is `https://moviqo-uat-synthetic.web.app`. Use it for `MOVIQO_E2E_BASE_URL`, public UAT health checks, and other instructions that require the browser-facing UAT origin.
- Some repository deployment-contract files still contain the older `https://uat.moviqo.internal` value. Treat that value as stale rather than as the live UAT host. Reconcile contract, Cloud Run environment, allowed-host, CSRF-origin, and public-app-base-URL values intentionally in a reviewed change; do not silently change live deployment settings.
- The UAT Cloud Run backend is continuously deployed from the connected GitHub repository through its existing Google Cloud Build trigger. A normal backend release starts by merging or pushing to the configured deployment branch; Google Cloud builds the container image, pushes it, and deploys the Cloud Run revision.
- Preserve this established GitHub-to-Cloud-Run workflow. Do not tell the user to perform a separate local Docker or `gcloud builds submit` build, image push, or manual service deployment unless the user explicitly requests a manual recovery procedure or the existing continuous-deployment trigger is unavailable.
- The backend container currently starts Gunicorn directly; the repository Dockerfile does not run Django migrations. Never assume that the GitHub-connected Cloud Run deployment applies migrations automatically.
- The existing dedicated Cloud Run migration job is named `moviqo-back-uat-migrate`. Reuse and update that job for backend migrations; do not create a duplicate migration job.
- `Moviqo.Infrastructure/modules/cloud-run-job.json` declares an intended email-delivery job named `moviqo-uat-outbox-drain`, but that job has not been created in Google Cloud. Treat it as a repository contract only: do not claim it is deployed, do not confuse it with `moviqo-back-uat-migrate`, and do not create it unless the user explicitly requests provisioning it.
- For a release containing Django migrations, first inspect the migration operations and the existing Cloud Build trigger. Prefer adding execution of `moviqo-back-uat-migrate` to the established Cloud Build release path, using the exact image built for the commit, the migration service account, and the migration database credential. Do not introduce a second, unrelated deployment process.
- Order automated releases as: build the commit image, run its required migrations successfully, deploy that exact image to Cloud Run, verify `/api/v1/health/start/` reports the expected build and `synthetic-only`, and only then run the deployed journey.
- The `deployed-journey` test must target the exact deployed commit. Do not treat a run that races the Cloud Run deployment as a valid release result; trigger or rerun it only after the matching revision is ready.
- Repository deployment contracts describe required UAT configuration but do not prove that external Google Cloud trigger settings perform a step. Clearly distinguish repository evidence from settings that must be verified in the Google Cloud console.
