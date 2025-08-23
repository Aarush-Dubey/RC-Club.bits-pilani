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
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
      </body>
    </html>
  );
}
