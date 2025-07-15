
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { format } from "date-fns";
import { ArrowLeft, Box, ShoppingBasket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

async function getMyRequestsData(userId: string) {
    const bucketsQuery = query(collection(db, "procurement_buckets"), where("createdBy", "==", userId), orderBy("createdAt", "desc"));
    const bucketsSnap = await getDocs(bucketsQuery);
    const buckets = bucketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const singleItemsQuery = query(
        collection(db, "new_item_requests"),
        where("requestedById", "==", userId),
        where("linkedBucketId", "==", null),
        orderBy("createdAt", "desc")
    );
    const singleItemsSnap = await getDocs(singleItemsQuery);
    const singleItems = singleItemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return { buckets, singleItems };
}

const getBucketStatusVariant = (status: string) => {
  switch (status) {
    case 'open': return 'default';
    case 'closed': return 'secondary';
    case 'ordered': return 'outline';
    case 'received': return 'destructive';
    default: return 'outline';
  }
};

const getItemStatusVariant = (status: string) => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
};

export default function MyProcurementRequestsPage() {
    const { user: currentUser, loading: authLoading } = useAuth();
    const [data, setData] = useState<{ buckets: any[], singleItems: any[] }>({ buckets: [], singleItems: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser) {
                setLoading(true);
                try {
                    const fetchedData = await getMyRequestsData(currentUser.uid);
                    setData(fetchedData);
                } catch (error) {
                    console.error("Failed to fetch data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        if (!authLoading) {
            fetchData();
        }
    }, [currentUser, authLoading]);

    if (loading || authLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-10 w-1/4" />
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                    <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                </Card>
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                    <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/procurement">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">My Procurement Requests</h2>
                    <p className="text-muted-foreground">
                        Track the status of your created buckets and single item requests.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>My Buckets</CardTitle>
                    <CardDescription>All purchasing buckets you have created.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bucket</TableHead>
                                <TableHead>Date Created</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.buckets.length > 0 ? data.buckets.map((bucket: any) => (
                                <TableRow key={bucket.id}>
                                    <TableCell>
                                        <div className="font-medium">{bucket.description}</div>
                                        <div className="text-sm text-muted-foreground">{bucket.members.length} members</div>
                                    </TableCell>
                                    <TableCell>{bucket.createdAt ? format((bucket.createdAt as Timestamp).toDate(), "MMM d, yyyy") : 'N/A'}</TableCell>
                                    <TableCell><Badge variant={getBucketStatusVariant(bucket.status) as any}>{bucket.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/procurement/buckets/${bucket.id}`}>
                                            <Button variant="outline">View Bucket</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <ShoppingBasket className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                        You have not created any procurement buckets.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>My Single Requests</CardTitle>
                    <CardDescription>All standalone item requests you have submitted.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Request</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.singleItems.length > 0 ? data.singleItems.map((item: any) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="font-medium">{item.itemName} (x{item.quantity})</div>
                                        <div className="text-sm text-muted-foreground">{item.justification}</div>
                                    </TableCell>
                                    <TableCell>{item.createdAt ? format((item.createdAt as Timestamp).toDate(), "MMM d, yyyy") : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={getItemStatusVariant(item.status) as any}>{item.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        <Box className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                        You have not made any single item requests.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
