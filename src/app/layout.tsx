import type { Metadata } from "next";
import { Geist, Geist_Mono, Open_Sans } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkSOC",
  description: "Sistema de Controle Operacional Shopee Xpress",
};

export const viewport = {
  themeColor: "#EE4D2D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${openSans.variable} antialiased`}
      >
        {children}

        <footer className="py-8 text-center text-sm text-gray-400 dark:text-gray-600 print:hidden">
          <p>
            LinkSOC &copy; {new Date().getFullYear()} &bull; Criado por{' '}
            <a href="/suporte" className="hover:text-shopee-primary transition-colors font-medium">
              João Paulo S. S.
            </a>
          </p>
        </footer>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
