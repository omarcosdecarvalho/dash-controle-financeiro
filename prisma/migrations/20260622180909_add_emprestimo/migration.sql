-- CreateTable
CREATE TABLE "Emprestimo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "credor" TEXT,
    "valorTotal" REAL NOT NULL,
    "valorParcela" REAL NOT NULL,
    "quantidadeParcelas" INTEGER NOT NULL,
    "parcelaAtual" INTEGER NOT NULL DEFAULT 1,
    "dataInicio" DATETIME NOT NULL,
    "arquivo" TEXT,
    "observacao" TEXT,
    "fonteId" TEXT,
    "pessoaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Emprestimo_fonteId_fkey" FOREIGN KEY ("fonteId") REFERENCES "FonteDivida" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Emprestimo_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
