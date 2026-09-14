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
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
