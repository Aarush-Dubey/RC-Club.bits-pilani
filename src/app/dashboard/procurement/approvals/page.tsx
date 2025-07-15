
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Inbox } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApprovalActions } from "./approval-actions"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

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
        const usersQuery = query(collection(db, "users"), where("id", "in", userIds.slice(0, 30)));
        const usersSnap = await getDocs(usersQuery);
        users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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


export default async function ProcurementApprovalsPage() {
    // In a real app, you'd protect this route
    const { singleItems, closedBuckets, users } = await getApprovalData();

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
