# Technology Currency Review

## Verdict

Pass. Every named implementation technology was checked against its official project release/support source on 2026-08-01. No obsolete starter or unsupported pairing is embedded in the spine.

## Verification

| Technology | Architecture seed | Review result |
| --- | --- | --- |
| Python | 3.14.6 | Current stable maintenance release; compatible with the selected Django line |
| Django | 5.2.15 LTS | Supported LTS chosen deliberately over the shorter-lived 6.x feature line |
| Django REST Framework | 3.17.1 | Current and supports Django 5.2/Python 3.14 |
| Psycopg | 3.3.4 | Current Psycopg 3 driver line |
| drf-spectacular | 0.30.0 | Current published line and compatible with selected Django/DRF |
| PostgreSQL | 17.10 | Supported; selected to match Supabase's current default major |
| Node.js | 26.5.1 | Approved frontend runtime baseline |
| TypeScript | 6.0.x | Current release line |
| React | 19.2.7 | Current stable release |
| Vite | 8.2.x | Current regular patch line |
| React Flow | 12.11.2 | Current published release |
| ClamAV | 1.5.3 | Current stable seed for the later real-data adapter |
| pytest | 9.1.1 | Current release; Python 3.14 supported |
| Playwright | 1.62.x | Current official release-notes line |

## Findings

None blocking. Package resolution during scaffolding must lock exact transitive versions and run compatibility tests; that implementation lockfile does not alter the architecture decision.

## Primary sources

- Python releases: https://www.python.org/downloads/
- Django support table: https://www.djangoproject.com/download/
- PostgreSQL version policy: https://www.postgresql.org/support/versioning/
- Node.js releases: https://nodejs.org/en/about/previous-releases
- React versions: https://react.dev/versions
- Vite releases: https://vite.dev/releases
- TypeScript 6.0 notes: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
- pytest package history: https://pypi.org/project/pytest/
- Playwright release notes: https://playwright.dev/docs/release-notes
