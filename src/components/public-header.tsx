
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
    <header className="container px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-50 bg-white dark:bg-black border-b border-brutalist-border-light dark:border-brutalist-border-dark">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/assets/logo.png" alt="RC-Club Logo" width={32} height={32} className="size-8" />
        <h1 className="text-xl font-bold tracking-tighter text-black dark:text-white">
          RC-Club
        </h1>
      </Link>
      <nav className="flex items-center gap-2">
        <ThemeToggle />
        {loading ? (
          <Skeleton className="h-10 w-24 rounded-none" />
        ) : user ? (
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-none border-black dark:border-white text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900">Go to Dashboard</Button>
          </Link>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" className="rounded-none text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900">Login</Button>
            </Link>
            <Link href="/register">
              <Button variant="default" className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-none">Sign Up</Button>
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
