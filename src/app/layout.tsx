import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";

export const metadata: Metadata = {
  title: 'Invonaut - AI-Powered Invoicing for Freelancers',
  description: 'Never chase another late payment. AI that turns your invoicing chaos into cash flow predictability.',
  keywords: 'invoicing, freelance, AI, payment tracking, invoice management',
  authors: [{ name: 'Invonaut' }],
  openGraph: {
    title: 'Invonaut - AI-Powered Invoicing',
    description: 'Smart invoicing for freelancers',
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