
"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function PublicHeader() {
  const { user, loading } = useAuth()

  return (
    <header className="container px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-50 bg-white border-b border-brutalist-border-light">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/assets/logo.png" alt="RC-Club Logo" width={32} height={32} className="size-8" />
        <h1 className="text-xl font-bold tracking-tighter">
          RC-Club
        </h1>
      </Link>
      <nav className="flex items-center gap-2">
        {loading ? (
          <Skeleton className="h-10 w-24 rounded-none" />
        ) : user ? (
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-none border-black">Go to Dashboard</Button>
          </Link>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" className="rounded-none">Login</Button>
            </Link>
            <Link href="/register">
              <Button variant="default" className="bg-black text-white hover:bg-neutral-800 rounded-none">Sign Up</Button>
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
