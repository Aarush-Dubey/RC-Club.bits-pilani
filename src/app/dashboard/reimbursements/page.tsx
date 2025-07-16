
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle } from "lucide-react"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import Image from "next/image"
import { format } from "date-fns"

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
import { ReimbursementActions } from "./reimbursement-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    <TooltipProvider delayDuration={0}>
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
    const reimbursementsSnapshot = await getDocs(query(collection(db, "reimbursements"), orderBy("createdAt", "desc")));
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
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

  const handleActionComplete = () => {
    fetchData();
    setSelectedRequest(null);
  }

  const canApprove = currentUser?.permissions?.canApproveReimbursements;

  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
       <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Reimbursements</h2>
          <p className="text-muted-foreground">
            Submit and track expense reimbursement requests.
          </p>
        </div>
        <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> New Reimbursement
            </Button>
        </DialogTrigger>
        
        <Dialog open={!!selectedRequest} onOpenChange={(isOpen) => !isOpen && setSelectedRequest(null)}>
          <Card>
            <CardHeader>
              <CardTitle>Reimbursement Requests</CardTitle>
              <CardDescription>
                {canApprove ? "Click a request to view details and take action." : "A log of all reimbursement requests."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                    <TableRow>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.reimbursements.map((req: any) => {
                      const user = data.users.find((u: any) => u.id === req.submittedById);
                      return (
                          <TableRow key={req.id} onClick={() => setSelectedRequest(req)} className="cursor-pointer">
                            <TableCell className="font-medium">{user?.name}</TableCell>
                            <TableCell>{req.createdAt?.toDate() ? format(req.createdAt.toDate(), 'dd/MM/yy') : 'N/A'}</TableCell>
                            <TableCell>
                                <StatusCircle status={req.status} />
                            </TableCell>
                            <TableCell className="text-right font-mono">₹{req.amount.toFixed(2)}</TableCell>
                          </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
           <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            {selectedRequest && (
              <>
                <DialogHeader>
                    <DialogTitle>Reimbursement Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 pr-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-mono font-bold">₹{selectedRequest.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Submitted by</span>
                    <span className="font-medium">{data.users.find((u: any) => u.id === selectedRequest.submittedById)?.name}</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Notes/Reason</h4>
                    <p className="text-sm text-muted-foreground">{selectedRequest.notes || 'No notes provided.'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Receipt</h4>
                    {selectedRequest.proofImageUrls?.[0] ? (
                      <a href={selectedRequest.proofImageUrls[0]} target="_blank" rel="noopener noreferrer">
                        <Image 
                          src={selectedRequest.proofImageUrls[0]}
                          alt="Receipt"
                          width={400}
                          height={400}
                          className="w-full h-auto rounded-md border object-contain"
                        />
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">No receipt image uploaded.</p>
                    )}
                  </div>
                </div>
                 {canApprove && (
                    <div className="pt-4 border-t">
                        <ReimbursementActions request={selectedRequest} onActionComplete={handleActionComplete} />
                    </div>
                )}
              </>
            )}
           </DialogContent>
        </Dialog>
      </div>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
  )
}
