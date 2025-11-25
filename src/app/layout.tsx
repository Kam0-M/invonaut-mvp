import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flowance - Streamline Your Business Operations",
  description: "A comprehensive SaaS platform for managing invoices, clients, and business operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}