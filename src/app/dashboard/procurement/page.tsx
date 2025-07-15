
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, ShoppingBasket, ClipboardCheck } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, type AppUser } from "@/context/auth-context";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

async function getData(currentUser: AppUser | null) {
  if (!currentUser) return { buckets: [], users: [], singleRequests: [] };

  // Fetch buckets the current user is a member of
  const bucketsQuery = query(
    collection(db, "procurement_buckets"),
    where("members", "array-contains", currentUser.uid)
  );
  const bucketsSnapshot = await getDocs(bucketsQuery);
  let buckets = bucketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Sort buckets by date manually as Firestore requires a composite index for this query
  buckets.sort((a, b) => {
    const dateA = a.createdAt?.toDate() || 0;
    const dateB = b.createdAt?.toDate() || 0;
    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;
    return 0;
  });

  const userIds = [...new Set(buckets.flatMap(b => b.members || []))];
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

  // Fetch single requests made by the current user
  const singleRequestsQuery = query(
    collection(db, "new_item_requests"),
    where("requestedById", "==", currentUser.uid),
    where("linkedBucketId", "==", null)
  );
  const singleRequestsSnapshot = await getDocs(singleRequestsQuery);
  const singleRequests = singleRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return { buckets, users, singleRequests };
}

const getBucketStatusConfig = (status: string) => {
  switch (status) {
    case 'open': return { color: 'bg-green-500', tooltip: 'Open' };
    case 'closed': return { color: 'bg-yellow-500', tooltip: 'Closed (Pending Approval)' };
    case 'ordered': return { color: 'bg-blue-500', tooltip: 'Ordered' };
    case 'received': return { color: 'bg-teal-500', tooltip: 'Received' };
    default: return { color: 'bg-gray-400', tooltip: 'Unknown' };
  }
};

const getRequestStatusConfig = (status: string) => {
  switch (status) {
    case 'pending': return { color: 'bg-yellow-500', tooltip: 'Pending' };
    case 'approved': return { color: 'bg-blue-500', tooltip: 'Approved' };
    case 'rejected': return { color: 'bg-red-500', tooltip: 'Rejected' };
    case 'ordered': return { color: 'bg-orange-500', tooltip: 'Ordered' };
    case 'received': return { color: 'bg-green-500', tooltip: 'Received' };
    default: return { color: 'bg-gray-400', tooltip: 'Unknown' };
  }
};

const StatusCircle = ({ status, type }: { status: string, type: 'bucket' | 'request' }) => {
  const config = type === 'bucket' ? getBucketStatusConfig(status) : getRequestStatusConfig(status);

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


export default function ProcurementPage() {
  const [data, setData] = useState<{ buckets: any[], users: any[], singleRequests: any[] }>({ buckets: [], users: [], singleRequests: [] });
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchedData = await getData(currentUser);
      setData(fetchedData);
    } catch (error) {
      console.error("Failed to fetch procurement data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);
  
  const canApprove = currentUser?.permissions?.canApproveNewItemRequest;

  return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">My Procurement</h2>
          <p className="text-muted-foreground">
            View and manage all procurement requests and buckets you are a part of.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canApprove && (
              <Link href="/dashboard/procurement/approvals">
                  <Button variant="outline"><ClipboardCheck className="mr-2 h-4 w-4"/>Manage Approvals</Button>
              </Link>
          )}
            <Link href="/dashboard/procurement/new">
              <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> New Request
              </Button>
          </Link>
        </div>

        {loading ? (
           <p>Loading activities...</p>
        ) : data.buckets.length === 0 && data.singleRequests.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <CardHeader>
              <ShoppingBasket className="mx-auto h-12 w-12 text-muted-foreground" />
              <CardTitle>No Procurement Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">You have not created or joined any procurement buckets.</CardDescription>
                <Link href="/dashboard/procurement/new">
                    <Button variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" /> Make a Request
                    </Button>
                </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {data.buckets.length > 0 && (
              <Card>
                <CardHeader>
                    <CardTitle>My Procurement Buckets</CardTitle>
                    <CardDescription>Buckets you created or contributed to.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {data.buckets.map((bucket) => {
                      const creator = data.users.find(u => u.id === bucket.createdBy);
                      return (
                          <Link href={`/dashboard/procurement/buckets/${bucket.id}`} key={bucket.id} className="block">
                              <Card className="h-full hover:border-primary transition-colors">
                                  <CardHeader>
                                      <div className="flex justify-between items-start">
                                          <CardTitle className="font-headline text-lg line-clamp-2">{bucket.description}</CardTitle>
                                          <StatusCircle status={bucket.status} type="bucket" />
                                      </div>
                                      <CardDescription>
                                          Started by {creator?.name} on {bucket.createdAt ? format(bucket.createdAt.toDate(), "MMM d") : 'N/A'}
                                      </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                      <div className="text-sm text-muted-foreground">
                                          {bucket.members?.length || 0} members
                                      </div>
                                  </CardContent>
                              </Card>
                          </Link>
                      );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}
            {data.singleRequests.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>My Single Item Requests</CardTitle>
                        <CardDescription>Standalone requests not part of a purchasing bucket.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Est. Cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.singleRequests.map((req: any) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium whitespace-nowrap">{req.itemName} (x{req.quantity})</TableCell>
                                            <TableCell>
                                                <StatusCircle status={req.status} type="request" />
                                            </TableCell>
                                            <TableCell className="text-right font-mono">₹{(req.estimatedCost * req.quantity).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
          </div>
        )}
      </div>
  );
}
