
"use client"

import type { FC, ReactNode } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserNav } from "@/components/user-nav"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

type DashboardHeaderProps = {
  children?: ReactNode
}

export const DashboardHeader: FC<DashboardHeaderProps> = ({ children }) => {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  )
}
