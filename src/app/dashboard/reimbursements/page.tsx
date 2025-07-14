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
    case 'paid':
      return 'outline'
    case 'rejected':
      return 'destructive'
    default:
      return 'outline'
  }
}

async function getData() {
    const reimbursementsSnapshot = await getDocs(collection(db, "reimbursements"));
    const reimbursements = reimbursementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const projectsSnapshot = await getDocs(collection(db, "projects"));
    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const newItemsSnapshot = await getDocs(collection(db, "new_item_requests"));
    const newItems = newItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { reimbursements, users, projects, newItems };
}

export default async function ReimbursementsPage() {
  const { reimbursements, users, projects, newItems } = await getData();
  
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
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reimbursements.map((req: any) => {
                const user = users.find((u: any) => u.id === req.submittedById);
                let description = req.description;
                if (req.newItemRequestId) {
                    const newItem: any = newItems.find((i: any) => i.id === req.newItemRequestId);
                    if (newItem) {
                        const project: any = projects.find((p: any) => p.id === newItem.projectId);
                        description = `Purchase: ${newItem.itemName} for ${project?.title}`;
                    }
                }
                
                return (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{user?.name}</TableCell>
                    <TableCell>{description}</TableCell>
                    <TableCell>{req.createdAt.toDate().toLocaleDateString()}</TableCell>
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
