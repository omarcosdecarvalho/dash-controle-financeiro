"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, CreditCard, QrCode } from "lucide-react";
import { TIPOS_FONTE } from "@/lib/utils";

interface FonteDivida {
  id: string;
  nome: string;
  tipo: string;
  chavePix?: string | null;
  tipoPix?: string | null;
  nomePix?: string | null;
}

const TIPOS_PIX = [
  { value: "cpf", label: "CPF / CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Telefone" },
  { value: "aleatoria", label: "Chave Aleatória" },
];

const emptyForm = { nome: "", tipo: "outros", chavePix: "", tipoPix: "", nomePix: "" };

export default function FontesPage() {
  const [fontes, setFontes] = useState<FonteDivida[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FonteDivida | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const res = await fetch("/api/fontes");
    setFontes(await res.json());
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(f: FonteDivida) {
    setEditing(f);
    setForm({
      nome: f.nome,
      tipo: f.tipo,
      chavePix: f.chavePix ?? "",
      tipoPix: f.tipoPix ?? "",
      nomePix: f.nomePix ?? "",
    });
    setOpen(true);
  }

  async function save() {
    const url = editing ? `/api/fontes/${editing.id}` : "/api/fontes";
    const method = editing ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        chavePix: form.chavePix || null,
        tipoPix: form.tipoPix || null,
        nomePix: form.nomePix || null,
      }),
    });
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remover esta fonte?")) return;
    await fetch(`/api/fontes/${id}`, { method: "DELETE" });
    load();
  }

  const tipoLabel = (tipo: string) => TIPOS_FONTE.find(t => t.value === tipo)?.label ?? tipo;
  const pixLabel = (tipo: string) => TIPOS_PIX.find(t => t.value === tipo)?.label ?? tipo;
  const tipoVariant = (tipo: string): "default" | "secondary" | "outline" =>
    tipo === "cartao" ? "default" : tipo === "banco" ? "secondary" : "outline";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Fontes de Dívida</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4" /> Nova Fonte</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Fonte" : "Nova Fonte de Dívida"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={form.nome}
                    onChange={e => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex: Nubank, Itaú..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_FONTE.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seção PIX */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <QrCode className="h-4 w-4 text-blue-500" /> Dados de Pagamento PIX
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo da Chave</Label>
                      <Select value={form.tipoPix} onValueChange={v => setForm({ ...form, tipoPix: v })}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                        <SelectContent>
                          {TIPOS_PIX.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Chave PIX</Label>
                      <Input
                        value={form.chavePix}
                        onChange={e => setForm({ ...form, chavePix: e.target.value })}
                        placeholder="Ex: 123.456.789-00"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Nome do Favorecido</Label>
                    <Input
                      value={form.nomePix}
                      onChange={e => setForm({ ...form, nomePix: e.target.value })}
                      placeholder="Ex: João da Silva"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={!form.nome}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {fontes.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">Nenhuma fonte cadastrada.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {fontes.map(f => (
            <Card key={f.id}>
              <CardContent className="py-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{f.nome}</p>
                    <Badge variant={tipoVariant(f.tipo)}>{tipoLabel(f.tipo)}</Badge>
                  </div>
                  {f.chavePix ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-md px-3 py-1.5 w-fit">
                      <QrCode className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="font-mono text-xs">{f.chavePix}</span>
                      {f.tipoPix && <Badge variant="secondary" className="text-xs">{pixLabel(f.tipoPix)}</Badge>}
                      {f.nomePix && <span className="text-gray-400 text-xs">· {f.nomePix}</span>}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">Sem chave PIX cadastrada</p>
                  )}
                </div>
                <div className="flex gap-2 ml-3">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(f.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
