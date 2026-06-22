import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadArquivo } from "@/lib/supabase-storage";
import { analisarDocumentoEmprestimo } from "@/lib/analisador-emprestimo";

export async function GET() {
  const emprestimos = await prisma.emprestimo.findMany({
    include: { fonte: true, pessoa: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(emprestimos);
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  // Upload com arquivo — analisa com IA e retorna rascunho
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload para Supabase Storage
    const arquivoUrl = await uploadArquivo(buffer, file.name, file.type || "application/octet-stream");

    const extraido = await analisarDocumentoEmprestimo(
      buffer,
      file.name,
      file.type || "application/octet-stream"
    );

    return NextResponse.json({ arquivo: arquivoUrl, ...extraido });
  }

  // Salvar empréstimo confirmado (JSON)
  const body = await req.json();
  const emprestimo = await prisma.emprestimo.create({
    data: {
      descricao:          body.descricao,
      credor:             body.credor             ?? null,
      valorTotal:         parseFloat(body.valorTotal),
      valorParcela:       parseFloat(body.valorParcela),
      quantidadeParcelas: parseInt(body.quantidadeParcelas),
      parcelaAtual:       parseInt(body.parcelaAtual) || 1,
      dataInicio:         new Date(body.dataInicio),
      arquivo:            body.arquivo             ?? null,
      observacao:         body.observacao           ?? null,
      fonteId:            body.fonteId              || null,
      pessoaId:           body.pessoaId             || null,
    },
    include: { fonte: true, pessoa: true },
  });
  return NextResponse.json(emprestimo, { status: 201 });
}
