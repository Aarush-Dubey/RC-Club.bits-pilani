import { PlusCircle } from "lucide-react"

import { procurementRequests, users } from "@/lib/data"
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
    case 'Pending':
      return 'secondary'
    case 'Approved':
      return 'default'
    case 'Ordered':
      return 'outline'
    case 'Rejected':
      return 'destructive'
    default:
      return 'outline'
  }
}

export default function ProcurementPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
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

      <Card>
        <CardHeader>
          <CardTitle>All Procurement Requests</CardTitle>
          <CardDescription>
            A log of all requests to purchase new items for the club.
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
              {procurementRequests.map((req) => {
                const user = users.find((u) => u.id === req.userId)
                return (
                  <TableRow key={req.id}>
                    <TableCell>
                        <div className="font-medium">{req.item} (x{req.quantity})</div>
                        <div className="text-sm text-muted-foreground">{req.reason}</div>
                    </TableCell>
                    <TableCell>{user?.name}</TableCell>
                    <TableCell>{req.date}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                    </TableCell>
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
    </div>
  )
}
