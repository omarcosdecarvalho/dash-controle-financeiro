import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const pessoas = await prisma.pessoa.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(pessoas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pessoa = await prisma.pessoa.create({ data: body });
  return NextResponse.json(pessoa, { status: 201 });
}
