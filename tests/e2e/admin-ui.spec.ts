import { test, expect } from '@playwright/test';

test.describe('Admin UI E2E', () => {
  test('login via debug helper + create/edit/delete post through UI', async ({ page, request }) => {
    // Set dev session using helper so browser will have an admin-session cookie
    const email = `ui-test+${Date.now()}@example.local`;
    // If possible, create a server-signed admin-session token for the browser
    // context so UI paths can authenticate. We try to load ADMIN_SESSION_SECRET
    // from .env.local (dev) so tests can generate a token locally.
    const fs = require('fs');
    try {
      const envFile = '.env.local';
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        const match = content.match(/^ADMIN_SESSION_SECRET=(.*)$/m);
        if (match) process.env.ADMIN_SESSION_SECRET = match[1];
      }
    } catch (e) {}

    // Use the debug helper to obtain a server-side dev token (if available).
    // For robustness we don't rely on Set-Cookie headers — instead we always
    // set a simple sb-access-token plus a signed admin-session (from the
    // response body or generated locally) into the Playwright browser context
    // so UI flows can run deterministically.
    const res = await request.post('/api/admin/debug/set-dev-session', { data: { email } });
    expect(res.ok()).toBeTruthy();
    const resBody = await res.json().catch(() => ({}));

    // Determine admin-session value: prefer server-provided adminSession, fall
    // back to locally signing using .env.local if possible.
    let adminToken: string | null = null;
    if (resBody?.adminSession) adminToken = resBody.adminSession;
    if (!adminToken) {
      try {
        const fs = require('fs');
        if (fs.existsSync('.env.local')) {
          const content = fs.readFileSync('.env.local', 'utf8');
          const m = content.match(/^ADMIN_SESSION_SECRET=(.*)$/m);
          if (m) process.env.ADMIN_SESSION_SECRET = m[1];
        }
        const adminSessionLib = require('../../src/lib/admin-session');
        const localToken = adminSessionLib.signAdminSession({ id: `ui-${email}`, email, role: 'admin' }, 60 * 60);
        if (localToken) adminToken = localToken;
      } catch (e) {
        // if signing fails, tests will still try to proceed but likely fail
        console.warn('failed to create local admin-session token', e?.message || e);
      }
    }
    

    const cookiesToAdd: any[] = [];
    // always set an access token so API calls with it behave consistently
    cookiesToAdd.push({ name: 'sb-access-token', value: `dev-access-token-for:${email}`, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax', expires: Math.floor(Date.now() / 1000) + 60 * 60 });
    if (adminToken) cookiesToAdd.push({ name: 'admin-session', value: adminToken, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax', expires: Math.floor(Date.now() / 1000) + 3600 });
    console.log('cookies ->', JSON.stringify(cookiesToAdd, null, 2));
    await page.context().addCookies(cookiesToAdd);
    // Confirm cookies are present in browser context
    const ctxCookies = await page.context().cookies('http://localhost:3000');
    console.log('context cookies ->', JSON.stringify(ctxCookies, null, 2));
    const hasAdmin = ctxCookies.some((c) => c.name === 'admin-session');
    expect(hasAdmin).toBeTruthy();

    // Navigate to admin posts list and create a new post
    await page.goto('/admin/posts');
    await expect(page.locator('h1')).toBeVisible(); // page loaded

    // Debug: check what headers the server sees — this helps verify whether
    // the admin-session cookie is being sent by the browser on requests.
    const echo = await page.evaluate(async () => (await fetch('/api/debug/echo-headers', { credentials: 'include' })).json());
    console.log('server sees header cookie:', echo?.cookie);
    const envCheck = await request.get('/api/debug/inspect-env');
    console.log('server has ADMIN_SESSION_SECRET?', await envCheck.json());

    // Sanity-check: call the dev-only server verify endpoint with the
    // exact admin-session token value we got from the Set-Cookie header so we
    // can confirm whether the token itself verifies on the server.
    const adminCookieObj = cookiesToAdd.find((c) => c.name === 'admin-session');
    if (adminCookieObj) {
      const verifyRes = await request.post('/api/admin/debug/verify-token', { data: { token: adminCookieObj.value } });
      console.log('verify-token ->', await verifyRes.json());
    }

    // Verify that the browser session is recognized by the API
    const sessionInfo = await page.evaluate(async () => (await fetch('/api/admin/session', { credentials: 'include' })).json());
    // Also try calling the same endpoint from the test request context but
    // explicitly pass the cookie header the server reported; this helps
    // determine whether server-side verification fails even when cookies are
    // present on the wire.
    const serverSideCheck = await request.get('/api/admin/session', { headers: { cookie: echo?.cookie || '' } });
    console.log('server-side check ->', await serverSideCheck.json());
    expect(sessionInfo?.hasSession).toBeTruthy();

    // Navigate to new post form directly
    await page.goto('/admin/posts/new');
    await page.waitForSelector('input[name="title"]', { timeout: 10_000 });

    const rand = String(Date.now());
    await page.fill('input[name="title"]', 'UI E2E Test ' + rand);
    await expect(page.locator('h1')).toContainText(/포스트/); // page loaded

    // EditorJS mounts into a holder with id starting with editorjs-.
    // Wait for editor to initialize and fill the first contenteditable block.
    await page.waitForSelector('[id^="editorjs-"] [contenteditable="true"]', { timeout: 10_000 });
    const editorFirst = page.locator('[id^="editorjs-"] [contenteditable="true"]').first();
    await editorFirst.click();
    await editorFirst.type('This post created by UI E2E test');

    // submit form
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/admin/posts') && r.status() < 500),
      page.click('button[type="submit"]'),
    ]);

    // After create, navigate back to list and find created post
    await page.goto('/admin/posts');
    const row = page.locator('table').locator('tr').filter({ hasText: 'UI E2E Test' }).first();
    await expect(row).toContainText('UI E2E Test');

    // Click edit on the created post (assumes edit link contains /admin/posts/edit/)
    await row.locator('a[href*="/admin/posts/edit/"]').click();
    await expect(page).toHaveURL(/\/admin\/posts\/edit\//);

    // Update title
    await page.fill('input[name="title"]', 'UI E2E Test (edited) ' + rand);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/admin/posts') && r.status() < 500),
      page.click('button[type="submit"]'),
    ]);

    // Return to list and assert edited title present
    await page.goto('/admin/posts');
    await expect(page.locator('table').locator('tr').filter({ hasText: 'edited' })).toHaveCount(1);

    // Delete the edited post
    const editedRow = page.locator('table').locator('tr').filter({ hasText: 'UI E2E Test (edited)' }).first();
    await editedRow.locator('button[aria-label="Delete"]').click({ force: true }).catch(() => {});
    // Depending on implementation a confirm may appear; try to confirm
    if (await page.locator('button:has-text("확인")').count()) {
      await page.click('button:has-text("확인")');
    }

    // Ensure deletion succeeded (row disappears)
    await expect(page.locator('table').locator('tr').filter({ hasText: 'UI E2E Test (edited)' })).toHaveCount(0);
  });
});
