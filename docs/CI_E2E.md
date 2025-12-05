CI E2E (Playwright) — Setup & Secrets

Purpose
- Explain what CI needs to run Playwright E2E tests for the admin flows (including server-side uploads).
- Describe the repository secrets to configure so tests can run securely in CI without leaking keys.

Required GitHub repository secrets
- NEXT_PUBLIC_SUPABASE_URL
  - The public URL for your Supabase project (ex: https://xyz.supabase.co)
- NEXT_PUBLIC_SUPABASE_ANON_KEY
  - The client/anon key used by the public (frontend) client.
- SUPABASE_SERVICE_ROLE_KEY
  - The server-side service role key (highly privileged). MUST be stored as a secret and not exposed to the client.
- ADMIN_SESSION_SECRET
  - Strong random secret used to HMAC-sign server-side `admin-session` tokens.
- ALLOW_SERVICE_ROLE_FALLBACK (recommended set to "true" in CI)
  - Optional; when `true`, tests and the app will allow service-role fallbacks in server endpoints. Keep false in production unless audited.

How the GitHub Actions workflow uses these
- The workflow in `.github/workflows/e2e.yml` maps these secrets into environment variables used by the app and tests.
- Playwright tests will start the local dev server and run the E2E scenario(s). The test runner requires that the Supabase service role and admin session secret be set in CI for storage-related tests.

Setting Secrets on GitHub
1) Open your repository on GitHub
2) Go to Settings -> Secrets -> Actions
3) Add these secrets with the exact names listed above

CI considerations
- The `SUPABASE_SERVICE_ROLE_KEY` is sensitive and should only be available in the Actions environment. Make sure it is not accidentally logged anywhere (we avoid printing tokens in logs in this codebase by masking previews).
- Prefer a dedicated test project on Supabase for CI (with a test database and a storage bucket) so test data won't interfere with production data.
- If you have limits / cost concerns, run E2E only on main branch or PRs selectively.
- Consider limiting the scope of the service role key (where supported) and using short-lived test credentials.

Troubleshooting
- If tests fail in CI with Unauthorized or upload errors:
  Additional CI improvements applied
  - concurrency control: workflow cancels in-progress runs on the same ref to avoid conflicting runs
  - caching: node_modules and Playwright browser caches are used to speed up runs
  - secrets validation: CI now validates required secrets and fails early if missing
  - artifacts: HTML test reports are uploaded on all runs; failure traces/logs are uploaded when tests fail

  Example: How to add a secret in GitHub
  1. Go to your repo → Settings → Secrets → Actions
  2. Click "New repository secret"
  3. Name it exactly (e.g. SUPABASE_SERVICE_ROLE_KEY) and paste the value
  4. Save and repeat for other required secrets

  Optional: Protect main branch and require E2E to pass before merge
  - Go to Settings → Branches → Add rule for main
  - Require status checks to pass — add the E2E workflow check

  - Confirm secrets are set and correct (esp. SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL)
  - Ensure the storage bucket exists and the service-role has permissions
  - Check Playwright report artifact (HTML) attached to the workflow run for context

Local debug notes
- You can run tests locally without CI; ensure `.env.local` contains the same env var values, or inject them into your shell before running `npx playwright test`.

Security: DO NOT COMMIT secrets
- Keep the service role and admin session secret only in CI secrets or private env stores.
