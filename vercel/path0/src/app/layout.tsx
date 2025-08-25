/**
 * This file defines the root layout for the entire application.
 * It sets up the basic HTML structure, imports global CSS,
 * and wraps the content with essential providers like the AuthProvider for authentication state
 * and the Toaster for displaying notifications.
 */
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

