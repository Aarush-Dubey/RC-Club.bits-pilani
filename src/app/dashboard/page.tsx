'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ArrowUpRight, CheckCircle, Clock, HandCoins, KeyRound, ShoppingCart, ToyBrick, Users } from "lucide-react"

import { projectStatusData, roomStatus, keyStatus, projects, inventory, reimbursements } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const onLoanCount = inventory.filter(item => item.status === 'On Loan' || item.status === 'Overdue').length;
const pendingReimbursements = reimbursements.filter(r => r.status === 'Pending').length;


export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <ToyBrick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 since last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Items on Loan
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onLoanCount}</div>
            <p className="text-xs text-muted-foreground">
              {inventory.filter(i => i.status === 'Overdue').length} items overdue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReimbursements}</div>
            <p className="text-xs text-muted-foreground">
              Reimbursements waiting
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Room Status</CardTitle>
            {roomStatus.occupied ? <Users className="h-4 w-4 text-muted-foreground" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{roomStatus.occupied ? `Occupied by ${roomStatus.user}` : 'Available'}</div>
            <p className="text-xs text-muted-foreground">
              {roomStatus.occupied ? `Since ${roomStatus.since}` : 'Ready for use'}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Project Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={projectStatusData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Recent Projects</CardTitle>
            <CardDescription>
              A look at the latest projects started in the club.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.slice(0, 5).map(project => (
                        <TableRow key={project.id}>
                            <TableCell>
                                <div className="font-medium">{project.name}</div>
                                <div className="text-sm text-muted-foreground">{project.description.substring(0,40)}...</div>
                            </TableCell>
                            <TableCell><Badge variant={project.status === 'Completed' ? 'default' : 'secondary'}>{project.status}</Badge></TableCell>
                            <TableCell className="text-right">${project.budget.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
