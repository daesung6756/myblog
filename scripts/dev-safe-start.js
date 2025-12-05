#!/usr/bin/env node
/*
 * dev-safe-start.js
 * Safe wrapper for starting Next dev. Checks whether the configured PORT
 * is already in use and aborts if another dev server is running.
 * This prevents repeated dev server spawns and the annoying lock/port errors.
 */
const net = require('net');
const child_process = require('child_process');

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const host = '127.0.0.1';

function checkPortInUse(portToCheck, hostToCheck = host, timeoutMs = 700) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    let done = false;
    function finish(val) {
      if (done) return;
      done = true;
      try { s.destroy(); } catch (e) {}
      resolve(val);
    }
    s.setTimeout(timeoutMs);
    s.once('error', () => finish(false));
    s.once('timeout', () => finish(false));
    s.once('connect', () => finish(true));
    s.connect(portToCheck, hostToCheck);
  });
}

(async () => {
  try {
    const inUse = await checkPortInUse(port);
    if (inUse) {
      console.error(`Port ${port} appears to be already in use. Aborting dev server start to avoid collisions.`);
      console.error('If this is unexpected, stop the running process (task manager/ps) or use `npm run dev:force` to override.');
      process.exit(1);
    }

    // No server found, spawn the real dev server.
    console.log(`Starting Next dev on port ${port} — no server detected.`);
    const child = child_process.spawn('npm', ['run', 'dev:run'], {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });

    child.on('exit', (code) => process.exit(code ?? 0));
  } catch (e) {
    console.error('dev-safe-start failed', e);
    process.exit(1);
  }
})();
