import { PlusCircle } from "lucide-react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
        case 'pending': return 'secondary'
        case 'approved': return 'default'
        case 'fulfilled': return 'default'
        case 'rejected': return 'destructive'
        default: return 'outline'
    }
}

async function getData() {
    const inventorySnapshot = await getDocs(collection(db, "inventory_items"));
    const inventory = inventorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const inventoryRequestsSnapshot = await getDocs(collection(db, "inventory_requests"));
    const inventoryRequests = inventoryRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { inventory, inventoryRequests, users };
}

export default async function InventoryPage() {
  const { inventory, inventoryRequests, users } = await getData();

  return (
    <div className="space-y-8">
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
        <TabsList className="border-b rounded-none p-0 bg-transparent">
          <TabsTrigger value="all" className="rounded-none data-[state=active]:border-b-2 border-primary data-[state=active]:shadow-none">All Items</TabsTrigger>
          <TabsTrigger value="requests" className="rounded-none data-[state=active]:border-b-2 border-primary data-[state=active]:shadow-none">Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Checked Out</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {inventory.map((item: any) => {
                    return (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.totalQuantity}</TableCell>
                            <TableCell>{item.availableQuantity}</TableCell>
                            <TableCell>{item.checkedOutQuantity}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" disabled={item.availableQuantity === 0}>Request</Button>
                            </TableCell>
                        </TableRow>
                    )
                    })}
                </TableBody>
            </Table>
        </TabsContent>
        <TabsContent value="requests" className="mt-6">
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
                {inventoryRequests.map((req: any) => {
                    const item = inventory.find((i: any) => i.id === req.itemId)
                    const user = users.find((u: any) => u.id === req.requestedById)
                    return (
                        <TableRow key={req.id}>
                            <TableCell className="font-medium">{item?.name}</TableCell>
                            <TableCell>{user?.name}</TableCell>
                            <TableCell>{req.createdAt.toDate().toLocaleDateString()}</TableCell>
                            <TableCell><Badge variant={getStatusVariant(req.status) as any}>{req.status}</Badge></TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="sm" disabled={req.status !== 'pending'}>Approve</Button>
                                <Button variant="destructive" size="sm" disabled={req.status !== 'pending'}>Reject</Button>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
            </Table>
        </TabsContent>
      </Tabs>
    </div>
  )
}
