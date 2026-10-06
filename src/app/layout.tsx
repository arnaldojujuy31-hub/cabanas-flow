import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CabañasFlow | Gestión de Cabañas y Alquileres Temporarios",
  description:
    "Sistema de gestión y calendario de ocupación en tiempo real para cabañas y complejos turísticos en Purmamarca.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1c1917",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${jakarta.variable} h-full dark`}>
      <body className="min-h-full flex flex-col md:flex-row bg-stone-950 text-stone-100 font-sans antialiased selection:bg-amber-500 selection:text-white">
        <Navigation />
        <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
