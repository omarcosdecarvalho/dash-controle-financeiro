"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, Check, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency, formatDate, TIPOS_LANCAMENTO } from "@/lib/utils";
import { CATEGORIAS, getCategoriaInfo } from "@/lib/categorias";

interface Fatura {
  id: string; nome: string; mes: number; ano: number; status: string;
  itens: ItemFatura[];
}
interface ItemFatura {
  id: string; descricao: string; valor: number; data?: string;
  categoria?: string; importado: boolean; lancamentoId?: string;
}

// ─── Gráfico de rosca simples (CSS) ────────────────────────────────────────
function GraficoCategorias({ itens }: { itens: ItemFatura[] }) {
  if (itens.length === 0) return null;

  const grupos: Record<string, number> = {};
  for (const item of itens) {
    const cat = item.categoria ?? "outros";
    grupos[cat] = (grupos[cat] ?? 0) + item.valor;
  }
  const total = Object.values(grupos).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(grupos).sort((a, b) => b[1] - a[1]);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Distribuição por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sorted.map(([cat, val]) => {
            const info = getCategoriaInfo(cat);
            const pct = total > 0 ? (val / total) * 100 : 0;
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 w-28 text-center ${info.cor}`}>
                  {info.label}
                </span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: "currentColor",
                    }}
                  >
                    <div className={`h-full rounded-full ${info.cor.split(" ")[0].replace("bg-", "bg-")}`} style={{ opacity: 0.7 }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-36 justify-end">
                  <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
                  <span className="text-sm font-semibold">{formatCurrency(val)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between items-center mt-4 pt-3 border-t text-sm">
          <span className="text-gray-500">{itens.length} itens</span>
          <span className="font-bold">{formatCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Item individual ────────────────────────────────────────────────────────
function ItemCard({
  item,
  onImportar,
  onEditarCategoria,
}: {
  item: ItemFatura;
  onImportar: (item: ItemFatura) => void;
  onEditarCategoria: (item: ItemFatura, cat: string) => void;
}) {
  const [editandoCat, setEditandoCat] = useState(false);
  const info = getCategoriaInfo(item.categoria ?? "outros");

  return (
    <Card className={item.importado ? "border-green-200 bg-green-50/40" : ""}>
      <CardContent className="py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{item.descricao}</span>
            {item.importado && (
              <Badge variant="success" className="text-xs shrink-0">
                <Check className="h-3 w-3 mr-0.5" /> Importado
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">{formatCurrency(item.valor)}</span>
            {item.data && <span className="text-xs text-gray-400">{formatDate(item.data)}</span>}

            {editandoCat ? (
              <Select
                value={item.categoria ?? "outros"}
                onValueChange={v => { onEditarCategoria(item, v); setEditandoCat(false); }}
              >
                <SelectTrigger className="h-6 text-xs w-36 px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <button
                onClick={() => setEditandoCat(true)}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium cursor-pointer hover:opacity-80 transition-opacity ${info.cor}`}
              >
                {info.label}
                <Pencil className="h-2.5 w-2.5 opacity-60" />
              </button>
            )}
          </div>
        </div>
        {!item.importado && (
          <Button size="sm" variant="outline" onClick={() => onImportar(item)} className="shrink-0">
            Importar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Conteúdo principal ─────────────────────────────────────────────────────
function RevisaoContent() {
  const searchParams = useSearchParams();
  const faturaId = searchParams.get("id");

  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [fatura, setFatura] = useState<Fatura | null>(null);
  const [fontes, setFontes] = useState<{ id: string; nome: string }[]>([]);
  const [selectedId, setSelectedId] = useState(faturaId ?? "");
  const [importando, setImportando] = useState<ItemFatura | null>(null);
  const [novoItem, setNovoItem] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [mostrarImportados, setMostrarImportados] = useState(false);
  const [itemForm, setItemForm] = useState({ descricao: "", valor: "", data: "", categoria: "outros" });
  const [lancForm, setLancForm] = useState({ tipo: "unica", fonteId: "", dataVencimento: "" });

  async function load(id: string) {
    const [todas, fontesRes] = await Promise.all([
      fetch("/api/faturas").then(r => r.json()),
      fetch("/api/fontes").then(r => r.json()),
    ]);
    setFaturas(todas);
    setFontes(fontesRes);
    if (id) {
      const f = todas.find((ft: Fatura) => ft.id === id);
      if (f) setFatura(f);
    }
  }

  useEffect(() => { load(selectedId); }, [selectedId]);

  async function addItem() {
    if (!fatura) return;
    await fetch(`/api/faturas/${fatura.id}/itens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...itemForm, valor: itemForm.valor }),
    });
    setNovoItem(false);
    setItemForm({ descricao: "", valor: "", data: "", categoria: "outros" });
    load(fatura.id);
  }

  async function editarCategoria(item: ItemFatura, categoria: string) {
    await fetch(`/api/faturas/${fatura!.id}/itens/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoria }),
    });
    load(fatura!.id);
  }

  async function importarItem(item: ItemFatura) {
    if (!fatura) return;
    const lancamento = await fetch("/api/lancamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao: item.descricao,
        valor: item.valor,
        tipo: lancForm.tipo,
        dataVencimento: lancForm.dataVencimento || item.data || new Date().toISOString().split("T")[0],
        fonteId: lancForm.fonteId || null,
      }),
    }).then(r => r.json());

    await fetch(`/api/faturas/${fatura.id}/itens`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, lancamentoId: lancamento.id }),
    });
    setImportando(null);
    load(fatura.id);
  }

  // Filtragem
  const itensFiltrados = (fatura?.itens ?? []).filter(i => {
    if (!mostrarImportados && i.importado) return false;
    if (filtroCategoria !== "todas" && i.categoria !== filtroCategoria) return false;
    return true;
  });

  const categoriasDaFatura = [...new Set((fatura?.itens ?? []).map(i => i.categoria ?? "outros"))];
  const pendentes = (fatura?.itens ?? []).filter(i => !i.importado).length;
  const importados = (fatura?.itens ?? []).filter(i => i.importado).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Revisão de Faturas</h1>
          <p className="text-sm text-gray-500">Categorias detectadas automaticamente pela IA</p>
        </div>
      </div>

      {/* Seleção de fatura */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <Label>Selecionar Fatura</Label>
          <Select value={selectedId} onValueChange={v => { setSelectedId(v); setFatura(null); }}>
            <SelectTrigger className="mt-1 max-w-sm">
              <SelectValue placeholder="Escolha uma fatura..." />
            </SelectTrigger>
            <SelectContent>
              {faturas.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {fatura && (
        <>
          {/* Gráfico de distribuição */}
          <GraficoCategorias itens={fatura.itens} />

          {/* Barra de controles */}
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">{fatura.itens.length} itens</span>
              {pendentes > 0 && <Badge variant="warning">{pendentes} pendentes</Badge>}
              {importados > 0 && <Badge variant="success">{importados} importados</Badge>}
            </div>
            <div className="flex items-center gap-2">
              {/* Filtro por categoria */}
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {categoriasDaFatura.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {getCategoriaInfo(cat).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setMostrarImportados(!mostrarImportados)}
                className="h-8 text-xs gap-1"
              >
                {mostrarImportados ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {mostrarImportados ? "Ocultar" : "Ver"} importados
              </Button>

              <Button size="sm" onClick={() => setNovoItem(true)} className="h-8">
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
          </div>

          {/* Lista de itens */}
          {itensFiltrados.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-400">
                {filtroCategoria !== "todas"
                  ? `Nenhum item em "${getCategoriaInfo(filtroCategoria).label}".`
                  : "Nenhum item para exibir."}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {itensFiltrados.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onImportar={item => {
                    setImportando(item);
                    setLancForm({ tipo: "unica", fonteId: "", dataVencimento: item.data?.split("T")[0] ?? "" });
                  }}
                  onEditarCategoria={editarCategoria}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Dialog: Adicionar item */}
      <Dialog open={novoItem} onOpenChange={setNovoItem}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Item</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Descrição *</Label>
              <Input value={itemForm.descricao} onChange={e => setItemForm({ ...itemForm, descricao: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" value={itemForm.valor} onChange={e => setItemForm({ ...itemForm, valor: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={itemForm.data} onChange={e => setItemForm({ ...itemForm, data: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={itemForm.categoria} onValueChange={v => setItemForm({ ...itemForm, categoria: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setNovoItem(false)}>Cancelar</Button>
              <Button onClick={addItem} disabled={!itemForm.descricao || !itemForm.valor}>Adicionar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Importar como lançamento */}
      <Dialog open={!!importando} onOpenChange={() => setImportando(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Importar como Lançamento</DialogTitle></DialogHeader>
          {importando && (
            <div className="space-y-4 mt-2">
              <div className={`rounded-lg px-4 py-3 border ${getCategoriaInfo(importando.categoria ?? "outros").cor}`}>
                <p className="font-medium">{importando.descricao}</p>
                <p className="text-sm opacity-70">{formatCurrency(importando.valor)}</p>
                <span className="text-xs font-semibold">
                  {getCategoriaInfo(importando.categoria ?? "outros").label}
                </span>
              </div>
              <div>
                <Label>Tipo de Lançamento</Label>
                <Select value={lancForm.tipo} onValueChange={v => setLancForm({ ...lancForm, tipo: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_LANCAMENTO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fonte de Dívida</Label>
                <Select value={lancForm.fonteId} onValueChange={v => setLancForm({ ...lancForm, fonteId: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {fontes.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de Vencimento</Label>
                <Input type="date" value={lancForm.dataVencimento} onChange={e => setLancForm({ ...lancForm, dataVencimento: e.target.value })} className="mt-1" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setImportando(null)}>Cancelar</Button>
                <Button onClick={() => importarItem(importando)}>Importar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RevisaoPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 p-8">Carregando...</div>}>
      <RevisaoContent />
    </Suspense>
  );
}
