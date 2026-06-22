"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

interface Pessoa {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
}

export default function PessoasPage() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pessoa | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });

  async function load() {
    const res = await fetch("/api/pessoas");
    setPessoas(await res.json());
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ nome: "", email: "", telefone: "" });
    setOpen(true);
  }

  function openEdit(p: Pessoa) {
    setEditing(p);
    setForm({ nome: p.nome, email: p.email ?? "", telefone: p.telefone ?? "" });
    setOpen(true);
  }

  async function save() {
    const url = editing ? `/api/pessoas/${editing.id}` : "/api/pessoas";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remover esta pessoa?")) return;
    await fetch(`/api/pessoas/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Pessoas</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4" /> Nova Pessoa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Pessoa" : "Nova Pessoa"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" className="mt-1" />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" className="mt-1" />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" className="mt-1" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={!form.nome}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pessoas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">Nenhuma pessoa cadastrada.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pessoas.map(p => (
            <Card key={p.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{p.nome}</p>
                  <p className="text-sm text-gray-500">{[p.email, p.telefone].filter(Boolean).join(" · ") || "Sem contato"}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
