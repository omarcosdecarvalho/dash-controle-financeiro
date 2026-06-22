import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fatura = await prisma.fatura.findUnique({
    where: { id },
    include: { itens: { orderBy: { createdAt: "asc" } } },
  });
  if (!fatura) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  return NextResponse.json(fatura);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.fatura.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
