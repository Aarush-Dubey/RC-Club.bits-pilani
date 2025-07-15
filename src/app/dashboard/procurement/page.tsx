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

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending':
      return 'secondary'
    case 'approved':
      return 'default'
    case 'ordered':
      return 'outline'
    case 'rejected':
      return 'destructive'
    default:
      return 'outline'
  }
}

async function getData() {
    const procurementRequestsSnapshot = await getDocs(collection(db, "new_item_requests"));
    const procurementRequests = procurementRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { procurementRequests, users };
}

export default async function ProcurementPage() {
  const { procurementRequests, users } = await getData();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Procurement</h2>
          <p className="text-muted-foreground">
            Request new equipment and track purchase orders.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> New Purchase Request
        </Button>
      </div>

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
            {procurementRequests.map((req: any) => {
            const user = users.find((u: any) => u.id === req.requestedById)
            return (
                <TableRow key={req.id}>
                <TableCell>
                    <div className="font-medium">{req.itemName}</div>
                    <div className="text-sm text-muted-foreground">{req.description}</div>
                </TableCell>
                <TableCell>{user?.name}</TableCell>
                <TableCell>{req.createdAt.toDate().toLocaleDateString()}</TableCell>
                <TableCell>
                    <Badge variant={getStatusVariant(req.status) as any}>{req.status}</Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" disabled={req.status !== 'pending'}>Approve</Button>
                    <Button variant="destructive" size="sm" disabled={req.status !== 'pending'}>Reject</Button>
                </TableCell>
                </TableRow>
            )
            })}
        </TableBody>
        </Table>
    </div>
  )
}
