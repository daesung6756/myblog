import { NextRequest } from "next/server";

// Simple helper: verify presence of a 'token' cookie (example)
export function verifyAuth(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    return Boolean(token);
  } catch (e) {
    return false;
  }
}
