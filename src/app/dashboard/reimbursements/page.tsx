"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ReimbursementForm } from "./reimbursement-form"

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

export default function ReimbursementsPage() {
  const [reimbursements, setReimbursements] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [newItems, setNewItems] = useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const router = useRouter()
  
  const fetchData = async () => {
    const { reimbursements, users, projects, newItems } = await getData();
    setReimbursements(reimbursements);
    setUsers(users);
    setProjects(projects);
    setNewItems(newItems);
  };

  useState(() => {
    fetchData()
  });
  
  const handleFormSubmit = () => {
    fetchData(); 
    router.refresh(); 
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Reimbursements</h2>
          <p className="text-muted-foreground">
            Submit and track expense reimbursement requests.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> New Reimbursement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Reimbursement Request</DialogTitle>
            </DialogHeader>
            <ReimbursementForm setOpen={setIsFormOpen} onFormSubmit={handleFormSubmit} />
          </DialogContent>
        </Dialog>
      </div>
      
      <Table>
        <TableHeader>
            <TableRow>
            <TableHead>Submitted By</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {reimbursements.map((req: any) => {
            const user = users.find((u: any) => u.id === req.submittedById);
            let details = req.notes || '';
            if (req.newItemRequestId) {
                const newItem: any = newItems.find((i: any) => i.id === req.newItemRequestId);
                if (newItem) {
                    const project: any = projects.find((p: any) => p.id === newItem.projectId);
                    details = `Purchase: ${newItem.itemName} for ${project?.title}`;
                }
            }
            
            return (
                <TableRow key={req.id}>
                <TableCell className="font-medium">{user?.name}</TableCell>
                <TableCell>{details}</TableCell>
                <TableCell>{req.createdAt?.toDate().toLocaleDateString()}</TableCell>
                <TableCell>
                    <Badge variant={getStatusVariant(req.status) as any}>{req.status}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono">${req.amount.toFixed(2)}</TableCell>
                </TableRow>
            )
            })}
        </TableBody>
        </Table>
    </div>
  )
}
