import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from './providers';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'VerityVote',
  description: 'A secure and transparent decentralized voting system.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AppProviders>
            <div className="auth-background min-h-screen">
              {children}
            </div>
            <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
