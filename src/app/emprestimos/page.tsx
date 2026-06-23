"use client";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Landmark, Upload, Loader2, Pencil, Trash2, Plus,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Banknote, CreditCard, AlertCircle,
} from "lucide-react";
import { formatCurrency, formatMonth } from "@/lib/utils";

interface Emprestimo {
  id: string; descricao: string; credor?: string | null;
  valorTotal: number; valorParcela: number;
  quantidadeParcelas: number; parcelaAtual: number;
  dataInicio: string; arquivo?: string | null; observacao?: string | null;
  fonte?: { nome: string; chavePix?: string | null } | null;
  pessoa?: { nome: string } | null;
}

interface ResumoItem { descricao: string; valor: number; pago: boolean; }
interface ResumoFonte { id: string; nome: string; tipo: string; chavePix: string | null; itens: ResumoItem[]; totalDevido: number; totalPago: number; }
interface ResumoEmp { id: string; descricao: string; credor?: string | null; valorParcela: number; parcelaAtual: number; quantidadeParcelas: number; parcelasRestantes: number; }
interface Resumo {
  mes: number; ano: number;
  porFonte: ResumoFonte[];
  semFonte: { itens: ResumoItem[]; total: number } | null;
  emprestimos: ResumoEmp[];
  totalCartoes: number; totalEmprestimos: number; totalGeralMes: number;
}

const emptyForm = {
  descricao: "", credor: "", valorTotal: "", valorParcela: "",
  quantidadeParcelas: "", parcelaAtual: "1", dataInicio: "",
  observacao: "", fonteId: "", pessoaId: "", arquivo: "",
};

// ─── Barra de progresso de parcelas ─────────────────────────────────────────
function BarraParcelas({ atual, total }: { atual: number; total: number }) {
  const pct = total <= 0 ? 0 : Math.min((atual - 1) / total * 100, 100);
  const restantes = total - atual + 1;
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{atual}ª / {total} parcelas</span>
        <span className={restantes <= 3 ? "text-green-600 font-semibold" : ""}>{restantes} restantes</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Card de resumo do mês ───────────────────────────────────────────────────
function PagamentoTotalMes({ mes, ano }: { mes: number; ano: number }) {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [aberto, setAberto] = useState(true);

  useEffect(() => {
    fetch(`/api/resumo-mes?mes=${mes}&ano=${ano}`)
      .then(r => r.json())
      .then(setResumo);
  }, [mes, ano]);

  if (!resumo) return null;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Banknote className="h-5 w-5 text-blue-600" />
            Pagamento Total do Mês
            <span className="text-sm font-normal text-gray-500 capitalize">— {formatMonth(mes, ano)}</span>
          </CardTitle>
          <button onClick={() => setAberto(!aberto)} className="text-gray-400 hover:text-gray-600">
            {aberto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          <div className="bg-white rounded-lg p-3 border text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1"><CreditCard className="h-3 w-3" /> Cartões/Lançamentos</p>
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
        <CardContent className="pt-0 space-y-3">
          {/* Por fonte/cartão */}
          {resumo.porFonte.map(fonte => (
            <div key={fonte.id} className="bg-white rounded-lg border p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-gray-400" /> {fonte.nome}
                  {fonte.chavePix && <span className="text-xs text-blue-500 font-mono bg-blue-50 px-1.5 py-0.5 rounded">{fonte.chavePix}</span>}
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

          {/* Sem fonte */}
          {resumo.semFonte && (
            <div className="bg-white rounded-lg border p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm text-gray-500">Sem fonte vinculada</span>
                <span className="font-bold text-sm">{formatCurrency(resumo.semFonte.total)}</span>
              </div>
              <div className="space-y-0.5">
                {resumo.semFonte.itens.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-500 px-1">
                    <span>{item.descricao}</span>
                    <span>{formatCurrency(item.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empréstimos */}
          {resumo.emprestimos.length > 0 && (
            <div className="bg-white rounded-lg border p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5 text-gray-400" /> Parcelas de Empréstimos
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

          {resumo.totalGeralMes === 0 && (
            <p className="text-center text-sm text-gray-400 py-2">Nenhum compromisso neste mês.</p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function EmprestimosPage() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [fontes, setFontes] = useState<{ id: string; nome: string }[]>([]);
  const [pessoas, setPessoas] = useState<{ id: string; nome: string }[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const [emps, fts, pss] = await Promise.all([
      fetch("/api/emprestimos").then(r => r.json()),
      fetch("/api/fontes").then(r => r.json()),
      fetch("/api/pessoas").then(r => r.json()),
    ]);
    setEmprestimos(emps); setFontes(fts); setPessoas(pss);
  }

  useEffect(() => { load(); }, []);

  function abrirNovo() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function abrirEditar(e: Emprestimo) {
    setEditingId(e.id);
    setForm({
      descricao: e.descricao, credor: e.credor ?? "",
      valorTotal: String(e.valorTotal), valorParcela: String(e.valorParcela),
      quantidadeParcelas: String(e.quantidadeParcelas), parcelaAtual: String(e.parcelaAtual),
      dataInicio: e.dataInicio.split("T")[0], observacao: e.observacao ?? "",
      fonteId: "", pessoaId: "", arquivo: e.arquivo ?? "",
    });
    setDialogOpen(true);
  }

  async function analisarArquivo() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setAnalisando(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/emprestimos", { method: "POST", body: fd });
    const dados = await res.json();
    setForm(prev => ({
      ...prev,
      descricao:          dados.descricao          ?? prev.descricao,
      credor:             dados.credor             ?? prev.credor,
      valorTotal:         dados.valorTotal         ? String(dados.valorTotal)         : prev.valorTotal,
      valorParcela:       dados.valorParcela       ? String(dados.valorParcela)       : prev.valorParcela,
      quantidadeParcelas: dados.quantidadeParcelas ? String(dados.quantidadeParcelas) : prev.quantidadeParcelas,
      parcelaAtual:       dados.parcelaAtual       ? String(dados.parcelaAtual)       : prev.parcelaAtual,
      dataInicio:         dados.dataInicio         ?? prev.dataInicio,
      observacao:         dados.observacao         ?? prev.observacao,
      arquivo:            dados.arquivo            ?? prev.arquivo,
    }));
    setAnalisando(false);
  }

  async function salvar() {
    const url = editingId ? `/api/emprestimos/${editingId}` : "/api/emprestimos";
    const method = editingId ? "PATCH" : "POST";
    await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setDialogOpen(false);
    load();
  }

  async function avancarParcela(e: Emprestimo) {
    if (e.parcelaAtual >= e.quantidadeParcelas) return;
    await fetch(`/api/emprestimos/${e.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parcelaAtual: e.parcelaAtual + 1 }),
    });
    load();
  }

  async function remover(id: string) {
    if (!confirm("Excluir este empréstimo?")) return;
    await fetch(`/api/emprestimos/${id}`, { method: "DELETE" });
    load();
  }

  const parcelasRestantes = (e: Emprestimo) => e.quantidadeParcelas - e.parcelaAtual + 1;
  const quitado = (e: Emprestimo) => e.parcelaAtual > e.quantidadeParcelas;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Landmark className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Empréstimos</h1>
            <p className="text-sm text-gray-500">Envie o documento e a IA preenche os campos</p>
          </div>
        </div>
        <Button onClick={abrirNovo}><Plus className="h-4 w-4" /> Novo Empréstimo</Button>
      </div>

      {/* Seletor de mês para o resumo */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => { if (mes === 1) { setMes(12); setAno(ano - 1); } else setMes(mes - 1); }}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium w-36 text-center capitalize">{formatMonth(mes, ano)}</span>
        <Button variant="outline" size="icon" onClick={() => { if (mes === 12) { setMes(1); setAno(ano + 1); } else setMes(mes + 1); }}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Pagamento Total do Mês ── */}
      <PagamentoTotalMes mes={mes} ano={ano} />

      {/* ── Lista de empréstimos ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Empréstimos Cadastrados
        </h2>

        {emprestimos.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <Landmark className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">Nenhum empréstimo cadastrado.</p>
              <p className="text-gray-300 text-sm mt-1">Envie o boleto ou contrato para preenchimento automático.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {emprestimos.map(e => (
              <Card key={e.id} className={quitado(e) ? "border-green-200 bg-green-50/30 opacity-70" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{e.descricao}</span>
                        {e.credor && <span className="text-sm text-gray-400">· {e.credor}</span>}
                        {quitado(e)
                          ? <Badge variant="success">Quitado</Badge>
                          : parcelasRestantes(e) <= 3
                          ? <Badge variant="warning">Quitando em breve</Badge>
                          : <Badge variant="secondary">Ativo</Badge>}
                      </div>

                      {/* Grade de campos */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 mt-3">
                        <div>
                          <p className="text-xs text-gray-400">Valor Total</p>
                          <p className="font-semibold text-sm">{formatCurrency(e.valorTotal)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Parcela</p>
                          <p className="font-semibold text-sm text-blue-600">{formatCurrency(e.valorParcela)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Parcela Atual</p>
                          <p className="font-semibold text-sm">{e.parcelaAtual}ª / {e.quantidadeParcelas}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Restantes</p>
                          <p className={`font-semibold text-sm ${parcelasRestantes(e) <= 3 ? "text-green-600" : ""}`}>
                            {quitado(e) ? "—" : parcelasRestantes(e)}
                          </p>
                        </div>
                      </div>

                      <BarraParcelas atual={e.parcelaAtual} total={e.quantidadeParcelas} />

                      {e.observacao && (
                        <p className="text-xs text-gray-400 mt-2 italic">{e.observacao}</p>
                      )}
                      {e.fonte && (
                        <p className="text-xs text-gray-400 mt-1">
                          Fonte: <span className="font-medium text-gray-600">{e.fonte.nome}</span>
                          {e.fonte.chavePix && <span className="font-mono ml-1 text-blue-500">{e.fonte.chavePix}</span>}
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {!quitado(e) && (
                        <Button size="sm" variant="outline" onClick={() => avancarParcela(e)} title="Marcar parcela atual como paga">
                          <ChevronRight className="h-3.5 w-3.5" /> Avançar
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => abrirEditar(e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remover(e.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Dialog: Novo/Editar empréstimo ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Empréstimo" : "Novo Empréstimo"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-1">
            {/* Upload de documento */}
            {!editingId && (
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 bg-blue-50/40">
                <p className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Enviar documento (opcional)
                </p>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.csv"
                    className="flex-1 text-xs text-gray-500 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-white file:text-blue-700 hover:file:bg-blue-50"
                  />
                  <Button size="sm" variant="outline" onClick={analisarArquivo} disabled={analisando}>
                    {analisando ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analisando</> : <><Landmark className="h-3.5 w-3.5" /> Analisar</>}
                  </Button>
                </div>
                {analisando && (
                  <p className="text-xs text-blue-500 mt-2 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> IA extraindo informações do documento...
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>Descrição *</Label>
              <Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
                placeholder="Ex: Empréstimo Pessoal Nubank" className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Credor / Banco</Label>
                <Input value={form.credor} onChange={e => setForm({ ...form, credor: e.target.value })}
                  placeholder="Ex: Caixa Econômica" className="mt-1" />
              </div>
              <div>
                <Label>Data de Início *</Label>
                <Input type="date" value={form.dataInicio} onChange={e => setForm({ ...form, dataInicio: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor Total (R$) *</Label>
                <Input type="number" step="0.01" value={form.valorTotal}
                  onChange={e => setForm({ ...form, valorTotal: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Valor da Parcela (R$) *</Label>
                <Input type="number" step="0.01" value={form.valorParcela}
                  onChange={e => setForm({ ...form, valorParcela: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Qtd. de Parcelas *</Label>
                <Input type="number" min="1" value={form.quantidadeParcelas}
                  onChange={e => setForm({ ...form, quantidadeParcelas: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Parcela Atual *</Label>
                <Input type="number" min="1" value={form.parcelaAtual}
                  onChange={e => setForm({ ...form, parcelaAtual: e.target.value })} className="mt-1" />
              </div>
            </div>

            {/* Parcelas restantes calculadas */}
            {form.quantidadeParcelas && form.parcelaAtual && (
              <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-blue-400" /> Parcelas restantes
                </span>
                <span className="font-bold text-blue-700">
                  {Math.max(0, parseInt(form.quantidadeParcelas) - parseInt(form.parcelaAtual) + 1)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fonte / Banco Cobrador</Label>
                <Select value={form.fonteId} onValueChange={v => setForm({ ...form, fonteId: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {fontes.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pessoa Vinculada</Label>
                <Select value={form.pessoaId} onValueChange={v => setForm({ ...form, pessoaId: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {pessoas.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Observação</Label>
              <Textarea value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })}
                placeholder="Ex: Juros 2,99% a.m., CET 35,88% a.a." className="mt-1" />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button
                onClick={salvar}
                disabled={!form.descricao || !form.valorTotal || !form.valorParcela || !form.quantidadeParcelas || !form.dataInicio}
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
