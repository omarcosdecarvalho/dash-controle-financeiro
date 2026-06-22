import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export function formatMonth(mes: number, ano: number) {
  const date = new Date(ano, mes - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

export const TIPOS_LANCAMENTO = [
  { value: "unica", label: "Compra Única" },
  { value: "parcelada", label: "Compra Parcelada" },
  { value: "recorrente", label: "Recorrente" },
  { value: "emprestimo", label: "Empréstimo" },
];

export const TIPOS_FONTE = [
  { value: "cartao", label: "Cartão de Crédito" },
  { value: "banco", label: "Banco / Conta" },
  { value: "outros", label: "Outros" },
];
