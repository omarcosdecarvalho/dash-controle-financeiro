import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mes = parseInt(searchParams.get("mes") ?? String(new Date().getMonth() + 1));
  const ano = parseInt(searchParams.get("ano") ?? String(new Date().getFullYear()));

  const inicio = new Date(ano, mes - 1, 1);
  const fim    = new Date(ano, mes, 0, 23, 59, 59);

  // ── 1. Cartões/fontes: parcelas e lançamentos únicos do mês ──────────────
  const fontes = await prisma.fonteDivida.findMany({
    include: {
      lancamentos: {
        include: { parcelas: { where: { dataVencimento: { gte: inicio, lte: fim } } }, pagamentos: true },
      },
    },
  });

  const porFonte: Array<{
    id: string; nome: string; tipo: string; chavePix: string | null;
    itens: Array<{ descricao: string; valor: number; pago: boolean }>;
    totalDevido: number; totalPago: number;
  }> = [];

  for (const fonte of fontes) {
    const itens: Array<{ descricao: string; valor: number; pago: boolean }> = [];
    let totalDevido = 0;
    let totalPago = 0;

    for (const lanc of fonte.lancamentos) {
      if (lanc.tipo === "parcelada") {
        for (const p of lanc.parcelas) {
          const pagoParcela = lanc.pagamentos
            .filter(pg => pg.parcelaId === p.id)
            .reduce((a, pg) => a + pg.valor, 0);
          totalDevido += p.valor;
          totalPago   += pagoParcela;
          itens.push({ descricao: `${lanc.descricao} (${p.numero}ª parcela)`, valor: p.valor, pago: p.pago });
        }
      } else if (lanc.tipo === "recorrente") {
        const pagoMes = lanc.pagamentos
          .filter(pg => { const d = new Date(pg.dataPagamento); return d >= inicio && d <= fim; })
          .reduce((a, pg) => a + pg.valor, 0);
        totalDevido += lanc.valor;
        totalPago   += pagoMes;
        itens.push({ descricao: lanc.descricao, valor: lanc.valor, pago: pagoMes >= lanc.valor });
      } else {
        const d = new Date(lanc.dataVencimento);
        if (d >= inicio && d <= fim) {
          const pagoLanc = lanc.pagamentos.reduce((a, pg) => a + pg.valor, 0);
          totalDevido += lanc.valor;
          totalPago   += pagoLanc;
          itens.push({ descricao: lanc.descricao, valor: lanc.valor, pago: pagoLanc >= lanc.valor });
        }
      }
    }

    if (totalDevido > 0) {
      porFonte.push({ id: fonte.id, nome: fonte.nome, tipo: fonte.tipo, chavePix: fonte.chavePix, itens, totalDevido, totalPago });
    }
  }

  // Lançamentos sem fonte
  const semFonte = await prisma.lancamento.findMany({
    where: { fonteId: null },
    include: { parcelas: { where: { dataVencimento: { gte: inicio, lte: fim } } }, pagamentos: true },
  });
  let semFonteTotal = 0;
  const semFonteItens: Array<{ descricao: string; valor: number; pago: boolean }> = [];
  for (const lanc of semFonte) {
    if (lanc.tipo === "parcelada") {
      for (const p of lanc.parcelas) {
        semFonteTotal += p.valor;
        semFonteItens.push({ descricao: `${lanc.descricao} (${p.numero}ª)`, valor: p.valor, pago: p.pago });
      }
    } else if (lanc.tipo === "recorrente") {
      semFonteTotal += lanc.valor;
      semFonteItens.push({ descricao: lanc.descricao, valor: lanc.valor, pago: false });
    } else {
      const d = new Date(lanc.dataVencimento);
      if (d >= inicio && d <= fim) {
        const pago = lanc.pagamentos.reduce((a, pg) => a + pg.valor, 0) >= lanc.valor;
        semFonteTotal += lanc.valor;
        semFonteItens.push({ descricao: lanc.descricao, valor: lanc.valor, pago });
      }
    }
  }

  // ── 2. Empréstimos ativos ────────────────────────────────────────────────
  const emprestimos = await prisma.emprestimo.findMany({
    include: { fonte: true, pessoa: true },
  });

  const emprestimosAtivos = emprestimos
    .filter(e => e.parcelaAtual <= e.quantidadeParcelas)
    .map(e => ({
      id: e.id,
      descricao: e.descricao,
      credor: e.credor,
      valorParcela: e.valorParcela,
      parcelaAtual: e.parcelaAtual,
      quantidadeParcelas: e.quantidadeParcelas,
      parcelasRestantes: e.quantidadeParcelas - e.parcelaAtual + 1,
      fonte: e.fonte ? { nome: e.fonte.nome, chavePix: e.fonte.chavePix } : null,
    }));

  const totalEmprestimos = emprestimosAtivos.reduce((a, e) => a + e.valorParcela, 0);

  // ── 3. Consolidado ───────────────────────────────────────────────────────
  const totalCartoes   = porFonte.reduce((a, f) => a + f.totalDevido, 0) + semFonteTotal;
  const totalGeralMes  = totalCartoes + totalEmprestimos;

  return NextResponse.json({
    mes, ano,
    porFonte,
    semFonte: semFonteTotal > 0 ? { itens: semFonteItens, total: semFonteTotal } : null,
    emprestimos: emprestimosAtivos,
    totalCartoes,
    totalEmprestimos,
    totalGeralMes,
  });
}
