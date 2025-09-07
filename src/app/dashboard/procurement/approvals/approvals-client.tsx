
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/context/auth-context";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApprovalActions } from "./approval-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

async function getApprovalData() {
    // Fetch all requests, ordered by date
    const q = query(
        collection(db, "procurement_requests"),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const userIds = [...new Set(requests.flatMap(item => [item.requestedById, item.approvedById, item.rejectedById]))];
    let users = [];
    if (userIds.length > 0) {
        const usersQuery = query(collection(db, "users"), where("id", "in", userIds));
        const usersSnap = await getDocs(usersQuery);
        users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return { requests, users };
}

export default function ApprovalsClient() {
    const [data, setData] = useState<{ requests: any[], users: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchData = async () => {
        try {
            const approvalData = await getApprovalData();
            setData(approvalData);
        } catch (error) {
            console.error("Failed to fetch approval data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(user) fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-80 mt-2" />
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-32 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!data) return <div>Error loading data.</div>;

    const { requests, users } = data;
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const pastRequests = requests.filter(r => r.status !== 'pending');

    return (
        <div className="space-y-8">
             <div className="flex items-center gap-4">
                <Link href="/dashboard/procurement">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Procurement Approvals</h2>
                    <p className="text-muted-foreground">
                        Review and approve new item requests from club members.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                    <CardDescription>These items are awaiting your approval before they can be purchased.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Request</TableHead>
                                <TableHead>Requested By</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Est. Cost</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingRequests.length > 0 ? pendingRequests.map((item: any) => {
                                const requestUser = users.find(u => u.id === item.requestedById);
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.itemName}</div>
                                            <div className="text-sm text-muted-foreground">{item.justification}</div>
                                        </TableCell>
                                        <TableCell>{requestUser?.name || 'Unknown User'}</TableCell>
                                        <TableCell>{item.createdAt ? format(item.createdAt.toDate(), "MMM d, yyyy") : 'N/A'}</TableCell>
                                        <TableCell className="font-mono">₹{item.expectedCost.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <ApprovalActions requestId={item.id} itemName={item.itemName} onAction={fetchData} />
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
                                        <p className="mt-2">No pending requests.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Request History</CardTitle>
                    <CardDescription>A log of all past procurement approvals and rejections.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Request</TableHead>
                                <TableHead>Requested By</TableHead>
                                <TableHead>Reviewed By</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pastRequests.length > 0 ? pastRequests.map((item: any) => {
                                const requestUser = users.find(u => u.id === item.requestedById);
                                const reviewedByUser = users.find(u => u.id === (item.approvedById || item.rejectedById));
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.itemName}</div>
                                            <div className="text-xs text-muted-foreground">{format(item.createdAt.toDate(), "MMM d, yyyy")}</div>
                                        </TableCell>
                                        <TableCell>{requestUser?.name || 'Unknown'}</TableCell>
                                        <TableCell>{reviewedByUser?.name || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                                                {item.status}
                                            </Badge>
                                             {item.rejectionReason && (
                                                <p className="text-xs text-muted-foreground mt-1 max-w-xs">{item.rejectionReason}</p>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No past requests found.
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
