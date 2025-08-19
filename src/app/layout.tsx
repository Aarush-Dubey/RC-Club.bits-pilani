import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from "@/context/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'RC-Club',
  description: 'Manage your RC club with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const iconUrl = '/assets/logo.png?v=2';
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Standard favicon */}
        <link
          rel="icon"
          href={iconUrl}
          sizes="any"
          type="image/png"
        />
        {/* Shortcut (legacy support) */}
        <link
          rel="shortcut icon"
          href={iconUrl}
          type="image/png"
        />
        {/* Apple touch icon */}
        <link
          rel="apple-touch-icon"
          href={iconUrl}
        />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
      </body>
    </html>
  );
}
