import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadArquivo } from "@/lib/supabase-storage";
import { analisarFatura } from "@/lib/analisador";

export const maxDuration = 60;

export async function GET() {
  const faturas = await prisma.fatura.findMany({
    include: { itens: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(faturas);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const nome = (formData.get("nome") as string) || file?.name || "Fatura";
  const mes  = parseInt(formData.get("mes") as string);
  const ano  = parseInt(formData.get("ano") as string);

  if (!file) return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload e análise em paralelo — economiza vários segundos
  const [arquivoUrl, itensAnalisados] = await Promise.all([
    uploadArquivo(buffer, file.name, file.type || "application/octet-stream"),
    analisarFatura(buffer, file.name, file.type || "application/octet-stream"),
  ]);

  // Cria fatura e itens numa única transação — só 1 round trip ao banco
  const fatura = await prisma.fatura.create({
    data: {
      nome,
      mes,
      ano,
      arquivo: arquivoUrl,
      status: "em_revisao",
      itens: itensAnalisados.length > 0 ? {
        createMany: {
          data: itensAnalisados.map(item => ({
            descricao: item.descricao,
            valor:     item.valor,
            data:      item.data ? new Date(item.data) : null,
            categoria: item.categoria,
            importado: false,
          })),
        },
      } : undefined,
    },
    include: { itens: true },
  });

  return NextResponse.json({ ...fatura, analisando: false }, { status: 201 });
}
