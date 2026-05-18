import type { Metadata } from 'next';
import { DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'NTC Coach — Révision Titre Pro NTC',
  description: 'Plateforme de révision pour le Titre Professionnel Négociateur Technico-Commercial (RNCP 39063) — REAC 2024',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className="font-sans bg-stone-100 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
