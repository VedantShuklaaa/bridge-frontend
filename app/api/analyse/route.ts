import { NextResponse } from "next/server";

// TODO(foundation): proxy to the indexer with input validation, timeouts,
// body-size caps and rate limiting. Placeholder so the route exists and builds.
export async function GET() {
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501, headers: { "Cache-Control": "no-store" } },
  );
}
