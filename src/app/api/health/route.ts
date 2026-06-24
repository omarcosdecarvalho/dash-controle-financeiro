import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Ping no banco para manter o Supabase acordado
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "alive" }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, db: "unreachable" }, { status: 503 });
  }
}
