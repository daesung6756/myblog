import { NextResponse, type NextRequest } from "next/server";
import { verifyAuth } from "./src/middleware/auth";

export function middleware(req: NextRequest) {
  // Example: protect /admin routes and redirect to /login if not authed
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!verifyAuth(req)) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  const res = NextResponse.next();
  res.headers.set("x-myblog", "1");
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
