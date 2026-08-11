# Moviqo UAT Release Runbook

Start this checklist before every pull request is merged to `main`, then complete its post-merge verification steps after the merge.

## Fixed UAT Resources

| Resource | Value |
|---|---|
| Google Cloud project | `moviqo-uat-synthetic` |
| Region | `us-east1` |
| Public UAT application | <https://moviqo-uat-synthetic.web.app> |
| Public health endpoint | <https://moviqo-uat-synthetic.web.app/api/v1/health/start/> |
| Backend service | `moviqo-back-uat` |
| Migration job | `moviqo-back-uat-migrate` |
| Email outbox job | `moviqo-uat-outbox-drain` |
| Outbox Scheduler | `moviqo-uat-outbox-drain-every-minute` |
| Runtime service account | `moviqo-uat-runner@moviqo-uat-synthetic.iam.gserviceaccount.com` |
| Resend domain | `updates.mymoviqo.com` |
| Resend sender | `Moviqo <notifications@updates.mymoviqo.com>` |

Do not use the nonexistent `moviqo-uat-jobs@...` identity, the default Compute Engine service account, `onboarding@resend.dev`, or a `moviqo.local` sender.

## Decide What Must Be Updated

| Change merged to `main` | Backend service | Migration job | Outbox job | Firebase Hosting | Resend |
|---|---|---|---|---|---|
| Documentation or tests only | No manual action | No | No | No | No |
| Frontend implementation only | No manual action | No | No | Deploy | No |
| Backend implementation without migrations or messaging changes | Automatic deployment; verify it | No execution | Update to the same image as a safe default | No | No |
| New Django migration | Deploy only after the migration job succeeds | Update to the exact built image and execute before service deployment | Update to the exact image | Only if frontend also changed | No |
| Email, invitation, verification, outbox, or shared backend dependency change | Automatic deployment; verify it | Only when migrations exist | Update to the exact image | Only if frontend also changed | No |
| Firebase routing or Hosting configuration change | Only if backend also changed | Only when migrations exist | Only if backend also changed | Deploy | No |
| Resend API key, sender, or domain change | Update affected runtime configuration | No | Update affected runtime configuration | No | Update Resend/Cloudflare |

The safest default for a backend runtime release is to keep `moviqo-back-uat`, `moviqo-back-uat-migrate`, and `moviqo-uat-outbox-drain` configured with the same container image. Execute the migration job only when the release contains unapplied Django migrations.

## Standard Release Checklist

### 1. Classify the change before merging

Before merging, identify whether the pull request changes:

- frontend or Firebase Hosting files;
- backend runtime code or dependencies;
- Django migration files; or
- email, invitation, verification, or outbox behavior.

For a migration release, inspect the migration operations and the existing Cloud Build trigger before merging. The release path must use the existing `moviqo-back-uat-migrate` job and enforce this order:

1. build the commit image;
2. update `moviqo-back-uat-migrate` to that exact image;
3. execute the migration job successfully;
4. deploy that exact image to `moviqo-back-uat`;
5. verify health; and
6. run the deployed journey.

Repository files describe this required contract but do not prove the external Google Cloud trigger enforces it. If the trigger still deploys the service immediately after building, **stop and do not merge a migration release**. Update the established Cloud Build release path in a reviewed change first. Do not create a second deployment process or duplicate migration job.

### 2. Record the merge commit

In GitHub, open the merged pull request and copy the full merge commit SHA. This is the release identifier used by the health check and deployed journey.

GitHub Actions: <https://github.com/SagrosDev/Moviq/actions/workflows/ci.yml>

### 3. Wait for the backend continuous deployment

The connected GitHub-to-Cloud-Run trigger builds and deploys `moviqo-back-uat`. Do not run a separate local Docker build, image push, `gcloud builds submit`, or manual source deployment during a normal release.

For a release without migrations:

1. Open Cloud Build history and locate the successful build for the merge commit.
2. Open the newest `moviqo-back-uat` revision.
3. Confirm `Ready`, `100%` traffic, and the expected source commit.
4. Confirm the revision uses the immutable image produced by that Cloud Build execution.
5. Open the health endpoint and confirm `build` equals the full merge commit and `environmentClass` equals `synthetic-only`.

For a release with migrations, confirm Cloud Build performed the migration sequence from Step 1 before it deployed the service revision.

If revision source, immutable image, or health build does not match the merge commit, **stop the release**. Do not change `MOVIQO_BUILD_ID` merely to make health claim the desired commit: that does not prove the container image contains that source. Compare the Cloud Build artifact with the revision image and repair the established trigger or build configuration.

### 4. Verify migrations when required

This section is required only when the merged changes include a new file under a Django `migrations` directory or otherwise require unapplied migrations.

1. Open the Cloud Build execution for the merge commit and copy its immutable container image reference.
2. Confirm `moviqo-back-uat-migrate` used that exact image before the service deployment step.
3. Confirm its existing command, arguments, service account, database settings, and secret references were preserved.
4. Require a green execution, task exit code `0`, and migration output ending in `OK` or `No migrations to apply`.
5. Confirm Cloud Build deployed the same image to `moviqo-back-uat` only after the job succeeded.

Do not manually rerun a migration that already completed successfully unless the migration state and failure mode have first been inspected.

### 5. Update the outbox job for backend releases

For a backend runtime release, keep the scheduled worker on the same image as the service:

1. Copy the exact container image URL from the ready `moviqo-back-uat` revision.
2. Open `moviqo-uat-outbox-drain` and select **View and edit job configuration**.
3. Set its container image to the exact service image.
4. Set `MOVIQO_BUILD_ID` to the full merge commit if that variable is present.
5. Preserve its command, arguments, service account, environment variables, and secret references.
6. Save the job.
7. Let Cloud Scheduler invoke it normally; a manual execution is optional after an email-related change.
8. Confirm the Scheduler attempt returns HTTP `200` and the resulting Cloud Run Job execution finishes with exit code `0`.

A Scheduler HTTP `200` proves only that Cloud Run accepted the execution request. The separate Cloud Run execution must also succeed.

### 6. Deploy Firebase when frontend or Hosting files changed

GitHub Actions currently validates and builds the frontend but does not deploy Firebase Hosting. The frontend requires Node `26.7.0` and npm `11.x`.

Authenticate the Firebase CLI once on a workstation, or again if its login expires:

```powershell
npx firebase-tools@15.24.0 login
```

For every frontend release, run the following commands from the repository root in PowerShell:

```powershell
git status --short
git switch main
git pull --ff-only
git rev-parse HEAD
node --version
npm --version

Set-Location Moviqo.Front
npm ci --legacy-peer-deps
npm run stage:firebase

Set-Location ../Moviqo.Infrastructure
npx firebase-tools@15.24.0 deploy --only hosting --project moviqo-uat-synthetic

Set-Location ..
```

Before switching branches, `git status --short` must return no output; stop and preserve any local changes if it does. Confirm `git rev-parse HEAD` is the merge commit being released. The `stage:firebase` command builds `Moviqo.Front/dist` and refreshes `Moviqo.Infrastructure/dist`; the deploy command publishes only Hosting content and configuration.

After deployment:

1. Confirm the Firebase CLI reports a successful Hosting release.
2. Open <https://moviqo-uat-synthetic.web.app> in a private/incognito browser window.
3. Confirm the application loads and `/api/v1/health/start/` still reaches Cloud Run.

The reviewed Firebase CLI version is pinned to `15.24.0`; update that version only in a reviewed runbook change.

### 7. Do not update Resend for normal releases

Normal backend and frontend deployments require no Resend console change. Update Resend only when:

- rotating the API key;
- replacing or adding a verified sending domain;
- changing `MOVIQO_RESEND_FROM_EMAIL`; or
- diagnosing a provider-side rejection or delivery problem.

For API-key rotation:

1. Create a Resend key with **Sending access**.
2. Add it as a new enabled version of Secret Manager secret `moviqo-uat-resend-api-key`.
3. Keep Cloud Run references on `latest`; never paste the key into a plain environment variable.
4. Deploy a new backend service revision so running service instances load the new secret.
5. The next outbox job execution starts a new container and should resolve the latest enabled secret version.
6. Verify one successful Resend `/emails` request before disabling the old secret version or old Resend key.

Do not change the verified `updates.mymoviqo.com` DNS records during an ordinary release.

### 8. Run the live journey last

Run or rerun `deployed-journey` only after every required target is ready:

- backend revision is ready and serves `100%` traffic;
- health reports the exact merge commit and `synthetic-only`;
- required migrations succeeded;
- outbox job uses the intended backend image and its latest execution succeeds;
- Firebase Hosting was deployed when frontend files changed.

The GitHub workflow currently starts `deployed-journey` immediately on pushes to `main`, so it can race the Cloud Run or Firebase deployment. A raced run is not valid release evidence. Rerun it after UAT reports the exact commit.

### 9. Record the stakeholder preview accessibility baseline

After the exact-build deployed journey passes, run `npm run test:e2e:preview-qualification` from `Moviqo.Front/` and record its sanitized evidence. This is an **accessibility baseline verification**, not a formal WCAG conformance claim.

Complete the following keyboard walkthrough once in Spanish and once in English on the supported desktop-authoring profile. Repeat the participant steps on the representative mobile profile with touch/pointer operation.

| Surface | Keyboard walkthrough | Evidence to record |
|---|---|---|
| Registration | Tab through language, fields, consent controls, validation, and submit; correct one validation error. | Logical order, visible focus, associated error, localized announcement. |
| Sign-in | Reach email, password, recovery link, and submit without a pointer. | Labels, visible focus, failure announcement, no lost value after correction. |
| Workflow authoring | Create the Workflow, add/connect Start-Task-End, configure publication, create/bind the field, and publish. | 1280 x 720 or larger viewport, visible focus, no keyboard trap, Designer text preserved across language switch. |
| Task Form | Enter, save, retry one recoverable failure, and complete without a confirmation dialog. | Preserved value, status announcement only after server response, focus remains actionable. |
| Process timeline | Open My Processes and the completed Process detail. | Heading order, readable event sequence, localized owned labels, no restricted Process Data. |

Record the date, reviewer, build SHA, UAT origin, browser name and actual version, Playwright project/device, CSS viewport, language, text scale, reduced-motion mode, pass/fail, safe evidence links, and known limitations. Do not record passwords, verification tokens, cookies, raw email bodies, or Process Field values. A missing language, surface, or evidence field blocks Story 1.35 approval rather than being waived in notes.

Known Epic 1 limitation: the thin preview has no user-facing destructive or irreversible command. Record that confirmation behavior is not exercised rather than inventing a destructive control. Routine Workflow/Form save, Task save, and Task completion must remain confirmation-free and must not show success before the server response.

## Console Links

### Google Cloud

- Project home: <https://console.cloud.google.com/home/dashboard?project=moviqo-uat-synthetic>
- Cloud Build history: <https://console.cloud.google.com/cloud-build/builds?project=moviqo-uat-synthetic>
- Cloud Build triggers: <https://console.cloud.google.com/cloud-build/triggers?project=moviqo-uat-synthetic>
- Cloud Run resources: <https://console.cloud.google.com/run?project=moviqo-uat-synthetic>
- Backend service: <https://console.cloud.google.com/run/detail/us-east1/moviqo-back-uat/revisions?project=moviqo-uat-synthetic>
- Migration job: <https://console.cloud.google.com/run/jobs/details/us-east1/moviqo-back-uat-migrate?project=moviqo-uat-synthetic>
- Outbox job: <https://console.cloud.google.com/run/jobs/details/us-east1/moviqo-uat-outbox-drain?project=moviqo-uat-synthetic>
- Cloud Scheduler: <https://console.cloud.google.com/cloudscheduler?project=moviqo-uat-synthetic>
- Logs Explorer: <https://console.cloud.google.com/logs/query?project=moviqo-uat-synthetic>
- Secret Manager: <https://console.cloud.google.com/security/secret-manager?project=moviqo-uat-synthetic>
- Artifact Registry: <https://console.cloud.google.com/artifacts?project=moviqo-uat-synthetic>
- IAM: <https://console.cloud.google.com/iam-admin/iam?project=moviqo-uat-synthetic>

### Firebase and Resend

- Firebase Hosting: <https://console.firebase.google.com/project/moviqo-uat-synthetic/hosting>
- Resend email logs: <https://resend.com/emails>
- Resend domains: <https://resend.com/domains>
- Resend API keys: <https://resend.com/api-keys>

## Stop Conditions

Do not run or accept the deployed journey when any of these is true:

- the backend health build does not equal the merge commit;
- a required migration execution failed or was not run;
- the outbox Scheduler does not return HTTP `200`, or the resulting Cloud Run Job execution fails or has a nonzero exit code;
- the service and required jobs use unrelated backend images;
- Firebase still serves an older frontend build; or
- Resend rejects the request or shows no activity for an expected email.

Do not create replacement services, migration jobs, outbox jobs, service accounts, secrets, or Scheduler jobs as a shortcut. Reuse and repair the named UAT resources above.
