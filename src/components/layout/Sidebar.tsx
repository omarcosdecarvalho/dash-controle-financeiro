"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CreditCard, FileText, DollarSign,
  Upload, ClipboardList, QrCode, Landmark, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/",                label: "Dashboard",        icon: LayoutDashboard },
  { href: "/pessoas",         label: "Pessoas",          icon: Users },
  { href: "/fontes",          label: "Fontes de Dívida", icon: CreditCard },
  { href: "/lancamentos",     label: "Lançamentos",      icon: FileText },
  { href: "/pagamentos",      label: "Pagamentos",       icon: DollarSign },
  { href: "/emprestimos",     label: "Empréstimos",      icon: Landmark },
  { href: "/pix",             label: "PIX",              icon: QrCode },
  { href: "/faturas",         label: "Faturas",          icon: Upload },
  { href: "/faturas/revisao", label: "Revisão",          icon: ClipboardList },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <>
      <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Controle</h1>
          <p className="text-xs text-gray-400">Financeiro</p>
        </div>
        <button onClick={() => setOpen(false)} className="md:hidden text-gray-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Botão hamburguer mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-2 rounded-lg shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay mobile */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar mobile (drawer) */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-56 bg-gray-900 text-white flex flex-col z-50 transition-transform duration-200",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {nav}
      </aside>
    </>
  );
}
