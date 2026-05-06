import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solola's · Taller Culinario & Catering",
  description:
    "Sistema de gestión para repostería, catering y taller culinario.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-DO">
      <body>{children}</body>
    </html>
  );
}
