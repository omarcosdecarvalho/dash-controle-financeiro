import Anthropic from "@anthropic-ai/sdk";
import { categorizarPorKeyword, CategoriaValue } from "./categorias";
import * as XLSX from "xlsx";

export interface ItemAnalisado {
  descricao: string;
  valor: number;
  data?: string;
  categoria: CategoriaValue;
}

// ─── Parsers de texto plano ────────────────────────────────────────────────

function parsearCSV(texto: string): ItemAnalisado[] {
  const linhas = texto.trim().split(/\r?\n/).filter(Boolean);
  if (linhas.length < 2) return [];

  const header = linhas[0].toLowerCase();
  const itens: ItemAnalisado[] = [];

  // Detecta separador
  const sep = header.includes(";") ? ";" : ",";

  const cols = header.split(sep).map(c => c.trim().replace(/"/g, ""));

  // Mapeamento flexível de colunas comuns de bancos brasileiros
  const idxData  = cols.findIndex(c => /data|date|dt/.test(c));
  const idxDesc  = cols.findIndex(c => /descri|lanc|histor|titulo|title|memo|detail/.test(c));
  const idxValor = cols.findIndex(c => /valor|value|amount|quantia|debito/.test(c));

  if (idxDesc === -1 || idxValor === -1) return [];

  for (let i = 1; i < linhas.length; i++) {
    const campos = linhas[i].split(sep).map(c => c.trim().replace(/"/g, ""));
    const descricao = campos[idxDesc] ?? "";
    const valorRaw  = campos[idxValor] ?? "0";
    const dataRaw   = idxData >= 0 ? campos[idxData] : undefined;

    const valor = parseFloat(
      valorRaw.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")
    );

    if (!descricao || isNaN(valor) || valor === 0) continue;
    if (valor < 0) continue; // ignora créditos/estornos

    let data: string | undefined;
    if (dataRaw) {
      // tenta parsear datas BR (dd/mm/yyyy) e ISO
      const partes = dataRaw.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})/);
      if (partes) {
        const ano = partes[3].length === 2 ? `20${partes[3]}` : partes[3];
        data = `${ano}-${partes[2]}-${partes[1]}`;
      } else {
        data = dataRaw;
      }
    }

    itens.push({ descricao, valor, data, categoria: categorizarPorKeyword(descricao) });
  }

  return itens;
}

function parsearTextoLivre(texto: string): ItemAnalisado[] {
  // Regex: linha com descrição + valor em R$ ou número decimal
  const padraoLinha = /^(.+?)\s+R?\$?\s*([\d.,]+)\s*$/gm;
  const padraoData  = /(\d{2}\/\d{2}(?:\/\d{2,4})?)/;
  const itens: ItemAnalisado[] = [];

  let match: RegExpExecArray | null;
  while ((match = padraoLinha.exec(texto)) !== null) {
    const descricaoBruta = match[1].trim();
    const valorStr = match[2].replace(/\./g, "").replace(",", ".");
    const valor = parseFloat(valorStr);

    if (!descricaoBruta || isNaN(valor) || valor <= 0) continue;

    const dataMatch = descricaoBruta.match(padraoData);
    const data = dataMatch ? (() => {
      const [d, m, a = String(new Date().getFullYear())] = dataMatch[1].split("/");
      return `${a.length === 2 ? "20" + a : a}-${m}-${d}`;
    })() : undefined;
    const descricao = descricaoBruta.replace(padraoData, "").trim();

    itens.push({ descricao, valor, data, categoria: categorizarPorKeyword(descricao) });
  }

  return itens;
}

// ─── Análise com Claude ────────────────────────────────────────────────────

async function analisarComClaude(
  client: Anthropic,
  conteudo: { tipo: "texto"; texto: string } | { tipo: "imagem"; base64: string; mimeType: string }
): Promise<ItemAnalisado[]> {
  const prompt = `Analise esta fatura/extrato bancário e extraia TODOS os lançamentos de despesas/compras.

Para cada item retorne um JSON array com objetos no formato:
{
  "descricao": "nome do estabelecimento ou descrição",
  "valor": 99.90,
  "data": "2026-06-15",  // ISO yyyy-mm-dd, omitir se não encontrar
  "categoria": "uma das categorias abaixo"
}

Categorias disponíveis (use EXATAMENTE este valor):
- alimentacao  → mercado, restaurante, delivery, padaria, lanchonete
- transporte   → uber, taxi, gasolina, pedágio, estacionamento, transporte público
- saude        → farmácia, médico, hospital, plano de saúde, exame
- assinaturas  → Netflix, Spotify, Adobe, AWS, qualquer serviço de assinatura mensal
- lazer        → cinema, academia, show, jogo, viagem, livro, hobby
- moradia      → aluguel, condomínio, luz, água, internet, gás, telefone
- vestuario    → roupa, calçado, acessório, moda
- educacao     → escola, faculdade, curso, material escolar
- financeiro   → parcela, empréstimo, tarifa bancária, seguro, juros
- outros       → qualquer coisa que não se encaixe acima

Regras:
- Ignore entradas de crédito, estornos e pagamentos de fatura
- Ignore linhas de saldo
- Valores SEMPRE positivos (despesas)
- Retorne APENAS o JSON array, sem texto adicional`;

  let messageContent: Anthropic.MessageParam["content"];

  if (conteudo.tipo === "texto") {
    messageContent = `${prompt}\n\nConteúdo da fatura:\n\`\`\`\n${conteudo.texto.slice(0, 12000)}\n\`\`\``;
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
      { type: "text" as const, text: prompt },
    ];
  }

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [{ role: "user", content: messageContent }],
  });

  const texto = response.content[0].type === "text" ? response.content[0].text : "";

  // Extrai o JSON da resposta
  const jsonMatch = texto.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    descricao: string; valor: number; data?: string; categoria: string;
  }>;

  return parsed
    .filter(i => i.descricao && i.valor > 0)
    .map(i => ({
      descricao: i.descricao,
      valor: i.valor,
      data: i.data,
      categoria: (i.categoria as CategoriaValue) ?? "outros",
    }));
}

// ─── Parser Excel (xlsx/xls) ───────────────────────────────────────────────

function parsearExcel(buffer: Buffer): ItemAnalisado[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (rows.length === 0) return [];

  // Detecta colunas por nome (case-insensitive)
  const keys = Object.keys(rows[0]);
  const keyDesc  = keys.find(k => /descri|lanc|histor|titulo|memo|detail|estabelec/i.test(k));
  const keyValor = keys.find(k => /valor|value|amount|quantia|debito/i.test(k));
  const keyData  = keys.find(k => /data|date|dt\b/i.test(k));

  if (!keyDesc || !keyValor) return [];

  const itens: ItemAnalisado[] = [];

  for (const row of rows) {
    const descricao = String(row[keyDesc] ?? "").trim();
    const valorRaw  = String(row[keyValor] ?? "0");
    const dataRaw   = keyData ? row[keyData] : undefined;

    const valor = parseFloat(
      valorRaw.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")
    );

    if (!descricao || isNaN(valor) || valor <= 0) continue;

    let data: string | undefined;
    if (dataRaw instanceof Date) {
      data = dataRaw.toISOString().split("T")[0];
    } else if (typeof dataRaw === "string" && dataRaw) {
      const partes = dataRaw.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})/);
      if (partes) {
        const ano = partes[3].length === 2 ? `20${partes[3]}` : partes[3];
        data = `${ano}-${partes[2]}-${partes[1]}`;
      }
    }

    itens.push({ descricao, valor, data, categoria: categorizarPorKeyword(descricao) });
  }

  return itens;
}

// ─── Entrada principal ─────────────────────────────────────────────────────

export async function analisarFatura(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ItemAnalisado[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const temIA = !!(apiKey && apiKey.trim());

  // Excel (xlsx/xls) — parseia localmente
  const isExcel = filename.endsWith(".xlsx") || filename.endsWith(".xls") ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel";

  if (isExcel) {
    const itens = parsearExcel(buffer);
    if (temIA && itens.length > 0) {
      try {
        const texto = itens.map(i => `${i.descricao}\t${i.valor}`).join("\n");
        const client = new Anthropic({ apiKey });
        return await analisarComClaude(client, { tipo: "texto", texto });
      } catch {
        // fallback para parse local
      }
    }
    return itens;
  }

  // CSV — sempre parseia localmente, IA melhora categorias
  if (mimeType === "text/csv" || filename.endsWith(".csv")) {
    const texto = buffer.toString("utf-8");
    const itens = parsearCSV(texto);

    if (temIA && itens.length > 0) {
      try {
        const client = new Anthropic({ apiKey });
        return await analisarComClaude(client, { tipo: "texto", texto });
      } catch {
        // fallback silencioso para o parse local
      }
    }
    return itens;
  }

  // PDF — extrai texto e envia para IA (ou usa regex)
  if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
    let texto = "";
    try {
      // Importação dinâmica evita erro de inicialização do pdf-parse no Vercel
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer, { max: 0 });
      texto = data.text ?? "";
    } catch {
      texto = "";
    }

    if (temIA && texto.length > 20) {
      try {
        const client = new Anthropic({ apiKey });
        return await analisarComClaude(client, { tipo: "texto", texto });
      } catch {
        // fallback
      }
    }
    return parsearTextoLivre(texto);
  }

  // Imagem — envia direto para Claude Vision
  if (mimeType.startsWith("image/")) {
    if (temIA) {
      try {
        const client = new Anthropic({ apiKey });
        return await analisarComClaude(client, {
          tipo: "imagem",
          base64: buffer.toString("base64"),
          mimeType,
        });
      } catch {
        // sem fallback útil para imagem sem IA
        return [];
      }
    }
    return []; // imagem sem API key não dá para analisar
  }

  return [];
}
