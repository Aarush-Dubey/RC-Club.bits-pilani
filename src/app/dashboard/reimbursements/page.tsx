
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle } from "lucide-react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending': return { color: 'bg-yellow-500', tooltip: 'Pending' };
    case 'approved': return { color: 'bg-blue-500', tooltip: 'Approved' };
    case 'paid': return { color: 'bg-green-500', tooltip: 'Paid' };
    case 'rejected': return { color: 'bg-red-500', tooltip: 'Rejected' };
    default: return { color: 'bg-gray-400', tooltip: 'Unknown' };
  }
};

const StatusCircle = ({ status }: { status: string }) => {
  const config = getStatusConfig(status);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={cn("h-3 w-3 rounded-full", config.color)}></div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};


async function getData() {
    const reimbursementsSnapshot = await getDocs(collection(db, "reimbursements"));
    const reimbursements = reimbursementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const newItemsSnapshot = await getDocs(collection(db, "new_item_requests"));
    const newItems = newItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const bucketsSnapshot = await getDocs(collection(db, "procurement_buckets"));
    const buckets = bucketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { reimbursements, users, newItems, buckets };
}

export default function ReimbursementsPage() {
  const [data, setData] = useState<{ reimbursements: any[], users: any[], newItems: any[], buckets: any[] }>({ reimbursements: [], users: [], newItems: [], buckets: [] });
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(true);
  const router = useRouter()
  const { user: currentUser } = useAuth();
  
  const fetchData = async () => {
    setLoading(true);
    const { reimbursements, users, newItems, buckets } = await getData();
    setData({ reimbursements, users, newItems, buckets });
    setLoading(false);
  };

  useEffect(() => {
    fetchData()
  }, []);
  
  const handleFormSubmit = () => {
    fetchData(); 
    setIsFormOpen(false);
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
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New Reimbursement Request</DialogTitle>
            </DialogHeader>
            <ReimbursementForm 
              setOpen={setIsFormOpen} 
              onFormSubmit={handleFormSubmit}
              currentUser={currentUser}
              procurementItems={data.newItems}
              procurementBuckets={data.buckets}
            />
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
            {data.reimbursements.map((req: any) => {
            const user = data.users.find((u: any) => u.id === req.submittedById);
            let details = req.notes || '';
            if (req.newItemRequestId) {
                const newItem: any = data.newItems.find((i: any) => i.id === req.newItemRequestId);
                if (newItem) {
                    details = `Purchase: ${newItem.itemName}`;
                }
            }
            
            return (
                <TableRow key={req.id}>
                <TableCell className="font-medium">{user?.name}</TableCell>
                <TableCell>{details}</TableCell>
                <TableCell>{req.createdAt?.toDate().toLocaleDateString()}</TableCell>
                <TableCell>
                    <StatusCircle status={req.status} />
                </TableCell>
                <TableCell className="text-right font-mono">₹{req.amount.toFixed(2)}</TableCell>
                </TableRow>
            )
            })}
        </TableBody>
        </Table>
    </div>
  )
}
