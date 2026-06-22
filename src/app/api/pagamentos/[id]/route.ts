import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pagamento = await prisma.pagamento.findUnique({ where: { id } });
  if (pagamento?.parcelaId) {
    await prisma.parcela.update({ where: { id: pagamento.parcelaId }, data: { pago: false } });
  }
  await prisma.pagamento.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
