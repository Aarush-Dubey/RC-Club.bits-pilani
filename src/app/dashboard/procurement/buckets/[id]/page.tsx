
"use client";

import { useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, type AppUser } from "@/context/auth-context";
import { ArrowLeft, PlusCircle, Check, X, FileText, Loader2 } from "lucide-react";

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

async function getBucketData(bucketId: string) {
    const bucketRef = doc(db, "procurement_buckets", bucketId);
    const bucketSnap = await getDoc(bucketRef);

    if (!bucketSnap.exists()) {
        return null;
    }
    const bucket = { id: bucketSnap.id, ...bucketSnap.data() };

    const requestsQuery = query(collection(db, "new_item_requests"), where("linkedBucketId", "==", bucketId));
    const requestsSnap = await getDocs(requestsQuery);
    const requests = requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const memberIds = bucket.members || [];
    let members: AppUser[] = [];
    if (memberIds.length > 0) {
        const usersQuery = query(collection(db, "users"), where("id", "in", memberIds));
        const usersSnap = await getDocs(usersQuery);
        members = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppUser[];
    }

    return { bucket, requests, members };
}

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

export default function BucketDetailsPage({ params: { id } }: { params: { id: string } }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const bucketData = await getBucketData(id);
            if (!bucketData) {
                notFound();
            }
            setData(bucketData);
        } catch (error) {
            console.error("Failed to fetch bucket data:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not load bucket details." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleFormSubmit = () => {
        fetchData();
        setIsFormOpen(false);
    };

    const handleUpdateStatus = async (status: "open" | "closed" | "ordered" | "received") => {
        setActionLoading(true);
        try {
            await updateBucketStatus(id, status);
            toast({ title: "Bucket Updated", description: `The bucket is now ${status}.` });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: (error as Error).message });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || !data) {
        return <div className="p-8">Loading bucket details...</div>;
    }

    const { bucket, requests, members } = data;
    const isManager = currentUser?.permissions?.canApproveNewItemRequest;
    const canTakeAction = isManager && bucket.status === 'open';

    const totalEstimatedCost = requests.reduce((acc: number, req: any) => acc + (req.estimatedCost * req.quantity || 0), 0);

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
                            <Badge variant={getStatusVariant(bucket.status)}>{bucket.status}</Badge>
                        </div>
                    </div>
                    {bucket.status === 'open' && (
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Item Request
                            </Button>
                        </DialogTrigger>
                    )}
                </div>

                {isManager && bucket.status === 'open' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Manager Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-2">
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
                                        Closing this bucket will prevent any new items from being added. This is the first step before placing the order.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleUpdateStatus('closed')}>Confirm Close</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                )}

                 {isManager && bucket.status === 'closed' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Manager Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-2">
                            <Button onClick={() => handleUpdateStatus('ordered')} disabled={actionLoading}>
                                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Mark as Ordered
                            </Button>
                        </CardContent>
                    </Card>
                )}


                <Card>
                    <CardHeader>
                        <CardTitle>Requested Items</CardTitle>
                        <CardDescription>
                            Total Estimated Cost: <span className="font-bold font-mono text-foreground">₹{totalEstimatedCost.toFixed(2)}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Requested By</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Est. Cost per item</TableHead>
                                    <TableHead>Status</TableHead>
                                    {canTakeAction && <TableHead className="text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length > 0 ? requests.map((req: any) => {
                                    const user = members.find((u: any) => u.id === req.requestedById);
                                    return (
                                        <TableRow key={req.id}>
                                            <TableCell>
                                                <div className="font-medium">{req.itemName}</div>
                                                <div className="text-sm text-muted-foreground">{req.justification}</div>
                                            </TableCell>
                                            <TableCell>{user?.name || 'Unknown'}</TableCell>
                                            <TableCell>{req.quantity}</TableCell>
                                            <TableCell>₹{req.estimatedCost.toFixed(2)}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                                            {canTakeAction && (
                                                <TableCell className="text-right">
                                                    {req.status === 'pending' && (
                                                         <div className="flex gap-2 justify-end">
                                                            <Button size="icon" variant="outline" disabled><Check className="h-4 w-4"/></Button>
                                                            <Button size="icon" variant="destructive" disabled><X className="h-4 w-4"/></Button>
                                                         </div>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={canTakeAction ? 6 : 5} className="text-center h-24">
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
                    bucketId={id}
                    currentUser={currentUser}
                    setOpen={setIsFormOpen}
                    onFormSubmit={handleFormSubmit}
                />
            </DialogContent>
        </Dialog>
    );
}
