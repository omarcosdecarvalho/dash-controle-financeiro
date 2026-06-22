"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Eye, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatMonth } from "@/lib/utils";
import { CATEGORIAS, getCategoriaInfo } from "@/lib/categorias";

interface ItemFatura {
  id: string;
  categoria?: string;
  valor: number;
  importado: boolean;
}

interface Fatura {
  id: string;
  nome: string;
  arquivo: string;
  mes: number;
  ano: number;
  status: string;
  itens: ItemFatura[];
}

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  em_revisao: "Analisado",
  revisado: "Revisado",
};
const STATUS_VARIANT: Record<string, "warning" | "default" | "success"> = {
  pendente: "warning",
  em_revisao: "default",
  revisado: "success",
};

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function ResumoCategoria({ itens }: { itens: ItemFatura[] }) {
  if (itens.length === 0) return null;

  // Agrupa por categoria
  const grupos: Record<string, number> = {};
  for (const item of itens) {
    const cat = item.categoria ?? "outros";
    grupos[cat] = (grupos[cat] ?? 0) + item.valor;
  }

  const total = Object.values(grupos).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(grupos).sort((a, b) => b[1] - a[1]);

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs text-gray-400 mb-2">
        <Sparkles className="inline h-3 w-3 mr-1 text-yellow-500" />
        {itens.length} itens · {formatCurrency(total)} total
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sorted.slice(0, 5).map(([cat, val]) => {
          const info = getCategoriaInfo(cat);
          return (
            <span
              key={cat}
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${info.cor}`}
            >
              {info.label}
              <span className="opacity-70">{formatCurrency(val)}</span>
            </span>
          );
        })}
        {sorted.length > 5 && (
          <span className="text-xs text-gray-400 py-0.5">+{sorted.length - 5} mais</span>
        )}
      </div>
    </div>
  );
}

export default function FaturasPage() {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analisando, setAnalisando] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "",
    mes: String(new Date().getMonth() + 1),
    ano: String(new Date().getFullYear()),
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/faturas");
    setFaturas(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Polling para atualizar a fatura sendo analisada
  useEffect(() => {
    if (!analisando) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }
    pollingRef.current = setInterval(async () => {
      const res = await fetch(`/api/faturas/${analisando}`);
      const fatura: Fatura = await res.json();
      setFaturas(prev => prev.map(f => (f.id === analisando ? fatura : f)));
      // Para de fazer polling quando a análise concluir
      if (fatura.itens.length > 0 || fatura.status !== "pendente") {
        setAnalisando(null);
      }
    }, 2000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [analisando]);

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("nome", form.nome || file.name);
    fd.append("mes", form.mes);
    fd.append("ano", form.ano);
    const res = await fetch("/api/faturas", { method: "POST", body: fd });
    const nova: Fatura & { analisando?: boolean } = await res.json();
    setUploading(false);
    setOpen(false);
    setForm({ nome: "", mes: String(new Date().getMonth() + 1), ano: String(new Date().getFullYear()) });
    if (fileRef.current) fileRef.current.value = "";
    await load();
    if (nova.analisando) setAnalisando(nova.id);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Upload className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Faturas</h1>
            <p className="text-sm text-gray-500">Upload e análise automática por categoria</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Upload className="h-4 w-4" /> Enviar Fatura</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Enviar Fatura para Análise</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Nome da Fatura</Label>
                <Input
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Nubank Junho 2026"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mês</Label>
                  <Select value={form.mes} onValueChange={v => setForm({ ...form, mes: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MESES.map((m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ano</Label>
                  <Input
                    type="number"
                    value={form.ano}
                    onChange={e => setForm({ ...form, ano: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Arquivo</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.csv,.png,.jpg,.jpeg,.webp"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Suporta PDF, CSV e imagens. A IA categoriza os itens automaticamente.
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={upload} disabled={uploading}>
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : "Enviar e Analisar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Legenda de categorias */}
      <div className="mb-5 p-3 bg-white border border-gray-100 rounded-xl">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Categorias</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIAS.map(c => (
            <span key={c.value} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${c.cor}`}>
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {faturas.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Nenhuma fatura enviada ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {faturas.map(f => {
            const estaAnalisando = analisando === f.id;
            return (
              <Card key={f.id} className={estaAnalisando ? "border-blue-200 bg-blue-50/30" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <FileText className="h-8 w-8 text-gray-300 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold truncate">{f.nome}</p>
                          <Badge variant={STATUS_VARIANT[f.status]}>
                            {STATUS_LABEL[f.status]}
                          </Badge>
                          {estaAnalisando && (
                            <span className="flex items-center gap-1 text-xs text-blue-600">
                              <Loader2 className="h-3 w-3 animate-spin" /> Analisando...
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 capitalize mt-0.5">
                          {formatMonth(f.mes, f.ano)}
                        </p>
                        <ResumoCategoria itens={f.itens} />
                      </div>
                    </div>
                    <Link href={`/faturas/revisao?id=${f.id}`} className="shrink-0">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" /> Revisar
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
