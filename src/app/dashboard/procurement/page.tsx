
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, ShoppingBasket } from "lucide-react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, type AppUser } from "@/context/auth-context";
import { format } from "date-fns";

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
import { Badge } from "@/components/ui/badge";

async function getData(currentUser: AppUser | null) {
  if (!currentUser) return { requests: [] };

  const requestsQuery = query(
    collection(db, "procurement_requests"),
    where("requestedById", "==", currentUser.uid),
    orderBy("createdAt", "desc")
  );
  const requestsSnapshot = await getDocs(requestsQuery);
  const requests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return { requests };
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending': return { color: 'bg-yellow-500', label: 'Pending' };
    case 'approved': return { color: 'bg-blue-500', label: 'Approved' };
    case 'purchased': return { color: 'bg-indigo-500', label: 'Purchased' };
    case 'reimbursing': return { color: 'bg-purple-500', label: 'Reimbursement Submitted' };
    case 'reimbursed': return { color: 'bg-green-500', label: 'Reimbursed' };
    case 'rejected': return { color: 'bg-red-500', label: 'Rejected' };
    default: return { color: 'bg-gray-400', label: 'Unknown' };
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = getStatusConfig(status);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
            <Badge className={cn("capitalize", config.color)}>{status.replace(/_/g, ' ')}</Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function ProcurementPage() {
  const [data, setData] = useState<{ requests: any[] }>({ requests: [] });
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
          <h2 className="text-3xl font-bold tracking-tight font-headline">My Procurement Requests</h2>
          <p className="text-muted-foreground">
            Track all your new item procurement requests from approval to reimbursement.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Link href="/dashboard/procurement/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> New Request
              </Button>
            </Link>
            {canApprove && (
              <Link href="/dashboard/procurement/approvals">
                  <Button variant="outline">Manage Approvals</Button>
              </Link>
            )}
        </div>

        {loading ? (
           <p>Loading your requests...</p>
        ) : data.requests.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <CardHeader>
              <ShoppingBasket className="mx-auto h-12 w-12 text-muted-foreground" />
              <CardTitle>No Requests Yet</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">You haven't made any procurement requests.</CardDescription>
                <Link href="/dashboard/procurement/new">
                    <Button variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" /> Make a Request
                    </Button>
                </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
                <CardTitle>My Request History</CardTitle>
                <CardDescription>A log of all your procurement requests.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Est. Cost</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.requests.map((req: any) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium whitespace-nowrap">{req.itemName}</TableCell>
                                    <TableCell>{req.createdAt ? format(req.createdAt.toDate(), "MMM d, yyyy") : 'N/A'}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={req.status} />
                                    </TableCell>
                                    <TableCell className="text-right font-mono">₹{req.expectedCost.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
          </Card>
        )}
      </div>
  );
}
