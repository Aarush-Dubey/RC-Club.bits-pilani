
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, collection, getDocs, query, where, Timestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, type AppUser } from "@/context/auth-context";
import { ArrowLeft, PlusCircle, Check, X, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NewItemRequestForm } from "../../new-item-request-form";
import { useToast } from "@/hooks/use-toast";
import { updateBucketStatus } from "../../actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { BucketItemActions } from "./bucket-item-actions";


const getStatusVariant = (status: string) => {
  switch (status) {
    case 'open': return 'default';
    case 'pending': return 'secondary';
    case 'approved': return 'default';
    case 'closed': return 'secondary';
    case 'ordered': return 'outline';
    case 'received': return 'destructive'; // Reuse for now
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
};

// Helper to convert Firestore Timestamps to strings for client-side state
const serializeFirestoreTimestamps = (data: any): any => {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(serializeFirestoreTimestamps);
    }
    if (typeof data === 'object' && data !== null) {
        if (data instanceof Timestamp) {
            return data.toDate().toISOString();
        }
        const newObj: { [key: string]: any } = {};
        for (const key in data) {
            newObj[key] = serializeFirestoreTimestamps(data[key]);
        }
        return newObj;
    }
    return data;
};

export default function BucketDetailsClient({ initialData, bucketId }: { initialData: any, bucketId: string }) {
    const [data, setData] = useState<any>(initialData);
    const [loading, setLoading] = useState(!initialData);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!bucketId) return;

        setLoading(true);

        const bucketRef = doc(db, "procurement_buckets", bucketId);
        
        const unsubscribeBucket = onSnapshot(bucketRef, async (bucketSnap) => {
            if (!bucketSnap.exists()) {
                setData(null);
                setLoading(false);
                return;
            }

            const bucketData = bucketSnap.data();
            const memberIds = Array.isArray(bucketData.members) && bucketData.members.length > 0 ? bucketData.members : [];
            
            let members: AppUser[] = [];
            if (memberIds.length > 0) {
                const usersQuery = query(collection(db, "users"), where("id", "in", memberIds));
                const usersSnap = await getDocs(usersQuery);
                members = usersSnap.docs.map(doc => serializeFirestoreTimestamps({ id: doc.id, ...doc.data() })) as AppUser[];
            }

            // Also listen to requests
            const requestsQuery = query(collection(db, "new_item_requests"), where("linkedBucketId", "==", bucketId));
            const unsubscribeRequests = onSnapshot(requestsQuery, (requestsSnap) => {
                const requests = requestsSnap.docs.map(doc => serializeFirestoreTimestamps({ id: doc.id, ...doc.data() }));

                setData({
                    bucket: serializeFirestoreTimestamps({ id: bucketSnap.id, ...bucketData }),
                    members,
                    requests,
                });
                setLoading(false);
            });
            
            // Return a function to cleanup both listeners
            return () => {
                unsubscribeRequests();
            };
        });

        // Cleanup subscription on unmount
        return () => {
            unsubscribeBucket();
        };
    }, [bucketId]);


    const handleFormSubmit = () => {
        setIsFormOpen(false);
    };

    const handleUpdateStatus = async (status: "open" | "closed" | "ordered" | "received") => {
        setActionLoading(true);
        try {
            await updateBucketStatus(bucketId, status);
            toast({ title: "Bucket Updated", description: `The bucket is now ${status}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: (error as Error).message });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || authLoading || !data || !data.bucket) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-2/3" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-48 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    const { bucket, requests, members } = data;
    const isManager = currentUser?.permissions?.canApproveNewItemRequest;
    const isCreator = currentUser?.uid === bucket.createdBy;
    
    const creator = members.find((m: any) => m.id === bucket.createdBy);
    const totalEstimatedCost = requests.reduce((acc: number, req: any) => acc + (req.estimatedCost * req.quantity || 0), 0);
    const totalApprovedCost = requests
        .filter((req: any) => req.status === 'approved')
        .reduce((acc: number, req: any) => acc + (req.estimatedCost * req.quantity || 0), 0);

    return (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <div className="space-y-8">
                <div className="flex items-start justify-between">
                    <div>
                        <Link href="/dashboard/procurement" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
                           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Buckets
                        </Link>
                        <div className="flex items-center gap-4">
                            <h2 className="text-3xl font-bold tracking-tight font-headline">{bucket.description}</h2>
                            <Badge variant={getStatusVariant(bucket.status) as any}>{bucket.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Started by {creator?.name} on {bucket.createdAt ? format(new Date(bucket.createdAt), "MMM d, yyyy") : 'N/A'}
                        </p>
                    </div>
                    {bucket.status === 'open' && (
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Item Request
                            </Button>
                        </DialogTrigger>
                    )}
                </div>

                {isCreator && ['open', 'closed', 'ordered'].includes(bucket.status) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Creator Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-2">
                             {bucket.status === 'open' && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" disabled={actionLoading}>
                                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Close Bucket
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Closing this bucket will prevent any new items from being added. This will submit the bucket for approval before ordering.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleUpdateStatus('closed')}>Confirm Close</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                             )}
                              {bucket.status === 'closed' && (
                                <Button onClick={() => handleUpdateStatus('ordered')} disabled={actionLoading}>
                                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Mark as Ordered
                                </Button>
                            )}
                            {bucket.status === 'ordered' && (
                                <Button onClick={() => handleUpdateStatus('received')} disabled={actionLoading}>
                                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Mark as Received
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                 {isManager && ['closed', 'ordered', 'received'].includes(bucket.status) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Manager Summary</CardTitle>
                            <CardDescription>
                                Total cost for approved items: <span className="font-bold font-mono text-foreground">₹{totalApprovedCost.toFixed(2)}</span>
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}


                <Card>
                    <CardHeader>
                        <CardTitle>Requested Items</CardTitle>
                        <CardDescription>
                            Total Estimated Cost (All Items): <span className="font-bold font-mono text-foreground">₹{totalEstimatedCost.toFixed(2)}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Requested By</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Est. Cost</TableHead>
                                    <TableHead>Status</TableHead>
                                    {isManager && bucket.status === 'closed' && <TableHead className="text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests && requests.length > 0 ? requests.map((req: any) => {
                                    const user = members.find((u: any) => u.id === req.requestedById);
                                    return (
                                        <TableRow key={req.id}>
                                            <TableCell>
                                                <div className="font-medium">{req.itemName}</div>
                                                <div className="text-sm text-muted-foreground">{req.justification}</div>
                                                {req.rejectionReason && (
                                                    <div className="text-xs text-destructive mt-1">Reason: {req.rejectionReason}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>{user?.name || 'Unknown'}</TableCell>
                                            <TableCell>{req.quantity}</TableCell>
                                            <TableCell>₹{(req.estimatedCost * req.quantity).toFixed(2)}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(req.status) as any}>{req.status}</Badge></TableCell>
                                            {isManager && bucket.status === 'closed' && (
                                                <TableCell className="text-right">
                                                   {req.status === 'pending' ? <BucketItemActions requestId={req.id} itemName={req.itemName} /> : '-'}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={isManager && bucket.status === 'closed' ? 6 : 5} className="text-center h-24">
                                            No items have been requested in this bucket yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
             <DialogContent>
                <DialogHeader>
                <DialogTitle>Add Item to Bucket</DialogTitle>
                <DialogDescription>Fill out the details for the item you want to request.</DialogDescription>
                </DialogHeader>
                <NewItemRequestForm
                    bucketId={bucketId}
                    currentUser={currentUser}
                    setOpen={setIsFormOpen}
                    onFormSubmit={handleFormSubmit}
                />
            </DialogContent>
        </Dialog>
    );
}
