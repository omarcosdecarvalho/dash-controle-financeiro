import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const lancamentos = await prisma.lancamento.findMany({
    include: { pessoa: true, fonte: true, parcelas: true, pagamentos: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(lancamentos);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { descricao, valor, tipo, dataVencimento, totalParcelas, diaVencimento, pessoaId, fonteId, observacao } = body;

  const lancamento = await prisma.lancamento.create({
    data: {
      descricao,
      valor: parseFloat(valor),
      tipo,
      dataVencimento: new Date(dataVencimento),
      totalParcelas: totalParcelas ? parseInt(totalParcelas) : null,
      parcelaAtual: tipo === "parcelada" ? 1 : null,
      diaVencimento: diaVencimento ? parseInt(diaVencimento) : null,
      pessoaId: pessoaId || null,
      fonteId: fonteId || null,
      observacao: observacao || null,
    },
  });

  // Gera parcelas automaticamente para compras parceladas
  if (tipo === "parcelada" && totalParcelas) {
    const total = parseInt(totalParcelas);
    const valorParcela = parseFloat(valor) / total;
    const parcelas = [];
    for (let i = 1; i <= total; i++) {
      const venc = new Date(dataVencimento);
      venc.setMonth(venc.getMonth() + (i - 1));
      parcelas.push({
        lancamentoId: lancamento.id,
        numero: i,
        valor: valorParcela,
        dataVencimento: venc,
      });
    }
    await prisma.parcela.createMany({ data: parcelas });
  }

  return NextResponse.json(lancamento, { status: 201 });
}
