-- CreateTable
CREATE TABLE "Pessoa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FonteDivida" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'outros',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Lancamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataVencimento" DATETIME NOT NULL,
    "totalParcelas" INTEGER,
    "parcelaAtual" INTEGER,
    "diaVencimento" INTEGER,
    "pessoaId" TEXT,
    "fonteId" TEXT,
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lancamento_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lancamento_fonteId_fkey" FOREIGN KEY ("fonteId") REFERENCES "FonteDivida" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Parcela" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lancamentoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" REAL NOT NULL,
    "dataVencimento" DATETIME NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Parcela_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "Lancamento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "valor" REAL NOT NULL,
    "dataPagamento" DATETIME NOT NULL,
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lancamentoId" TEXT,
    "parcelaId" TEXT,
    "pessoaId" TEXT,
    CONSTRAINT "Pagamento_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "Lancamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pagamento_parcelaId_fkey" FOREIGN KEY ("parcelaId") REFERENCES "Parcela" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pagamento_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fatura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "arquivo" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ItemFatura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "faturaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "data" DATETIME,
    "categoria" TEXT,
    "importado" BOOLEAN NOT NULL DEFAULT false,
    "lancamentoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemFatura_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "Fatura" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
