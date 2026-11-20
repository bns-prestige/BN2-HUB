import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BN2 HUB",
  description: "La plateforme de gestion et de support informatique de BN2 Consulting.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
