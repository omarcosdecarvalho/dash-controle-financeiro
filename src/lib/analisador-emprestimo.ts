import Anthropic from "@anthropic-ai/sdk";
import * as XLSX from "xlsx";

export interface DadosEmprestimo {
  descricao: string;
  credor: string;
  valorTotal: number;
  valorParcela: number;
  quantidadeParcelas: number;
  parcelaAtual: number;
  dataInicio: string; // yyyy-mm-dd
  observacao: string;
}

const PROMPT = `Analise este documento de empréstimo/financiamento e extraia as seguintes informações.

Retorne APENAS um objeto JSON com esta estrutura exata:
{
  "descricao": "nome/tipo do empréstimo (ex: Empréstimo Pessoal Caixa, Financiamento Veículo, Crédito Consignado)",
  "credor": "nome do banco ou credor (ex: Caixa Econômica, Nubank, Itaú)",
  "valorTotal": 15000.00,
  "valorParcela": 450.00,
  "quantidadeParcelas": 36,
  "parcelaAtual": 5,
  "dataInicio": "2024-01-15",
  "observacao": "qualquer informação relevante como taxa de juros, CET, etc"
}

Regras:
- valorTotal = valor total do empréstimo (principal + juros totais se disponível, senão só o principal)
- valorParcela = valor de cada parcela mensal
- quantidadeParcelas = número total de parcelas
- parcelaAtual = número da parcela atual (se não encontrar, use 1)
- dataInicio = data de início do contrato no formato yyyy-mm-dd (se não encontrar, use a data de hoje)
- Se algum campo não for encontrado no documento, faça uma estimativa razoável baseada nos demais campos
- Retorne SOMENTE o JSON, sem texto adicional`;

async function extrairComClaude(
  client: Anthropic,
  conteudo: { tipo: "texto"; texto: string } | { tipo: "imagem"; base64: string; mimeType: string }
): Promise<Partial<DadosEmprestimo>> {
  let messageContent: Anthropic.MessageParam["content"];

  if (conteudo.tipo === "texto") {
    messageContent = `${PROMPT}\n\nConteúdo do documento:\n\`\`\`\n${conteudo.texto.slice(0, 12000)}\n\`\`\``;
  } else {
    messageContent = [
      {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: conteudo.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: conteudo.base64,
        },
      },
      { type: "text" as const, text: PROMPT },
    ];
  }

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: messageContent }],
  });

  const texto = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = texto.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};
  return JSON.parse(jsonMatch[0]);
}

function excelParaTexto(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const linhas: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    linhas.push(csv);
  }
  return linhas.join("\n");
}

export async function analisarDocumentoEmprestimo(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<Partial<DadosEmprestimo>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) return {};

  const client = new Anthropic({ apiKey });

  const isExcel = filename.endsWith(".xlsx") || filename.endsWith(".xls") ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel";

  try {
    // Excel
    if (isExcel) {
      const texto = excelParaTexto(buffer);
      return await extrairComClaude(client, { tipo: "texto", texto });
    }

    // PDF — importação dinâmica para evitar erro no Vercel
    if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
      let texto = "";
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer, { max: 0 });
        texto = data.text ?? "";
      } catch {
        texto = "";
      }

      if (texto.length > 20) {
        return await extrairComClaude(client, { tipo: "texto", texto });
      }

      // PDF sem texto extraível (escaneado) — envia como imagem
      return await extrairComClaude(client, {
        tipo: "imagem",
        base64: buffer.toString("base64"),
        mimeType: "image/png",
      });
    }

    // Imagem
    if (mimeType.startsWith("image/")) {
      return await extrairComClaude(client, {
        tipo: "imagem",
        base64: buffer.toString("base64"),
        mimeType,
      });
    }

    // CSV / texto genérico
    return await extrairComClaude(client, {
      tipo: "texto",
      texto: buffer.toString("utf-8"),
    });
  } catch (err) {
    console.error("Erro ao analisar documento de empréstimo:", err);
    return {};
  }
}
