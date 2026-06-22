import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mes = parseInt(searchParams.get("mes") ?? String(new Date().getMonth() + 1));
  const ano = parseInt(searchParams.get("ano") ?? String(new Date().getFullYear()));

  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 0, 23, 59, 59);

  // Busca todas as fontes com chave PIX
  const fontes = await prisma.fonteDivida.findMany({
    where: { chavePix: { not: null } },
    include: {
      lancamentos: {
        include: {
          parcelas: true,
          pagamentos: true,
        },
      },
    },
  });

  const resultado = fontes.map((fonte) => {
    let totalDevido = 0;
    let totalPago = 0;
    const itens: Array<{
      descricao: string;
      tipo: string;
      valorTotal: number;
      valorPendente: number;
    }> = [];

    for (const lanc of fonte.lancamentos) {
      if (lanc.tipo === "parcelada") {
        // Soma parcelas do mês
        const parcelasMes = lanc.parcelas.filter((p) => {
          const d = new Date(p.dataVencimento);
          return d >= inicio && d <= fim;
        });
        for (const p of parcelasMes) {
          const pagosParcela = lanc.pagamentos
            .filter((pg) => pg.parcelaId === p.id)
            .reduce((a, pg) => a + pg.valor, 0);
          totalDevido += p.valor;
          totalPago += pagosParcela;
          if (!p.pago) {
            itens.push({
              descricao: `${lanc.descricao} (${p.numero}ª parcela)`,
              tipo: "parcelada",
              valorTotal: p.valor,
              valorPendente: p.valor - pagosParcela,
            });
          }
        }
      } else if (lanc.tipo === "recorrente") {
        const pagosLanc = lanc.pagamentos
          .filter((pg) => {
            const d = new Date(pg.dataPagamento);
            return d >= inicio && d <= fim;
          })
          .reduce((a, pg) => a + pg.valor, 0);
        totalDevido += lanc.valor;
        totalPago += pagosLanc;
        if (pagosLanc < lanc.valor) {
          itens.push({
            descricao: lanc.descricao,
            tipo: "recorrente",
            valorTotal: lanc.valor,
            valorPendente: lanc.valor - pagosLanc,
          });
        }
      } else {
        // unica ou emprestimo
        const dataVenc = new Date(lanc.dataVencimento);
        if (dataVenc >= inicio && dataVenc <= fim) {
          const pagosLanc = lanc.pagamentos.reduce((a, pg) => a + pg.valor, 0);
          totalDevido += lanc.valor;
          totalPago += pagosLanc;
          if (pagosLanc < lanc.valor) {
            itens.push({
              descricao: lanc.descricao,
              tipo: lanc.tipo,
              valorTotal: lanc.valor,
              valorPendente: lanc.valor - pagosLanc,
            });
          }
        }
      }
    }

    return {
      id: fonte.id,
      nome: fonte.nome,
      tipo: fonte.tipo,
      chavePix: fonte.chavePix,
      tipoPix: fonte.tipoPix,
      nomePix: fonte.nomePix,
      totalDevido,
      totalPago,
      saldoPendente: totalDevido - totalPago,
      itens,
    };
  });

  // Fontes sem PIX mas com lançamentos no mês (para informação)
  const fontesComLanc = await prisma.fonteDivida.findMany({
    where: { chavePix: null },
    include: { lancamentos: { include: { parcelas: true, pagamentos: true } } },
  });

  const semPix = fontesComLanc
    .map((fonte) => {
      let totalDevido = 0;
      const itens: Array<{ descricao: string; tipo: string; valorPendente: number }> = [];
      for (const lanc of fonte.lancamentos) {
        if (lanc.tipo === "parcelada") {
          const parcelasMes = lanc.parcelas.filter((p) => {
            const d = new Date(p.dataVencimento);
            return d >= inicio && d <= fim && !p.pago;
          });
          for (const p of parcelasMes) {
            totalDevido += p.valor;
            itens.push({ descricao: `${lanc.descricao} (${p.numero}ª)`, tipo: "parcelada", valorPendente: p.valor });
          }
        } else if (lanc.tipo === "recorrente") {
          totalDevido += lanc.valor;
          itens.push({ descricao: lanc.descricao, tipo: "recorrente", valorPendente: lanc.valor });
        } else {
          const d = new Date(lanc.dataVencimento);
          if (d >= inicio && d <= fim) {
            const pago = lanc.pagamentos.reduce((a, pg) => a + pg.valor, 0);
            if (pago < lanc.valor) {
              totalDevido += lanc.valor - pago;
              itens.push({ descricao: lanc.descricao, tipo: lanc.tipo, valorPendente: lanc.valor - pago });
            }
          }
        }
      }
      return { id: fonte.id, nome: fonte.nome, tipo: fonte.tipo, totalDevido, itens };
    })
    .filter((f) => f.totalDevido > 0);

  return NextResponse.json({ comPix: resultado, semPix, mes, ano });
}
