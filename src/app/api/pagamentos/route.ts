import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes");
  const ano = searchParams.get("ano");

  const where: Record<string, unknown> = {};
  if (mes && ano) {
    const inicio = new Date(parseInt(ano), parseInt(mes) - 1, 1);
    const fim = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59);
    where.dataPagamento = { gte: inicio, lte: fim };
  }

  const pagamentos = await prisma.pagamento.findMany({
    where,
    include: { lancamento: true, parcela: true, pessoa: true },
    orderBy: { dataPagamento: "desc" },
  });
  return NextResponse.json(pagamentos);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { valor, dataPagamento, lancamentoId, parcelaId, pessoaId, observacao } = body;

  const pagamento = await prisma.pagamento.create({
    data: {
      valor: parseFloat(valor),
      dataPagamento: new Date(dataPagamento),
      lancamentoId: lancamentoId || null,
      parcelaId: parcelaId || null,
      pessoaId: pessoaId || null,
      observacao: observacao || null,
    },
  });

  // Marca parcela como paga se informada
  if (parcelaId) {
    await prisma.parcela.update({ where: { id: parcelaId }, data: { pago: true } });
  }

  return NextResponse.json(pagamento, { status: 201 });
}
