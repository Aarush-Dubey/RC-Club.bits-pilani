
"use client";

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { ReimbursementActions } from "./reimbursement-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending': return { color: 'bg-yellow-500', tooltip: 'Pending' };
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
          <div className={cn("h-2.5 w-2.5 rounded-full", config.color)}></div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const serializeData = (data: any) => {
    if (!data) return data;
    if (data.toDate) return data.toDate().toISOString();
    if (Array.isArray(data)) return data.map(serializeData);
    if (typeof data === 'object') {
        const res: { [key: string]: any } = {};
        for (const key of Object.keys(data)) {
            res[key] = serializeData(data[key]);
        }
        return res;
    }
    return data;
};

async function getData() {
    const reimbursementsSnapshot = await getDocs(query(collection(db, "reimbursements"), orderBy("createdAt", "desc")));
    const reimbursements = reimbursementsSnapshot.docs.map(doc => serializeData({ id: doc.id, ...doc.data() }));

    const procurementRequestsSnapshot = await getDocs(collection(db, "procurement_requests"));
    const procurementRequests = procurementRequestsSnapshot.docs.map(doc => serializeData({ id: doc.id, ...doc.data() }));

    const userIds = [
      ...new Set([
        ...reimbursements.map((req: any) => req.submittedById),
        ...reimbursements.map((req: any) => req.paidById),
        ...reimbursements.map((req: any) => req.rejectedById),
        ...procurementRequests.map((item: any) => item.requestedById),
        ...procurementRequests.map((item: any) => item.approvedById)
      ].filter(Boolean))
    ];
    
    let users: any[] = [];
    if (userIds.length > 0) {
        const userChunks = [];
        for (let i = 0; i < userIds.length; i += 30) {
            userChunks.push(userIds.slice(i, i + 30));
        }

        for (const chunk of userChunks) {
            if(chunk.length > 0) {
                const usersQuery = query(collection(db, "users"), where("id", "in", chunk));
                const usersSnap = await getDocs(usersQuery);
                users.push(...usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        }
    }
    
    return { reimbursements, users, procurementRequests };
}

function ReimbursementsPageContent() {
  const [data, setData] = useState<{ reimbursements: any[], users: any[], procurementRequests: any[] }>({ reimbursements: [], users: [], procurementRequests: [] });
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    const fetchedData = await getData();
    
    const statusOrder = { pending: 1, paid: 2, rejected: 3 };
    fetchedData.reimbursements.sort((a, b) => {
        const orderA = statusOrder[a.status as keyof typeof statusOrder] || 4;
        const orderB = statusOrder[b.status as keyof typeof statusOrder] || 4;
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
    });

    setData(fetchedData);
    setLoading(false);

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

  const handleActionComplete = useCallback(() => {
    fetchData();
    setSelectedRequest(null);
  }, [fetchData]);
  
  const handleDialogClose = () => {
    setSelectedRequest(null);
    router.replace('/dashboard/reimbursements', {scroll: false});
  }

  const canManage = currentUser?.role === 'treasurer';
  
  const procurementItem = selectedRequest?.procurementRequestId 
    ? data.procurementRequests.find(item => item.id === selectedRequest.procurementRequestId) 
    : null;

  const procurementRequester = procurementItem
    ? data.users.find(u => u.id === procurementItem.requestedById)
    : null;

  const procurementApprover = procurementItem
    ? data.users.find(u => u.id === procurementItem.approvedById)
    : null;
    
  const reviewer = selectedRequest?.rejectedById ? data.users.find(u => u.id === selectedRequest.rejectedById) : null;
  const payer = selectedRequest?.paidById ? data.users.find(u => u.id === selectedRequest.paidById) : null;

  const shouldShowActions = canManage && selectedRequest?.status === 'pending';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1">Reimbursements</h1>
        <p className="text-base text-muted-foreground mt-2">
          Submit and track expense reimbursement requests.
        </p>
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={(isOpen) => !isOpen && handleDialogClose()}>
        <Card>
          <CardHeader>
            <CardTitle>Reimbursement Requests</CardTitle>
            <CardDescription>
              {canManage ? "Click a request to view details and take action." : "A log of all reimbursement requests."}
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
                    const item = req.procurementRequestId ? data.procurementRequests.find(p => p.id === req.procurementRequestId) : null;
                    return (
                        <TableRow key={req.id} onClick={() => setSelectedRequest(req)} className="cursor-pointer">
                          <TableCell>
                              <div className="flex items-center gap-3">
                                  <StatusCircle status={req.status} />
                                  <div>
                                      <div className="font-medium">{item?.itemName || 'General Reimbursement'}</div>
                                      <div className="text-xs text-muted-foreground">{user?.name} - {req.createdAt ? format(new Date(req.createdAt), 'dd/MM/yy') : 'N/A'}</div>
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
                            {selectedRequest.status === 'rejected' && reviewer && (
                                <p>Rejected by {reviewer.name} {formatDistanceToNow(new Date(selectedRequest.rejectedAt), { addSuffix: true })}</p>
                            )}
                            {selectedRequest.status === 'paid' && payer && (
                                  <p>Paid by {payer.name} {formatDistanceToNow(new Date(selectedRequest.paidAt), { addSuffix: true })}</p>
                            )}
                        </div>
                      )}

                        {procurementItem && (
                        <Card className="bg-secondary">
                          <CardHeader className="p-4">
                            <CardTitle className="text-base">Associated Procurement</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 text-sm space-y-2">
                              <p><span className="font-medium text-muted-foreground">Item:</span> {procurementItem.itemName}</p>
                              <p><span className="font-medium text-muted-foreground">Justification:</span> {procurementItem.justification}</p>
                              <p><span className="font-medium text-muted-foreground">Requested by:</span> {procurementRequester?.name || 'N/A'}</p>
                              <p><span className="font-medium text-muted-foreground">Approved by:</span> {procurementApprover?.name || 'N/A'}</p>
                          </CardContent>
                        </Card>
                      )}
                      
                      {selectedRequest.vendor && (
                          <div>
                              <h4 className="font-medium mb-1 text-sm text-muted-foreground">Vendor</h4>
                              <p className="text-sm">{selectedRequest.vendor}</p>
                          </div>
                      )}

                      <div>
                          <h4 className="font-medium mb-1 text-sm text-muted-foreground">Receipt</h4>
                          {selectedRequest.receiptUrl ? (
                          <a href={selectedRequest.receiptUrl} target="_blank" rel="noopener noreferrer">
                              <Image 
                              src={selectedRequest.receiptUrl}
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
  )
}

export default function ReimbursementsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReimbursementsPageContent />
        </Suspense>
    );
}
