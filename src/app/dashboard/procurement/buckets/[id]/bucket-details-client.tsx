
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
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

export default function BucketDetailsClient({ initialData, bucketId }: { initialData: any, bucketId: string }) {
    const [data, setData] = useState<any>(initialData);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleFormSubmit = () => {
        router.refresh();
        setIsFormOpen(false);
    };

    const handleUpdateStatus = async (status: "open" | "closed" | "ordered" | "received") => {
        setActionLoading(true);
        try {
            await updateBucketStatus(bucketId, status);
            toast({ title: "Bucket Updated", description: `The bucket is now ${status}.` });
            router.refresh(); // This will re-run the server component's fetch and pass new initialData
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: (error as Error).message });
        } finally {
            setActionLoading(false);
        }
    };

    if (authLoading || !data) {
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
    const canTakeAction = isManager && bucket.status === 'open';
    const creator = members.find((m: any) => m.id === bucket.createdBy);

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

                <Card>
                    <CardHeader>
                        <CardTitle>Dev Tool</CardTitle>
                        <CardDescription>Use this to check current user permissions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Current User Role: <span className="font-mono">{currentUser?.role || 'Not defined'}</span></p>
                        <p>Can Approve New Item?: <span className="font-mono">{isManager ? 'true' : 'false'}</span></p>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded-md font-mono overflow-auto">
                            {JSON.stringify(currentUser?.permissions, null, 2)}
                        </pre>
                    </CardContent>
                </Card>

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
                                    <TableHead>Est. cost / piece</TableHead>
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
                    bucketId={bucketId}
                    currentUser={currentUser}
                    setOpen={setIsFormOpen}
                    onFormSubmit={handleFormSubmit}
                />
            </DialogContent>
        </Dialog>
    );
}
