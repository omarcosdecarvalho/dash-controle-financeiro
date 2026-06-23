"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency, formatDate, TIPOS_LANCAMENTO } from "@/lib/utils";

interface Parcela { id: string; numero: number; valor: number; dataVencimento: string; pago: boolean; }
interface Lancamento {
  id: string; descricao: string; valor: number; tipo: string;
  dataVencimento: string; totalParcelas?: number; diaVencimento?: number;
  observacao?: string;
  pessoa?: { nome: string } | null;
  fonte?: { nome: string } | null;
  parcelas: Parcela[];
}

const tipoColors: Record<string, "default" | "secondary" | "success" | "warning"> = {
  unica: "default", parcelada: "warning", recorrente: "success", emprestimo: "secondary",
};

export default function LancamentosPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [pessoas, setPessoas] = useState<{ id: string; nome: string }[]>([]);
  const [fontes, setFontes] = useState<{ id: string; nome: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    descricao: "", valor: "", tipo: "unica", dataVencimento: "",
    totalParcelas: "", diaVencimento: "", pessoaId: "", fonteId: "", observacao: "",
  });

  async function load() {
    const [l, p, f] = await Promise.all([
      fetch("/api/lancamentos").then(r => r.json()),
      fetch("/api/pessoas").then(r => r.json()),
      fetch("/api/fontes").then(r => r.json()),
    ]);
    setLancamentos(l); setPessoas(p); setFontes(f);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    await fetch("/api/lancamentos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setOpen(false);
    setForm({ descricao: "", valor: "", tipo: "unica", dataVencimento: "", totalParcelas: "", diaVencimento: "", pessoaId: "", fonteId: "", observacao: "" });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    await fetch(`/api/lancamentos/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Lançamentos</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Novo Lançamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Descrição *</Label>
                <Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Mercado, Netflix..." className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor (R$) *</Label>
                  <Input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} placeholder="0,00" className="mt-1" />
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_LANCAMENTO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Data de Vencimento *</Label>
                <Input type="date" value={form.dataVencimento} onChange={e => setForm({ ...form, dataVencimento: e.target.value })} className="mt-1" />
              </div>

              {form.tipo === "parcelada" && (
                <div>
                  <Label>Número de Parcelas</Label>
                  <Input type="number" value={form.totalParcelas} onChange={e => setForm({ ...form, totalParcelas: e.target.value })} placeholder="Ex: 12" className="mt-1" />
                </div>
              )}

              {form.tipo === "recorrente" && (
                <div>
                  <Label>Dia de Vencimento (do mês)</Label>
                  <Input type="number" min="1" max="31" value={form.diaVencimento} onChange={e => setForm({ ...form, diaVencimento: e.target.value })} placeholder="Ex: 10" className="mt-1" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Fonte de Dívida</Label>
                  <Select value={form.fonteId} onValueChange={v => setForm({ ...form, fonteId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {fontes.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pessoa {form.tipo === "emprestimo" ? "(Credor) *" : ""}</Label>
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
                <Textarea value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} placeholder="Notas adicionais..." className="mt-1" />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={!form.descricao || !form.valor || !form.dataVencimento}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {lancamentos.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">Nenhum lançamento cadastrado.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {lancamentos.map(l => (
            <Card key={l.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{l.descricao}</span>
                      <Badge variant={tipoColors[l.tipo]}>{TIPOS_LANCAMENTO.find(t => t.value === l.tipo)?.label}</Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1 flex gap-4 flex-wrap">
                      <span className="font-medium text-gray-700">{formatCurrency(l.valor)}</span>
                      <span>Venc: {formatDate(l.dataVencimento)}</span>
                      {l.fonte && <span>📄 {l.fonte.nome}</span>}
                      {l.pessoa && <span>👤 {l.pessoa.nome}</span>}
                      {l.totalParcelas && <span>{l.totalParcelas}x de {formatCurrency(l.valor / l.totalParcelas)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {l.parcelas.length > 0 && (
                      <Button size="icon" variant="ghost" onClick={() => setExpanded(expanded === l.id ? null : l.id)}>
                        {expanded === l.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </div>

                {expanded === l.id && l.parcelas.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2">PARCELAS</p>
                    <div className="grid grid-cols-1 gap-1">
                      {l.parcelas.map(p => (
                        <div key={p.id} className={`flex justify-between text-sm px-3 py-1.5 rounded ${p.pago ? "bg-green-50 text-green-700" : "bg-gray-50"}`}>
                          <span>{p.numero}ª parcela — {formatDate(p.dataVencimento)}</span>
                          <span className="font-medium">{formatCurrency(p.valor)} {p.pago ? "✓" : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
