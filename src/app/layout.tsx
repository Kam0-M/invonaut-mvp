import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'Flowance - AI-Powered Invoicing for Freelancers',
  description: 'Never chase another late payment. AI that turns your invoicing chaos into cash flow predictability.',
  keywords: 'invoicing, freelance, AI, payment tracking, invoice management',
  authors: [{ name: 'Flowance' }],
  openGraph: {
    title: 'Flowance - AI-Powered Invoicing',
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}