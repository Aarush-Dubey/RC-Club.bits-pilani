"use client"

import type { FC, ReactNode } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserNav } from "@/components/user-nav"
import { usePathname } from "next/navigation"

type DashboardHeaderProps = {
  children?: ReactNode
}

function getTitleFromPath(path: string) {
  const segments = path.split('/').filter(Boolean);
  if (segments.length < 2) return 'Dashboard';
  const title = segments[1];
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export const DashboardHeader: FC<DashboardHeaderProps> = ({ children }) => {
  const pathname = usePathname();
  const title = getTitleFromPath(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-xl font-semibold tracking-tighter font-headline">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {children}
        <UserNav />
      </div>
    </header>
  )
}
