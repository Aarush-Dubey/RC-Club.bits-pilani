import { PlusCircle } from "lucide-react"

import { inventory, inventoryRequests, users } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Available': return 'default'
        case 'On Loan': return 'secondary'
        case 'Overdue': return 'destructive'
        case 'Pending': return 'secondary'
        case 'Approved': return 'default'
        case 'Rejected': return 'destructive'
        default: return 'outline'
    }
}

export default function InventoryPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Inventory</h2>
          <p className="text-muted-foreground">
            Manage equipment, track loans, and approve requests.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Equipment</CardTitle>
              <CardDescription>
                A complete list of all equipment owned by the club.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => {
                    const borrower = users.find(u => u.id === item.borrowedBy)
                    return (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell><Badge variant={getStatusVariant(item.status)}>{item.status}</Badge></TableCell>
                            <TableCell>{borrower?.name || 'N/A'}</TableCell>
                            <TableCell>{item.dueDate || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" disabled={item.status !== 'Available'}>Request</Button>
                            </TableCell>
                        </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Borrowing Requests</CardTitle>
              <CardDescription>
                Approve or reject requests for equipment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {inventoryRequests.map(req => {
                        const item = inventory.find(i => i.id === req.itemId)
                        const user = users.find(u => u.id === req.userId)
                        return (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{item?.name}</TableCell>
                                <TableCell>{user?.name}</TableCell>
                                <TableCell>{req.date}</TableCell>
                                <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" disabled={req.status !== 'Pending'}>Approve</Button>
                                    <Button variant="destructive" size="sm" disabled={req.status !== 'Pending'}>Reject</Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
