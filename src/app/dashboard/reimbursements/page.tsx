

"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PlusCircle } from "lucide-react"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import Image from "next/image"
import { format, formatDistanceToNow } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
          <div className={cn("h-2.5 w-2.5", config.color)}></div>
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

    const newItemsSnapshot = await getDocs(collection(db, "new_item_requests"));
    const newItems = newItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const userIds = [
      ...new Set([
        ...reimbursements.map((req: any) => req.submittedById),
        ...reimbursements.map((req: any) => req.reviewedById),
        ...reimbursements.map((req: any) => req.paidById),
        ...newItems.map((item: any) => item.requestedById),
        ...newItems.map((item: any) => item.approvedById)
      ].filter(Boolean))
    ];
    
    let users: any[] = [];
    if (userIds.length > 0) {
        const userChunks = [];
        for (let i = 0; i < userIds.length; i += 30) {
            userChunks.push(userIds.slice(i, i + 30));
        }

        for (const chunk of userChunks) {
            const usersQuery = query(collection(db, "users"), where("id", "in", chunk));
            const usersSnap = await getDocs(usersQuery);
            users.push(...usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
    }
    
    const bucketsSnapshot = await getDocs(collection(db, "procurement_buckets"));
    const buckets = bucketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { reimbursements, users, newItems, buckets };
}

function ReimbursementsPageContent() {
  const [data, setData] = useState<{ reimbursements: any[], users: any[], newItems: any[], buckets: any[] }>({ reimbursements: [], users: [], newItems: [], buckets: [] });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'selection' | 'procurement' | 'manual' | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    const fetchedData = await getData();
    
    const statusOrder = { pending: 1, approved: 2, paid: 3, rejected: 4 };
    fetchedData.reimbursements.sort((a, b) => {
        const orderA = statusOrder[a.status as keyof typeof statusOrder] || 5;
        const orderB = statusOrder[b.status as keyof typeof statusOrder] || 5;
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        const dateA = a.createdAt?.toDate() || 0;
        const dateB = b.createdAt?.toDate() || 0;
        return dateB.getTime() - dateA.getTime();
    });

    setData(fetchedData);
    setLoading(false);

    // Check for reimbursement ID in URL and open dialog
    const reimbursementId = searchParams.get('id');
    if (reimbursementId) {
        const request = fetchedData.reimbursements.find(r => r.id === reimbursementId);
        if (request) {
            setSelectedRequest(request);
        }
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onFormSubmit = useCallback(() => {
    fetchData(); 
    setFormMode(null);
  }, [fetchData]);
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
        setFormMode('selection');
    } else {
        setFormMode(null);
    }
  }

  const handleActionComplete = useCallback(() => {
    fetchData();
    setSelectedRequest(null);
  }, [fetchData]);
  
  const handleDialogClose = () => {
    setSelectedRequest(null);
    // Remove the query param from URL without reloading
    router.replace('/dashboard/reimbursements', {scroll: false});
  }

  const canApprove = currentUser?.permissions?.canApproveReimbursements;
  
  const selectedProcurementItem = selectedRequest?.newItemRequestId 
    ? data.newItems.find(item => item.id === selectedRequest.newItemRequestId) 
    : null;

  const procurementRequester = selectedProcurementItem
    ? data.users.find(u => u.id === selectedProcurementItem.requestedById)
    : null;

  const procurementApprover = selectedProcurementItem
    ? data.users.find(u => u.id === selectedProcurementItem.approvedById)
    : null;
    
  const reviewer = selectedRequest?.reviewedById ? data.users.find(u => u.id === selectedRequest.reviewedById) : null;
  const payer = selectedRequest?.paidById ? data.users.find(u => u.id === selectedRequest.paidById) : null;

  const shouldShowActions = canApprove || (selectedRequest?.status === 'approved' && currentUser?.role === 'treasurer');

  const renderFormContent = () => {
    switch (formMode) {
      case 'selection':
        return (
          <>
            <DialogHeader>
              <DialogTitle>New Reimbursement</DialogTitle>
              <DialogDescription>Is this reimbursement for a pre-approved procurement item?</DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 pt-4">
              <Button className="flex-1" onClick={() => setFormMode('procurement')}>Yes, it is</Button>
              <Button className="flex-1" variant="outline" onClick={() => setFormMode('manual')}>No, it's not</Button>
            </div>
          </>
        );
      case 'procurement':
        return <ReimbursementForm
          key="procurement-form"
          mode="procurement"
          onFormSubmit={onFormSubmit}
          currentUser={currentUser}
          procurementItems={data.newItems}
          procurementBuckets={data.buckets}
          onCancel={() => setFormMode('selection')}
        />
      case 'manual':
        return <ReimbursementForm
            key="manual-form"
            mode="manual"
            onFormSubmit={onFormSubmit}
            currentUser={currentUser}
            procurementItems={[]}
            procurementBuckets={[]}
            onCancel={() => setFormMode('selection')}
        />
      default:
        return null;
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
       <div className="space-y-6">
        <div>
          <h1 className="text-h1">Reimbursements</h1>
          <p className="text-base text-muted-foreground mt-2">
            Submit and track expense reimbursement requests.
          </p>
        </div>
        <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> New Reimbursement
            </Button>
        </DialogTrigger>
        
        <Dialog open={!!selectedRequest} onOpenChange={(isOpen) => !isOpen && handleDialogClose()}>
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
                      <TableHead>Request</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.reimbursements.map((req: any) => {
                      const user = data.users.find((u: any) => u.id === req.submittedById);
                      return (
                          <TableRow key={req.id} onClick={() => setSelectedRequest(req)} className="cursor-pointer">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <StatusCircle status={req.status} />
                                    <div>
                                        <div className="font-medium">{user?.name}</div>
                                        <div className="text-xs text-muted-foreground">{req.createdAt?.toDate() ? format(req.createdAt.toDate(), 'dd/MM/yy') : 'N/A'}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">₹{req.amount.toFixed(2)}</TableCell>
                          </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
           <DialogContent className="sm:max-w-sm">
            {selectedRequest && (
              <>
                <DialogHeader>
                    <DialogTitle>Reimbursement Details</DialogTitle>
                    <p className="text-2xl font-bold font-mono pt-2">₹{selectedRequest.amount.toFixed(2)}</p>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] -mx-6">
                    <div className="px-6 space-y-4">
                        <div className="text-sm">
                            <span className="text-muted-foreground">Submitted by: </span>
                            <span className="font-medium">{data.users.find((u: any) => u.id === selectedRequest.submittedById)?.name}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <div className="flex items-center gap-2">
                            <StatusCircle status={selectedRequest.status} />
                            <span className="font-medium capitalize">{selectedRequest.status.replace(/_/g, ' ')}</span>
                          </div>
                        </div>

                        {selectedRequest.status !== 'pending' && (
                           <div className="text-xs text-muted-foreground">
                              {selectedRequest.status === 'approved' && reviewer && (
                                  <p>Approved by {reviewer.name} {formatDistanceToNow(selectedRequest.reviewedAt.toDate(), { addSuffix: true })}</p>
                              )}
                              {selectedRequest.status === 'rejected' && reviewer && (
                                  <p>Rejected by {reviewer.name} {formatDistanceToNow(selectedRequest.reviewedAt.toDate(), { addSuffix: true })}</p>
                              )}
                              {selectedRequest.status === 'paid' && payer && (
                                   <p>Paid by {payer.name} {formatDistanceToNow(selectedRequest.paidAt.toDate(), { addSuffix: true })}</p>
                              )}
                          </div>
                        )}

                         {selectedProcurementItem && (
                          <Card className="bg-secondary">
                            <CardHeader className="p-4">
                              <CardTitle className="text-base">Associated Procurement Request</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 text-sm space-y-2">
                               <p><span className="font-medium text-muted-foreground">Item:</span> {selectedProcurementItem.itemName} (x{selectedProcurementItem.quantity})</p>
                               <p><span className="font-medium text-muted-foreground">Justification:</span> {selectedProcurementItem.justification}</p>
                               <p><span className="font-medium text-muted-foreground">Requested by:</span> {procurementRequester?.name || 'N/A'}</p>
                               <p><span className="font-medium text-muted-foreground">Approved by:</span> {procurementApprover?.name || 'N/A'}</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {!selectedProcurementItem && (
                          <div>
                              <h4 className="font-medium mb-1 text-sm text-muted-foreground">Notes/Reason</h4>
                              <p className="text-sm">{selectedRequest.notes || 'No notes provided.'}</p>
                          </div>
                        )}

                        <div>
                            <h4 className="font-medium mb-1 text-sm text-muted-foreground">Receipt</h4>
                            {selectedRequest.proofImageUrls?.[0] ? (
                            <a href={selectedRequest.proofImageUrls[0]} target="_blank" rel="noopener noreferrer">
                                <Image 
                                src={selectedRequest.proofImageUrls[0]}
                                alt="Receipt"
                                width={400}
                                height={400}
                                className="w-full h-auto border object-contain"
                                />
                            </a>
                            ) : (
                            <p className="text-sm text-muted-foreground">No receipt image uploaded.</p>
                            )}
                        </div>
                    </div>
                </ScrollArea>
                 {shouldShowActions && (
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
        {renderFormContent()}
      </DialogContent>
    </Dialog>
  )
}

export default function ReimbursementsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReimbursementsPageContent />
        </Suspense>
    );
}
