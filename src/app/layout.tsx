import type { Metadata, Viewport } from "next";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Imtihan — Générateur d'examens pour enseignants marocains",
  description:
    "Générez des sujets d'examen conformes au système éducatif marocain : devoirs surveillés, examens normalisés locaux, régionaux et nationaux, pour chaque niveau et chaque filière, avec barème et corrigé.",
};

export const viewport: Viewport = {
  themeColor: "#0b5d4b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
