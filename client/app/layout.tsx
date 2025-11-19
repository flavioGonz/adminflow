import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AdminFlow - Plataforma de gestión",
  description:
    "Panel integral para administrar clientes, tickets, contratos y finanzas en español.",
};

import { Toaster } from "@/components/ui/sonner";
import { PageTransition } from "@/components/ui/page-transition";
import Providers from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <PageTransition>
            {children}
          </PageTransition>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
