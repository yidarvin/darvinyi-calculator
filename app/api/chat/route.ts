import { NextResponse } from "next/server";

// TODO: POST { messages } → 5s forced delay → streamed Claude response
export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
