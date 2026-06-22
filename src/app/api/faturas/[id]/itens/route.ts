import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const itens = await prisma.itemFatura.findMany({ where: { faturaId: id } });
  return NextResponse.json(itens);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const item = await prisma.itemFatura.create({
    data: { ...body, faturaId: id, valor: parseFloat(body.valor) },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: faturaId } = await params;
  const body = await req.json();
  // bulk update: marcar item como importado e criar lançamento
  const { itemId, lancamentoId } = body;
  const item = await prisma.itemFatura.update({
    where: { id: itemId },
    data: { importado: true, lancamentoId },
  });
  // atualiza status da fatura se todos itens importados
  const todos = await prisma.itemFatura.findMany({ where: { faturaId } });
  if (todos.every((i) => i.importado)) {
    await prisma.fatura.update({ where: { id: faturaId }, data: { status: "revisado" } });
  } else {
    await prisma.fatura.update({ where: { id: faturaId }, data: { status: "em_revisao" } });
  }
  return NextResponse.json(item);
}
