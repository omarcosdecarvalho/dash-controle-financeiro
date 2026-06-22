import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mes = parseInt(searchParams.get("mes") ?? String(new Date().getMonth() + 1));
  const ano = parseInt(searchParams.get("ano") ?? String(new Date().getFullYear()));

  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 0, 23, 59, 59);

  // Parcelas vencendo no mês
  const parcelas = await prisma.parcela.findMany({
    where: { dataVencimento: { gte: inicio, lte: fim } },
    include: { lancamento: { include: { fonte: true, pessoa: true } } },
  });

  // Lançamentos únicos vencendo no mês
  const lancamentosUnicos = await prisma.lancamento.findMany({
    where: {
      tipo: { in: ["unica", "emprestimo"] },
      dataVencimento: { gte: inicio, lte: fim },
    },
    include: { fonte: true, pessoa: true, pagamentos: true },
  });

  // Lançamentos recorrentes (todos ativos)
  const recorrentes = await prisma.lancamento.findMany({
    where: { tipo: "recorrente" },
    include: { fonte: true, pessoa: true, pagamentos: true },
  });

  // Pagamentos do mês
  const pagamentos = await prisma.pagamento.findMany({
    where: { dataPagamento: { gte: inicio, lte: fim } },
  });

  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);

  const totalParcelas = parcelas.reduce((acc, p) => acc + p.valor, 0);
  const totalUnicos = lancamentosUnicos.reduce((acc, l) => acc + l.valor, 0);
  const totalRecorrentes = recorrentes.reduce((acc, l) => acc + l.valor, 0);
  const totalDevido = totalParcelas + totalUnicos + totalRecorrentes;

  const saldoPendente = totalDevido - totalPago;

  return NextResponse.json({
    mes,
    ano,
    totalDevido,
    totalPago,
    saldoPendente,
    parcelas,
    lancamentosUnicos,
    recorrentes,
    pagamentos,
  });
}
