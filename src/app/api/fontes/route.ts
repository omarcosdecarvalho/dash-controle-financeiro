import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const fontes = await prisma.fonteDivida.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(fontes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const fonte = await prisma.fonteDivida.create({ data: body });
  return NextResponse.json(fonte, { status: 201 });
}
