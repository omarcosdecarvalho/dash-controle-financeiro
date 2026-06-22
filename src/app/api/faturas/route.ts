import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadArquivo } from "@/lib/supabase-storage";
import { analisarFatura } from "@/lib/analisador";

export async function GET() {
  const faturas = await prisma.fatura.findMany({
    include: { itens: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(faturas);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file     = formData.get("file") as File;
  const nome     = (formData.get("nome") as string) || file?.name || "Fatura";
  const mes      = parseInt(formData.get("mes") as string);
  const ano      = parseInt(formData.get("ano") as string);

  if (!file) return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload para Supabase Storage
  const arquivoUrl = await uploadArquivo(buffer, file.name, file.type || "application/octet-stream");

  const fatura = await prisma.fatura.create({
    data: { nome, mes, ano, arquivo: arquivoUrl, status: "pendente" },
  });

  // Análise em background
  analisarFaturaBackground(fatura.id, buffer, file.name, file.type || "application/octet-stream");

  return NextResponse.json({ ...fatura, analisando: true }, { status: 201 });
}

async function analisarFaturaBackground(
  faturaId: string,
  buffer: Buffer,
  filename: string,
  mimeType: string
) {
  try {
    await prisma.fatura.update({ where: { id: faturaId }, data: { status: "em_revisao" } });

    const itens = await analisarFatura(buffer, filename, mimeType);

    if (itens.length > 0) {
      await prisma.itemFatura.createMany({
        data: itens.map((item) => ({
          faturaId,
          descricao:  item.descricao,
          valor:      item.valor,
          data:       item.data ? new Date(item.data) : null,
          categoria:  item.categoria,
          importado:  false,
        })),
      });
    }

    await prisma.fatura.update({ where: { id: faturaId }, data: { status: "em_revisao" } });
  } catch (err) {
    console.error("Erro ao analisar fatura:", err);
    await prisma.fatura.update({ where: { id: faturaId }, data: { status: "pendente" } }).catch(() => {});
  }
}
