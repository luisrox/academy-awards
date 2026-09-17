import { NextResponse } from "next/server";
import { getSearchIndex } from "@/lib/ceremony-data";

export const runtime = "nodejs";
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(getSearchIndex());
}