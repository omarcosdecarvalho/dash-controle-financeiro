"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  DollarSign,
  Upload,
  ClipboardList,
  QrCode,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/",                 label: "Dashboard",       icon: LayoutDashboard },
  { href: "/pessoas",          label: "Pessoas",         icon: Users },
  { href: "/fontes",           label: "Fontes de Dívida",icon: CreditCard },
  { href: "/lancamentos",      label: "Lançamentos",     icon: FileText },
  { href: "/pagamentos",       label: "Pagamentos",      icon: DollarSign },
  { href: "/emprestimos",      label: "Empréstimos",     icon: Landmark },
  { href: "/pix",              label: "PIX",             icon: QrCode },
  { href: "/faturas",          label: "Faturas",         icon: Upload },
  { href: "/faturas/revisao",  label: "Revisão",         icon: ClipboardList },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-gray-900 text-white flex flex-col z-40">
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white">Controle</h1>
        <p className="text-xs text-gray-400">Financeiro</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
    </aside>
  );
}
