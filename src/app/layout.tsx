import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BN2 HUB Admin | BN2 Consulting",
  description: "Espace administrateur de la plateforme BN2 HUB de BN2 Consulting.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
