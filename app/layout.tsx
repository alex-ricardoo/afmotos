import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AF Locações e Vendas | Loja Premium de Motocicletas',
  description:
    'Aluguel, compra, venda e consignação de motos com procedência garantida, laudo cautelar aprovado e atendimento premium.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://aflocacoesevendas.com.br'
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050505] text-[#f4f4f2] font-sans selection:bg-[#c9a44c] selection:text-black">
        {children}
      </body>
    </html>
  );
}
