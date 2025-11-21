import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const logDir = process.cwd();
    const file = path.join(logDir, 'diagnostics.log');
    const entry = `[${new Date().toISOString()}] ${JSON.stringify(data)}\n`;
    try {
      fs.appendFileSync(file, entry, { encoding: 'utf8' });
    } catch (e) {
      // ignore file write errors
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
