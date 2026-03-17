import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DISABLED_MESSAGE = "Le système de messages est désactivé sur cette plateforme.";

export async function POST() {
  return NextResponse.json({ error: DISABLED_MESSAGE }, { status: 410 });
}

export async function GET() {
  return NextResponse.json({ error: DISABLED_MESSAGE }, { status: 410 });
}
