
"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function PublicHeader() {
  const { user, loading } = useAuth()

  return (
    <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/assets/logo.png" alt="RC Club Manager Logo" width={32} height={32} className="size-8" />
        <h1 className="text-xl font-bold tracking-tighter font-headline">
          RC Club Manager
        </h1>
      </Link>
      <nav className="flex items-center gap-2">
        {loading ? (
          <Skeleton className="h-10 w-24" />
        ) : user ? (
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Sign Up</Button>
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
