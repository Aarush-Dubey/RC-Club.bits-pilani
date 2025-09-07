
"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import {
  HandCoins,
  LayoutGrid,
  LineChart,
  ShoppingCart,
  ToyBrick,
  Truck,
  Users,
} from "lucide-react"

import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { DashboardHeader } from "@/components/dashboard-header"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ThemeProvider } from "@/context/theme-provider"

const baseMenuItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/dashboard/projects", icon: ToyBrick, label: "Projects" },
  { href: "/dashboard/inventory", icon: ShoppingCart, label: "Inventory" },
  { href: "/dashboard/procurement", icon: Truck, label: "Procurement" },
  { href: "/dashboard/reimbursements", icon: HandCoins, label: "Reimbursements" },
];

const adminMenuItems = [
    { href: "/dashboard/manage-club", icon: Users, label: "Manage Club", permission: "canManageUsers" },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen w-full">
        <div className="hidden w-64 flex-col border-r bg-sidebar p-4 md:flex">
          <div className="mt-8 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="flex-1">
          <header className="flex h-16 items-center justify-end border-b px-6">
            <Skeleton className="h-9 w-9" />
          </header>
          <main className="p-8">
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </div>
    )
  }

  const menuItems = [
      ...baseMenuItems,
      ...adminMenuItems.filter(item => user.permissions?.[item.permission as keyof typeof user.permissions]),
  ]

  return (
     <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SidebarProvider defaultOpen={false}>
          <Sidebar>
            <SidebarHeader />
            <SidebarContent className="flex-grow">
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref>
                      <SidebarMenuButton
                        isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
                        tooltip={item.label}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto p-4 sm:p-6 md:p-8">{children}</div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
  )
}
