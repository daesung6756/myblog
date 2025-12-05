import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Admin E2E flow (debug session helper)', () => {
  test('login via dev helper then create, update, delete post + upload image', async ({ request }) => {
    // 1) Use debug helper to set dev session cookies and capture set-cookie header
    const logRes = await request.post('/api/admin/debug/set-dev-session', { data: { email: 'dev@example.local' } });
    expect(logRes.ok()).toBeTruthy();
    // Extract Set-Cookie header values and build Cookie header
    const setCookie = logRes.headers()['set-cookie'];
    expect(setCookie).toBeTruthy();

    // Build cookie header string (Playwright API `request` has its own cookies but we'll pass in header)
    let cookieHeader = '';
    if (Array.isArray(setCookie)) cookieHeader = setCookie.map((c) => c.split(';')[0]).join('; ');
    else cookieHeader = String(setCookie).split(';')[0];

    // 2) Create a post using admin cookie
    const createRes = await request.post('/api/admin/posts', {
      headers: { cookie: cookieHeader, 'content-type': 'application/json' },
      data: { title: 'e2e test post', slug: `e2e-test-${Date.now()}`, content: 'created-by-e2e' },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = await createRes.json();
    expect(created?.success).toBeTruthy();
    const postId = created?.post?.id;
    expect(postId).toBeTruthy();

    // 3) Update the post
    const updateRes = await request.put('/api/admin/posts', {
      headers: { cookie: cookieHeader, 'content-type': 'application/json' },
      data: { id: postId, title: 'e2e test post (updated)' },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updated = await updateRes.json();
    expect(updated?.success).toBeTruthy();

    // 4) Upload an image using multipart form (small generated blob)
    // Skip upload if service role not configured in environment (CI may require real creds)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('Skipping upload test: SUPABASE_SERVICE_ROLE_KEY not set in environment');
    } else {
    // use Playwright multipart helper to send a small test file
    // Try the server-side route /api/upload-image (uses server admin client) which
    // is more likely to work in CI/dev if SUPABASE_SERVICE_ROLE_KEY and bucket exist.
    const uploadRes = await request.post('/api/upload-image', {
      headers: { cookie: cookieHeader },
      multipart: {
        file: {
          name: 'e2e.jpg',
          mimeType: 'image/jpeg',
          // minimal fake jpeg header + some bytes to fool simple validators
          buffer: Buffer.from([0xff,0xd8,0xff,0xdb,0x00,0x43,0x00,0x03,0x02,0x02,0x03,0x02,0x02,0x03,0x03,0x03,0x03,0x04]),
        },
      },
    });
    if (!uploadRes.ok()) {
      const text = await uploadRes.text();
      console.error('Upload response status:', uploadRes.status, 'body:', text);
    }
    expect(uploadRes.ok()).toBeTruthy();
    const up = await uploadRes.json();
    // upload-image returns { publicUrl } on success
    expect(up?.publicUrl || up?.success).toBeTruthy();

    }

    // 5) Delete the post
    const deleteRes = await request.delete('/api/admin/posts', {
      headers: { cookie: cookieHeader, 'content-type': 'application/json' },
      data: { id: postId },
    });
    expect(deleteRes.ok()).toBeTruthy();
    const d = await deleteRes.json();
    expect(d?.success).toBeTruthy();
  });
});
