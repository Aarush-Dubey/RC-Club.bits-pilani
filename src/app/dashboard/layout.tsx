"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart,
  HandCoins,
  LayoutGrid,
  LineChart,
  ShoppingCart,
  ToyBrick,
  Truck,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { DashboardHeader } from "@/components/dashboard-header"
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

const menuItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/dashboard/projects", icon: ToyBrick, label: "Projects" },
  { href: "/dashboard/inventory", icon: ShoppingCart, label: "Inventory" },
  { href: "/dashboard/procurement", icon: Truck, label: "Procurement" },
  { href: "/dashboard/reimbursements", icon: HandCoins, label: "Reimbursements" },
  { href: "/dashboard/finance", icon: LineChart, label: "Finance AI" },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <BarChart className="size-7 text-primary" />
            <h2 className="text-lg font-bold tracking-tighter text-sidebar-foreground font-headline">
              RC Club Manager
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
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
      <SidebarInset className="flex flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
