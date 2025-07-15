
"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { PlusCircle, Check, X, Loader2 } from "lucide-react"

import { useAuth, type AppUser } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { approveInventoryRequest, rejectInventoryRequest } from "./actions"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Available': return 'default'
        case 'On Loan': return 'secondary'
        case 'Overdue': return 'destructive'
        case 'pending': return 'secondary'
        case 'fulfilled': return 'default'
        case 'rejected': return 'destructive'
        default: return 'outline'
    }
}

async function getData() {
    const inventorySnapshot = await getDocs(collection(db, "inventory_items"));
    const inventory = inventorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const requestsQuery = query(collection(db, "inventory_requests"), orderBy("createdAt", "desc"));
    const inventoryRequestsSnapshot = await getDocs(requestsQuery);
    const inventoryRequests = inventoryRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const projectsSnapshot = await getDocs(collection(db, "projects"));
    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));


    return { inventory, inventoryRequests, users, projects };
}

function RequestActions({ request, canApprove }: { request: any, canApprove: boolean }) {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState<"approve" | "reject" | null>(null);

    const handleAction = async (action: () => Promise<void>, type: 'approve' | 'reject') => {
        if (!currentUser) return;
        setIsLoading(type);
        try {
            await action();
            toast({
                title: `Request ${type === 'approve' ? 'Approved' : 'Rejected'}`,
                description: "The inventory status has been updated.",
            });
        } catch (error) {
            toast({ variant: "destructive", title: "Action Failed", description: (error as Error).message });
        } finally {
            setIsLoading(null);
        }
    };

    const onApprove = () => handleAction(() => approveInventoryRequest(request.id, currentUser!.uid), 'approve');
    const onReject = () => handleAction(() => rejectInventoryRequest(request.id, currentUser!.uid), 'reject');

    if (!canApprove || request.status !== 'pending') {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={onApprove} disabled={!!isLoading}>
                {isLoading === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="destructive" onClick={onReject} disabled={!!isLoading}>
                {isLoading === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </Button>
        </div>
    );
}


export default function InventoryPage() {
    const [data, setData] = useState<any>({ inventory: [], inventoryRequests: [], users: [], projects: [] });
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();
    
    const fetchData = async () => {
        setLoading(true);
        const fetchedData = await getData();
        setData(fetchedData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const canApprove = currentUser?.permissions?.canApproveInventory;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Inventory</h2>
          <p className="text-muted-foreground">
            Manage equipment, track loans, and approve requests.
          </p>
        </div>
        <Button disabled>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Checked Out</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.inventory.map((item: any) => {
                    return (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.totalQuantity}</TableCell>
                            <TableCell>{item.availableQuantity}</TableCell>
                            <TableCell>{item.checkedOutQuantity}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" disabled>Request</Button>
                            </TableCell>
                        </TableRow>
                    )
                    })}
                </TableBody>
            </Table>
        </TabsContent>
        <TabsContent value="requests" className="mt-6">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Request Details</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                {canApprove && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.inventoryRequests.map((req: any) => {
                    const item = data.inventory.find((i: any) => i.id === req.itemId);
                    const user = data.users.find((u: any) => u.id === req.requestedById);
                    const project = data.projects.find((p: any) => p.id === req.projectId);
                    return (
                        <TableRow key={req.id}>
                            <TableCell>
                                <div className="font-medium">{item?.name} (x{req.quantity})</div>
                                <div className="text-sm text-muted-foreground">For: {project?.title || 'N/A'}</div>
                            </TableCell>
                            <TableCell>{user?.name}</TableCell>
                            <TableCell>{req.createdAt.toDate().toLocaleDateString()}</TableCell>
                            <TableCell><Badge variant={getStatusVariant(req.status) as any}>{req.status}</Badge></TableCell>
                            {canApprove && (
                                <TableCell className="text-right space-x-2">
                                    <RequestActions request={req} canApprove={!!canApprove} />
                                </TableCell>
                            )}
                        </TableRow>
                    )
                })}
            </TableBody>
            </Table>
        </TabsContent>
      </Tabs>
    </div>
  )
}
