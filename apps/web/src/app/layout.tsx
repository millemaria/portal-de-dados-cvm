import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Portal de Dados CVM | Dados Financeiros de Companhias Abertas",
  description:
    "Consulte dados financeiros públicos de companhias abertas brasileiras. Demonstrações financeiras, indicadores, balanços e histórico de resultados direto da CVM.",
  keywords: [
    "CVM",
    "dados financeiros",
    "companhias abertas",
    "B3",
    "bolsa de valores",
    "balanço patrimonial",
    "DRE",
    "demonstrações financeiras",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950">
        <Header />
        <main className="flex-1 w-full flex flex-col items-center justify-start">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
