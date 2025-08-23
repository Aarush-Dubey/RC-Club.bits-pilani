
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApprovalActions } from "./approval-actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

async function getApprovalData() {
    const singleItemsQuery = query(
        collection(db, "new_item_requests"),
        where("status", "==", "pending"),
        where("linkedBucketId", "==", null)
    );
    const singleItemsSnap = await getDocs(singleItemsQuery);
    const singleItems = singleItemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const closedBucketsQuery = query(
        collection(db, "procurement_buckets"),
        where("status", "==", "closed")
    );
    const closedBucketsSnap = await getDocs(closedBucketsQuery);
    const closedBuckets = closedBucketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const userIds = [
        ...new Set(singleItems.map(item => item.requestedById)),
        ...new Set(closedBuckets.map(bucket => bucket.createdBy))
    ];

    let users: any[] = [];
    if (userIds.length > 0) {
        const userChunks = [];
        for (let i = 0; i < userIds.length; i += 30) {
            userChunks.push(userIds.slice(i, i + 30));
        }

        for (const chunk of userChunks) {
             if (chunk.length > 0) {
                const usersQuery = query(collection(db, "users"), where("id", "in", chunk));
                const usersSnap = await getDocs(usersQuery);
                users.push(...usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
             }
        }
    }

    return { singleItems, closedBuckets, users };
}

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'open': return { color: 'bg-green-500', tooltip: 'Open' };
        case 'closed': return { color: 'bg-yellow-500', tooltip: 'Closed (Pending Approval)' };
        case 'ordered': return { color: 'bg-blue-500', tooltip: 'Ordered' };
        case 'received': return { color: 'bg-teal-500', tooltip: 'Received' };
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


export default function ApprovalsClient() {
    const [data, setData] = useState<{ singleItems: any[], closedBuckets: any[], users: any[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchData();
    }, []);

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
                <div className="space-y-4">
                    <Skeleton className="h-10 w-48" />
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
            </div>
        );
    }
    
    if (!data) {
        return <div>Error loading data.</div>
    }

    const { singleItems, closedBuckets, users } = data;

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
                        Review and approve new item requests and closed buckets.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="items">
                <TabsList>
                    <TabsTrigger value="items">Single Items ({singleItems.length})</TabsTrigger>
                    <TabsTrigger value="buckets">Closed Buckets ({closedBuckets.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="items" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Single Item Requests</CardTitle>
                            <CardDescription>These are standalone requests not part of a purchasing bucket.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Request</TableHead>
                                        <TableHead>Requested By</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {singleItems.length > 0 ? singleItems.map((item: any) => {
                                        const user = users.find(u => u.id === item.requestedById);
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="font-medium">{item.itemName} (x{item.quantity})</div>
                                                    <div className="text-sm text-muted-foreground">{item.justification}</div>
                                                </TableCell>
                                                <TableCell>{user?.name || 'Unknown User'}</TableCell>
                                                <TableCell>{item.createdAt ? format(item.createdAt.toDate(), "MMM d, yyyy") : 'N/A'}</TableCell>
                                                <TableCell className="text-right">
                                                    <ApprovalActions requestId={item.id} itemName={item.itemName} />
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                No pending single item requests.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="buckets" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Closed Buckets</CardTitle>
                            <CardDescription>These buckets are closed and ready to be ordered.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bucket</TableHead>
                                        <TableHead>Created By</TableHead>
                                        <TableHead>Closed On</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {closedBuckets.length > 0 ? closedBuckets.map((bucket: any) => {
                                        const creator = users.find(u => u.id === bucket.createdBy);
                                        return (
                                            <TableRow key={bucket.id}>
                                                <TableCell>
                                                    <div className="font-medium">{bucket.description}</div>
                                                    <div className="text-sm text-muted-foreground">{bucket.members.length} members</div>
                                                </TableCell>
                                                <TableCell>{creator?.name || 'Unknown'}</TableCell>
                                                <TableCell>{bucket.closedAt ? format(bucket.closedAt.toDate(), "MMM d, yyyy") : 'N/A'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/dashboard/procurement/buckets/${bucket.id}`}>
                                                        <Button variant="outline">View & Approve</Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                No buckets are waiting for approval.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
