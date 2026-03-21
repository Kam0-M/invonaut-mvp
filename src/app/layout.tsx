import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";

export const metadata: Metadata = {
  title: 'Invonaut - From Contract to Cash. Automated.',
  description: 'From contract to cash, automated. Contracts, invoices, time tracking, expenses, and cash flow — all in one platform.',
  keywords: 'invoicing, freelance, AI, payment tracking, invoice management',
  authors: [{ name: 'Invonaut' }],
  openGraph: {
    title: 'Invonaut - From Contract to Cash',
    description: 'From contract to cash. Automated.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}