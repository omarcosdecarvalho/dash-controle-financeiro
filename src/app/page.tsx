"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, TrendingDown, TrendingUp, AlertCircle,
  LayoutDashboard, Banknote, CreditCard, Landmark, ChevronDown, ChevronUp,
} from "lucide-react";
import { formatCurrency, formatDate, formatMonth, TIPOS_LANCAMENTO } from "@/lib/utils";

interface DashData {
  mes: number; ano: number;
  totalDevido: number; totalPago: number; saldoPendente: number;
  parcelas: Array<{ id: string; numero: number; valor: number; dataVencimento: string; pago: boolean; lancamento: { descricao: string; fonte?: { nome: string } | null } }>;
  lancamentosUnicos: Array<{ id: string; descricao: string; valor: number; dataVencimento: string; tipo: string; fonte?: { nome: string } | null }>;
  recorrentes: Array<{ id: string; descricao: string; valor: number; tipo: string; fonte?: { nome: string } | null }>;
}

interface ResumoItem { descricao: string; valor: number; pago: boolean; }
interface ResumoFonte { id: string; nome: string; tipo: string; chavePix: string | null; itens: ResumoItem[]; totalDevido: number; totalPago: number; }
interface ResumoEmp { id: string; descricao: string; credor?: string | null; valorParcela: number; parcelaAtual: number; quantidadeParcelas: number; }
interface Resumo {
  porFonte: ResumoFonte[];
  semFonte: { itens: ResumoItem[]; total: number } | null;
  emprestimos: ResumoEmp[];
  totalCartoes: number; totalEmprestimos: number; totalGeralMes: number;
}

function PagamentoTotalMes({ mes, ano }: { mes: number; ano: number }) {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    fetch(`/api/resumo-mes?mes=${mes}&ano=${ano}`).then(r => r.json()).then(setResumo);
  }, [mes, ano]);

  if (!resumo || resumo.totalGeralMes === 0) return null;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Banknote className="h-5 w-5 text-blue-600" />
            Pagamento Total do Mês
          </CardTitle>
          <button onClick={() => setAberto(!aberto)} className="text-gray-400 hover:text-gray-600">
            {aberto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          <div className="bg-white rounded-lg p-3 border text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1"><CreditCard className="h-3 w-3" /> Cartões</p>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(resumo.totalCartoes)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1"><Landmark className="h-3 w-3" /> Empréstimos</p>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(resumo.totalEmprestimos)}</p>
          </div>
          <div className="bg-blue-600 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-200">Total Geral</p>
            <p className="text-lg font-bold text-white">{formatCurrency(resumo.totalGeralMes)}</p>
          </div>
        </div>
      </CardHeader>

      {aberto && (
        <CardContent className="pt-0 space-y-2">
          {resumo.porFonte.map(fonte => (
            <div key={fonte.id} className="bg-white rounded-lg border p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-gray-400" /> {fonte.nome}
                </span>
                <span className="font-bold text-sm">{formatCurrency(fonte.totalDevido)}</span>
              </div>
              <div className="space-y-0.5">
                {fonte.itens.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-500 px-1">
                    <span className={item.pago ? "line-through opacity-50" : ""}>{item.descricao}</span>
                    <span>{formatCurrency(item.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {resumo.emprestimos.length > 0 && (
            <div className="bg-white rounded-lg border p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5 text-gray-400" /> Empréstimos
                </span>
                <span className="font-bold text-sm">{formatCurrency(resumo.totalEmprestimos)}</span>
              </div>
              <div className="space-y-0.5">
                {resumo.emprestimos.map(e => (
                  <div key={e.id} className="flex justify-between text-xs text-gray-500 px-1">
                    <span>{e.descricao} — {e.parcelaAtual}ª/{e.quantidadeParcelas}</span>
                    <span>{formatCurrency(e.valorParcela)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [data, setData] = useState<DashData | null>(null);

  async function load(m: number, a: number) {
    const res = await fetch(`/api/dashboard?mes=${m}&ano=${a}`);
    setData(await res.json());
  }

  useEffect(() => { load(mes, ano); }, [mes, ano]);

  function prev() {
    if (mes === 1) { setMes(12); setAno(ano - 1); } else setMes(mes - 1);
  }
  function next() {
    if (mes === 12) { setMes(1); setAno(ano + 1); } else setMes(mes + 1);
  }

  if (!data) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;

  const percentPago = data.totalDevido > 0 ? (data.totalPago / data.totalDevido) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium w-36 text-center capitalize">{formatMonth(mes, ano)}</span>
          <Button variant="outline" size="icon" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" /> Total Devido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalDevido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" /> Total Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalPago)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" /> Saldo Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${data.saldoPendente > 0 ? "text-yellow-600" : "text-green-600"}`}>
              {formatCurrency(data.saldoPendente)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de progresso */}
      {data.totalDevido > 0 && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Progresso de pagamento</span>
              <span>{percentPago.toFixed(0)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(percentPago, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Pagamento Total do Mês ── */}
      <PagamentoTotalMes mes={mes} ano={ano} />

      {/* Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.parcelas.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Parcelas do Mês</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {data.parcelas.map(p => (
                <div key={p.id} className={`flex justify-between items-center text-sm px-3 py-2 rounded ${p.pago ? "bg-green-50" : "bg-gray-50"}`}>
                  <div>
                    <span className="font-medium">{p.lancamento.descricao}</span>
                    <span className="text-gray-400 text-xs ml-1">({p.numero}ª)</span>
                    {p.lancamento.fonte && <span className="text-gray-400 text-xs ml-1">· {p.lancamento.fonte.nome}</span>}
                    <p className="text-gray-400 text-xs">{formatDate(p.dataVencimento)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(p.valor)}</p>
                    {p.pago ? <Badge variant="success">Pago</Badge> : <Badge variant="warning">Pendente</Badge>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {data.lancamentosUnicos.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Compras e Empréstimos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {data.lancamentosUnicos.map(l => (
                <div key={l.id} className="flex justify-between items-center text-sm px-3 py-2 rounded bg-gray-50">
                  <div>
                    <span className="font-medium">{l.descricao}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">{TIPOS_LANCAMENTO.find(t => t.value === l.tipo)?.label}</Badge>
                    <p className="text-gray-400 text-xs">{formatDate(l.dataVencimento)}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(l.valor)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {data.recorrentes.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Recorrentes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {data.recorrentes.map(l => (
                <div key={l.id} className="flex justify-between items-center text-sm px-3 py-2 rounded bg-blue-50">
                  <div>
                    <span className="font-medium">{l.descricao}</span>
                    {l.fonte && <span className="text-gray-400 text-xs ml-1">· {l.fonte.nome}</span>}
                  </div>
                  <p className="font-semibold">{formatCurrency(l.valor)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {data.totalDevido === 0 && (
          <Card className="lg:col-span-2">
            <CardContent className="py-12 text-center text-gray-400">
              Nenhum lançamento para este mês.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
