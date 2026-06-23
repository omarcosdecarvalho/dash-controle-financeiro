import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Controle Financeiro",
  description: "Sistema de controle financeiro pessoal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={geist.variable}>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Sidebar />
        <main className="md:ml-56 min-h-screen p-4 md:p-8 pt-16 md:pt-8">{children}</main>
      </body>
    </html>
  );
}
