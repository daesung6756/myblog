(async () => {
  const urls = [
    'http://localhost:3000/',
    'http://localhost:3000/blog',
    'http://localhost:3000/api/admin/session',
    'http://localhost:3000/api/admin/posts'
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u, { method: 'GET' });
      console.log(`${u} -> ${res.status} ${res.statusText}`);
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const json = await res.json();
        console.log('  JSON:', JSON.stringify(json).slice(0, 200));
      } else {
        const text = await res.text();
        console.log('  Text length:', text.length);
      }
    } catch (err) {
      console.log(`${u} -> ERROR:`, err.message || err);
    }
  }
})();
