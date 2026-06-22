import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const pessoa = await prisma.pessoa.update({ where: { id }, data: body });
  return NextResponse.json(pessoa);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.pessoa.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
