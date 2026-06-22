import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const emprestimo = await prisma.emprestimo.update({
    where: { id },
    data: {
      descricao:          body.descricao,
      credor:             body.credor ?? null,
      valorTotal:         parseFloat(body.valorTotal),
      valorParcela:       parseFloat(body.valorParcela),
      quantidadeParcelas: parseInt(body.quantidadeParcelas),
      parcelaAtual:       parseInt(body.parcelaAtual),
      dataInicio:         new Date(body.dataInicio),
      observacao:         body.observacao ?? null,
      fonteId:            body.fonteId  || null,
      pessoaId:           body.pessoaId || null,
    },
    include: { fonte: true, pessoa: true },
  });
  return NextResponse.json(emprestimo);
}

// Avançar parcela atual
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const emprestimo = await prisma.emprestimo.update({
    where: { id },
    data: { parcelaAtual: parseInt(body.parcelaAtual) },
  });
  return NextResponse.json(emprestimo);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.emprestimo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
