"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, DollarSign } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Parcela { id: string; numero: number; valor: number; dataVencimento: string; pago: boolean; }
interface Lancamento { id: string; descricao: string; valor: number; tipo: string; parcelas: Parcela[]; }
interface Pagamento {
  id: string; valor: number; dataPagamento: string; observacao?: string;
  lancamento?: { descricao: string } | null;
  parcela?: { numero: number } | null;
  pessoa?: { nome: string } | null;
}

export default function PagamentosPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [pessoas, setPessoas] = useState<{ id: string; nome: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    valor: "", dataPagamento: new Date().toISOString().split("T")[0],
    lancamentoId: "", parcelaId: "", pessoaId: "", observacao: "",
  });

  const lancamentoSelecionado = lancamentos.find(l => l.id === form.lancamentoId);

  async function load() {
    const [pg, l, p] = await Promise.all([
      fetch("/api/pagamentos").then(r => r.json()),
      fetch("/api/lancamentos").then(r => r.json()),
      fetch("/api/pessoas").then(r => r.json()),
    ]);
    setPagamentos(pg); setLancamentos(l); setPessoas(p);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    await fetch("/api/pagamentos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setOpen(false);
    setForm({ valor: "", dataPagamento: new Date().toISOString().split("T")[0], lancamentoId: "", parcelaId: "", pessoaId: "", observacao: "" });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este pagamento?")) return;
    await fetch(`/api/pagamentos/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold">Pagamentos</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Registrar Pagamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor (R$) *</Label>
                  <Input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} placeholder="0,00" className="mt-1" />
                </div>
                <div>
                  <Label>Data *</Label>
                  <Input type="date" value={form.dataPagamento} onChange={e => setForm({ ...form, dataPagamento: e.target.value })} className="mt-1" />
                </div>
              </div>

              <div>
                <Label>Lançamento</Label>
                <Select value={form.lancamentoId} onValueChange={v => setForm({ ...form, lancamentoId: v, parcelaId: "" })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar lançamento..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {lancamentos.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.descricao} — {formatCurrency(l.valor)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {lancamentoSelecionado?.parcelas && lancamentoSelecionado.parcelas.filter(p => !p.pago).length > 0 && (
                <div>
                  <Label>Parcela</Label>
                  <Select value={form.parcelaId} onValueChange={v => {
                    const p = lancamentoSelecionado.parcelas.find(pa => pa.id === v);
                    setForm({ ...form, parcelaId: v, valor: p ? String(p.valor.toFixed(2)) : form.valor });
                  }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar parcela..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Geral (sem parcela)</SelectItem>
                      {lancamentoSelecionado.parcelas.filter(p => !p.pago).map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.numero}ª parcela — {formatDate(p.dataVencimento)} — {formatCurrency(p.valor)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Pessoa (opcional)</Label>
                <Select value={form.pessoaId} onValueChange={v => setForm({ ...form, pessoaId: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar pessoa..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {pessoas.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Observação</Label>
                <Textarea value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} className="mt-1" />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={!form.valor || !form.dataPagamento}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pagamentos.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">Nenhum pagamento registrado.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {pagamentos.map(p => (
            <Card key={p.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-700">{formatCurrency(p.valor)}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {formatDate(p.dataPagamento)}
                    {p.lancamento && <span> · {p.lancamento.descricao}</span>}
                    {p.parcela && <span> ({p.parcela.numero}ª parcela)</span>}
                    {p.pessoa && <span> · {p.pessoa.nome}</span>}
                  </p>
                  {p.observacao && <p className="text-xs text-gray-400 mt-0.5">{p.observacao}</p>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
