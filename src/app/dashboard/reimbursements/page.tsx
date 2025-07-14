import { PlusCircle } from "lucide-react"

import { reimbursements, users } from "@/lib/data"
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
    case 'Paid':
      return 'outline'
    case 'Rejected':
      return 'destructive'
    default:
      return 'outline'
  }
}

export default function ReimbursementsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Reimbursements</h2>
          <p className="text-muted-foreground">
            Submit and track expense reimbursement requests.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> New Reimbursement
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Reimbursement Requests</CardTitle>
          <CardDescription>
            A log of all reimbursement claims submitted by members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted By</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reimbursements.map((req) => {
                const user = users.find((u) => u.id === req.userId)
                return (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{user?.name}</TableCell>
                    <TableCell>{req.project}</TableCell>
                    <TableCell>{req.date}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">${req.amount.toFixed(2)}</TableCell>
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
