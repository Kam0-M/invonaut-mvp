import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";
import Script from 'next/script';

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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      
      {/* ✅ Clarity script goes here */}
      <Script
        id="microsoft-clarity"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "wn0k9cxu7r");`,
        }}
      />

      <body className="font-sans antialiased">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}