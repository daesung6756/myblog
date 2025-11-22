import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Build an object of headers for easy JSON serialization
    const headersObj: Record<string, string> = {};
    for (const [k, v] of request.headers) {
      headersObj[k] = v;
    }

    return NextResponse.json({
      cookie: request.headers.get("cookie"),
      headers: headersObj,
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
