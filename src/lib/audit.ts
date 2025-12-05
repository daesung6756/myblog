import fs from 'fs';
import path from 'path';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'service_role_fallback.log');

function ensureLogDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (e) {
    // swallow; we'll still log to console
  }
}

export function logAudit(event: {
  timestamp?: string;
  route: string;
  method?: string;
  action?: string;
  resource?: string;
  id?: string | number | null;
  user?: { id?: string | null; email?: string | null } | null;
  reason?: string | null;
  extra?: Record<string, any> | null;
}) {
  const entry = {
    timestamp: event.timestamp || new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    ...event,
  };

  // Write to console for immediate visibility
  try {
    console.log('[audit]', JSON.stringify(entry));
  } catch (e) {
    // noop
  }

  // Also append to a file for durable audit trail (best-effort)
  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', { encoding: 'utf8' });
  } catch (e) {
    // failing to write file should not break runtime
    console.error('[audit] failed to write audit log file', e);
  }
}

export default logAudit;
