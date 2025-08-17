
"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ThemeToggle } from "./theme-toggle"

export function PublicHeader() {
  const { user, loading } = useAuth()

  return (
    <header className="container px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-50 border-b border-transparent">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/assets/logo.png" alt="RC-Club Logo" width={32} height={32} className="size-8" />
        <h1 className="text-xl font-bold tracking-tighter text-white">
          RC-Club
        </h1>
      </Link>
      <nav className="flex items-center gap-2">
        <ThemeToggle />
        {loading ? (
          <Skeleton className="h-10 w-24 rounded-none" />
        ) : user ? (
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-none border-white text-white hover:bg-white/10">Go to Dashboard</Button>
          </Link>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" className="rounded-none text-white hover:bg-white/10">Login</Button>
            </Link>
            <Link href="/register">
              <Button variant="default" className="bg-white text-black hover:bg-neutral-200 rounded-none">Sign Up</Button>
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
