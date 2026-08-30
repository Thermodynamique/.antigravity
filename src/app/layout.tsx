import type { Metadata } from "next";
import "./globals.css";
import "./blocknote.css";

export const metadata: Metadata = {
  title: "Handy IA — Système de Raisonnement & Canvas Spatial",
  description: "Plateforme agentique de raisonnement spatial et mémoire continue par Handy IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-black text-white font-sans">{children}</body>
    </html>
  );
}
