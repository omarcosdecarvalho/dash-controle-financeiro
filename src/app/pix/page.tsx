"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, QrCode, Copy, Check,
  AlertCircle, CreditCard,
} from "lucide-react";
import { BancoLogo } from "@/components/ui/banco-logo";
import { formatCurrency, formatMonth, TIPOS_LANCAMENTO } from "@/lib/utils";

interface ItemPix {
  descricao: string;
  tipo: string;
  valorTotal: number;
  valorPendente: number;
}

interface FontePix {
  id: string;
  nome: string;
  tipo: string;
  chavePix: string | null;
  tipoPix: string | null;
  nomePix: string | null;
  totalDevido: number;
  totalPago: number;
  saldoPendente: number;
  itens: ItemPix[];
}

interface FonteSemPix {
  id: string;
  nome: string;
  tipo: string;
  totalDevido: number;
  itens: Array<{ descricao: string; tipo: string; valorPendente: number }>;
}

interface PixData {
  comPix: FontePix[];
  semPix: FonteSemPix[];
  mes: number;
  ano: number;
}

const TIPOS_PIX_LABEL: Record<string, string> = {
  cpf: "CPF/CNPJ", email: "E-mail", telefone: "Telefone", aleatoria: "Chave Aleatória",
};

const TIPO_VARIANTE: Record<string, "default" | "secondary" | "success" | "warning"> = {
  unica: "default", parcelada: "warning", recorrente: "success", emprestimo: "secondary",
};

export default function PixPage() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [data, setData] = useState<PixData | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  async function load(m: number, a: number) {
    const res = await fetch(`/api/pix?mes=${m}&ano=${a}`);
    setData(await res.json());
  }

  useEffect(() => { load(mes, ano); }, [mes, ano]);

  function prev() {
    if (mes === 1) { setMes(12); setAno(ano - 1); } else setMes(mes - 1);
  }
  function next() {
    if (mes === 12) { setMes(1); setAno(ano + 1); } else setMes(mes + 1);
  }

  async function copiar(chave: string, id: string) {
    await navigator.clipboard.writeText(chave);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  }

  if (!data) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;

  const totalGeral = data.comPix.reduce((a, f) => a + f.saldoPendente, 0)
    + data.semPix.reduce((a, f) => a + f.totalDevido, 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <QrCode className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Pagamentos PIX</h1>
            <p className="text-sm text-gray-500">Para onde pagar e quanto enviar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium w-36 text-center capitalize">{formatMonth(mes, ano)}</span>
          <Button variant="outline" size="icon" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Resumo geral */}
      {totalGeral > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-700 font-medium">Total pendente no mês</p>
                <p className="text-xs text-blue-500">
                  {data.comPix.filter(f => f.saldoPendente > 0).length + data.semPix.length} destinos com saldo
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalGeral)}</p>
          </CardContent>
        </Card>
      )}

      {/* Fontes COM chave PIX */}
      {data.comPix.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Com Chave PIX Cadastrada</h2>
          <div className="space-y-4">
            {data.comPix.map(fonte => (
              <Card key={fonte.id} className={fonte.saldoPendente > 0 ? "border-orange-200" : "border-green-200"}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <BancoLogo nome={fonte.nome} />
                        <CardTitle className="text-base">{fonte.nome}</CardTitle>
                        {fonte.saldoPendente > 0
                          ? <Badge variant="warning">Pendente</Badge>
                          : <Badge variant="success">Quitado</Badge>}
                      </div>
                      {fonte.nomePix && (
                        <p className="text-sm text-gray-500 mt-0.5">Favorecido: <span className="font-medium text-gray-700">{fonte.nomePix}</span></p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Saldo pendente</p>
                      <p className={`text-xl font-bold ${fonte.saldoPendente > 0 ? "text-orange-600" : "text-green-600"}`}>
                        {formatCurrency(fonte.saldoPendente)}
                      </p>
                      {fonte.totalDevido > 0 && (
                        <p className="text-xs text-gray-400">{formatCurrency(fonte.totalPago)} / {formatCurrency(fonte.totalDevido)}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Bloco da chave PIX */}
                <CardContent className="pt-0">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <QrCode className="h-8 w-8 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        {fonte.tipoPix && (
                          <p className="text-xs text-gray-400 mb-0.5">{TIPOS_PIX_LABEL[fonte.tipoPix] ?? fonte.tipoPix}</p>
                        )}
                        <p className="font-mono text-sm font-semibold text-gray-800 break-all">{fonte.chavePix}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {fonte.saldoPendente > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Enviar</p>
                          <p className="text-base font-bold text-blue-700">{formatCurrency(fonte.saldoPendente)}</p>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copiar(fonte.chavePix!, fonte.id)}
                        className="gap-1.5"
                      >
                        {copiado === fonte.id
                          ? <><Check className="h-3.5 w-3.5 text-green-500" /> Copiado</>
                          : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
                      </Button>
                    </div>
                  </div>

                  {/* Lista de itens pendentes */}
                  {fonte.itens.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Composição do saldo</p>
                      <div className="space-y-1">
                        {fonte.itens.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              <Badge variant={TIPO_VARIANTE[item.tipo] ?? "default"} className="text-xs shrink-0">
                                {TIPOS_LANCAMENTO.find(t => t.value === item.tipo)?.label ?? item.tipo}
                              </Badge>
                              <span className="text-gray-700">{item.descricao}</span>
                            </div>
                            <span className="font-semibold text-gray-800 shrink-0 ml-2">
                              {formatCurrency(item.valorPendente)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {fonte.itens.length === 0 && fonte.totalDevido === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">Sem lançamentos neste mês.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Fontes SEM chave PIX mas com saldo */}
      {data.semPix.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            Sem Chave PIX Cadastrada
          </h2>
          <div className="space-y-3">
            {data.semPix.map(fonte => (
              <Card key={fonte.id} className="border-yellow-200">
                <CardContent className="py-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold">{fonte.nome}</span>
                      <Badge variant="warning">Sem PIX</Badge>
                    </div>
                    <div className="space-y-1">
                      {fonte.itens.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm text-gray-600 px-1">
                          <span>{item.descricao}</span>
                          <span className="font-medium">{formatCurrency(item.valorPendente)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-yellow-600 mt-2">
                      Cadastre a chave PIX em <strong>Fontes de Dívida</strong> para facilitar o pagamento.
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-700 ml-4 shrink-0">{formatCurrency(fonte.totalDevido)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {data.comPix.length === 0 && data.semPix.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <QrCode className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Nenhum saldo pendente neste mês.</p>
            <p className="text-gray-300 text-sm mt-1">
              Cadastre fontes de dívida com chave PIX para ver os destinos de pagamento aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
