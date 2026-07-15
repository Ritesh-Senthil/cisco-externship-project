import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "CaroSHIELD · N.C. State Fair",
  description:
    "CaroSHIELD — AI-driven event readiness and cross-domain incident response for the N.C. State Fair, powered by Cisco.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${archivo.variable} antialiased`}>{children}</body>
    </html>
  );
}
