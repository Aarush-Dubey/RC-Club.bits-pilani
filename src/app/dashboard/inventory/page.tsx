
"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { PlusCircle, Check, X, Loader2, ClipboardCheck, ShoppingCart, Sparkles, SlidersHorizontal, History, Pencil, Box } from "lucide-react"
import { format } from "date-fns"

import { useAuth, type AppUser } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { approveInventoryRequest, rejectInventoryRequest, confirmReturn, requestInventory } from "./actions"
import { updateItemQuantity, deleteInventoryItem } from "./manage-actions"

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
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { enhanceJustification } from "@/ai/flows/enhance-justification"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'pending': return { color: 'bg-yellow-500', tooltip: 'Pending' }
        case 'fulfilled': return { color: 'bg-blue-500', tooltip: 'In Possession' }
        case 'rejected': return { color: 'bg-red-500', tooltip: 'Rejected' }
        case 'pending_return': return { color: 'bg-orange-500', tooltip: 'Pending Return' }
        case 'returned': return { color: 'bg-green-500', tooltip: 'Returned' }
        default: return { color: 'bg-gray-400', tooltip: 'Unknown' }
    }
}

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

function RequestItemForm({ item, currentUser, setOpen, onFormSubmit }: { item: any, currentUser: AppUser | null, setOpen: (open: boolean) => void, onFormSubmit: () => void }) {
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const { toast } = useToast();

    const handleEnhanceReason = async () => {
        if (!reason) {
          toast({ variant: "destructive", title: "Cannot Enhance", description: "Please provide a basic reason first." });
          return;
        }
        setIsEnhancing(true);
        try {
          const result = await enhanceJustification({ itemName: item.name, justification: reason });
          setReason(result.enhancedJustification);
          toast({ title: "Reason Enhanced", description: "The justification has been updated with AI." });
        } catch (error) {
          console.error("Error enhancing reason:", error);
          toast({ variant: "destructive", title: "Enhancement Failed", description: "Could not enhance the reason." });
        } finally {
          setIsEnhancing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (quantity > item.availableQuantity) {
            toast({ variant: "destructive", title: "Request Failed", description: `You can request at most ${item.availableQuantity} available items.` });
            return;
        }

        setIsLoading(true);
        try {
            await requestInventory({ itemId: item.id, quantity, userId: currentUser.uid, reason });
            toast({ title: "Request Submitted", description: `Your request for ${item.name} has been submitted for approval.` });
            onFormSubmit();
            setOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Request Failed", description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                         if (e.target.value === '') {
                            setQuantity(1);
                        } else {
                            setQuantity(isNaN(value) || value < 1 ? 1 : value);
                        }
                    }}
                    min={1}
                    max={item.availableQuantity}
                    required
                />
            </div>
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="reason">Reason for Request</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={handleEnhanceReason} disabled={isEnhancing || isLoading}>
                        {isEnhancing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Enhance
                    </Button>
                </div>
                <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. For personal practice, replacement part for a non-project device, etc."
                    required
                />
            </div>
            <Button type="submit" disabled={isLoading || isEnhancing} className="w-full">
                {(isLoading || isEnhancing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
            </Button>
        </form>
    )
}

function InventoryItemRow({ item, currentUser, onFormSubmit }: { item: any, currentUser: AppUser | null, onFormSubmit: () => void }) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
    
    return (
        <>
            <TableRow className="cursor-pointer" onClick={() => setIsDetailsOpen(true)}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right">{item.availableQuantity}</TableCell>
            </TableRow>
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{item.name}</DialogTitle>
                            <DialogDescription>
                            {item.description || "No description available for this item."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Total Stock</div>
                            <div className="text-lg font-bold">{item.totalQuantity}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Available</div>
                            <div className="text-lg font-bold">{item.availableQuantity}</div>
                        </div>
                    </div>
                    <Button disabled={item.availableQuantity === 0} onClick={() => { setIsDetailsOpen(false); setIsRequestFormOpen(true); }}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Request Item
                    </Button>
                </DialogContent>
            </Dialog>
            <Dialog open={isRequestFormOpen} onOpenChange={setIsRequestFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request: {item.name}</DialogTitle>
                    </DialogHeader>
                    <RequestItemForm item={item} currentUser={currentUser} setOpen={setIsRequestFormOpen} onFormSubmit={onFormSubmit} />
                </DialogContent>
            </Dialog>
        </>
    );
}

async function getData() {
    const inventorySnapshot = await getDocs(query(collection(db, "inventory_items"), orderBy("name")));
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

function RequestActions({ request, canApprove, onActionComplete }: { request: any, canApprove: boolean, onActionComplete: () => void }) {
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
            onActionComplete();
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

function ReturnActions({ request, canConfirm, onActionComplete }: { request: any, canConfirm: boolean, onActionComplete: () => void }) {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleConfirmReturn = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            await confirmReturn(request.id, currentUser.uid);
            toast({
                title: `Return Confirmed`,
                description: "The inventory has been updated.",
            });
            onActionComplete();
        } catch (error) {
            toast({ variant: "destructive", title: "Action Failed", description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!canConfirm || request.status !== 'pending_return') {
        return null;
    }

    return (
        <Button size="sm" onClick={handleConfirmReturn} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
            Confirm Return
        </Button>
    );
}

function EditItemForm({ item, onFormSubmit }: { item: any, onFormSubmit: () => void }) {
    const [totalQuantity, setTotalQuantity] = useState(item.totalQuantity);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            await updateItemQuantity({
                itemId: item.id,
                newTotalQuantity: totalQuantity,
                oldTotalQuantity: item.totalQuantity,
                checkedOutQuantity: item.checkedOutQuantity
            });
            toast({ title: "Item Updated", description: `${item.name} quantity has been updated.` });
            onFormSubmit();
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            await deleteInventoryItem(item.id);
            toast({ title: "Item Deleted", description: `${item.name} has been removed from inventory.` });
            onFormSubmit();
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="total-quantity">Total Quantity</Label>
                <Input
                    id="total-quantity"
                    type="number"
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(parseInt(e.target.value, 10))}
                    min={item.checkedOutQuantity}
                />
                <p className="text-xs text-muted-foreground">
                    Cannot be less than the currently checked out quantity ({item.checkedOutQuantity}).
                </p>
            </div>
            <div className="flex justify-between">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isLoading}>Delete Item</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the item from inventory.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Confirm Deletion
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button onClick={handleUpdate} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update Quantity
                </Button>
            </div>
        </div>
    );
}


function EditableInventoryItemRow({ item, onFormSubmit }: { item: any, onFormSubmit: () => void }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    return (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <TableRow>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.totalQuantity}</TableCell>
                <TableCell>{item.availableQuantity}</TableCell>
                <TableCell className="text-right">
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    </DialogTrigger>
                </TableCell>
            </TableRow>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit: {item.name}</DialogTitle>
                </DialogHeader>
                <EditItemForm item={item} onFormSubmit={() => { onFormSubmit(); setIsEditOpen(false); }} />
            </DialogContent>
        </Dialog>
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

    const canManageInventory = currentUser?.permissions?.canApproveInventory;
    const canManageProcurement = currentUser?.permissions?.canApproveNewItemRequest;

  return (
    <Dialog>
        <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Inventory</h2>
            <p className="text-muted-foreground">
                Manage equipment, track loans, and approve requests.
            </p>
            </div>
            <div className="flex items-center gap-2">
                {canManageProcurement && (
                    <Link href="/dashboard/procurement/approvals">
                        <Button variant="outline">
                            <ClipboardCheck className="mr-2 h-4 w-4" /> Manage Procurement
                        </Button>
                    </Link>
                )}
            </div>
        </div>

        <Tabs defaultValue="all">
            <TabsList>
                <TabsTrigger value="all">All Items</TabsTrigger>
                {canManageInventory && (
                    <>
                        <TabsTrigger value="requests">Requests</TabsTrigger>
                        <TabsTrigger value="manage">Manage</TabsTrigger>
                    </>
                )}
            </TabsList>
            <TabsContent value="all" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Available Inventory</CardTitle>
                        <CardDescription>Click on an item to view details and request it.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Available</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.inventory.length > 0 ? data.inventory.map((item: any) => (
                                    <InventoryItemRow key={item.id} item={item} currentUser={currentUser} onFormSubmit={fetchData} />
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">
                                            No inventory items found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            {canManageInventory && (
                <>
                    <TabsContent value="requests" className="mt-6">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Request Details</TableHead>
                            <TableHead>Requested By</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.inventoryRequests.filter((r:any) => ['pending', 'fulfilled', 'rejected'].includes(r.status)).map((req: any) => {
                                const item = data.inventory.find((i: any) => i.id === req.itemId);
                                const user = data.users.find((u: any) => u.id === req.requestedById);
                                const project = data.projects.find((p: any) => p.id === req.projectId);
                                return (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="font-medium">{item?.name} (x{req.quantity})</div>
                                            <div className="text-sm text-muted-foreground">
                                                {project ? `For: ${project.title}` : `Reason: ${req.reason || 'N/A'}`}
                                            </div>
                                        </TableCell>
                                        <TableCell>{user?.name}</TableCell>
                                        <TableCell>{req.createdAt.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell><StatusCircle status={req.status} /></TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <RequestActions request={req} canApprove={!!canManageInventory} onActionComplete={fetchData} />
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                        </Table>
                    </TabsContent>
                    <TabsContent value="manage" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Manage Inventory</CardTitle>
                                <CardDescription>View currently checked-out items and see a log of all activities.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="checkouts">
                                    <TabsList>
                                        <TabsTrigger value="checkouts"><SlidersHorizontal className="mr-2 h-4 w-4" />Current Checkouts</TabsTrigger>
                                        <TabsTrigger value="logs"><History className="mr-2 h-4 w-4" />Activity Log</TabsTrigger>
                                        <TabsTrigger value="stock"><Box className="mr-2 h-4 w-4" />All Items</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="checkouts" className="mt-4">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Item Details</TableHead>
                                                    <TableHead>Checked Out To</TableHead>
                                                    <TableHead>Project</TableHead>
                                                    <TableHead className="text-right">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.inventoryRequests
                                                    .filter((req: any) => {
                                                        const item = data.inventory.find((i: any) => i.id === req.itemId);
                                                        // Only include items that are checked out and NOT perishable
                                                        return ['fulfilled', 'pending_return'].includes(req.status) && item && !item.isPerishable;
                                                    })
                                                    .map((req: any) => {
                                                        const item = data.inventory.find((i: any) => i.id === req.itemId);
                                                        const user = data.users.find((u: any) => u.id === req.checkedOutToId);
                                                        const project = data.projects.find((p: any) => p.id === req.projectId);
                                                        return (
                                                            <TableRow key={req.id}>
                                                                <TableCell>
                                                                    <div className="font-medium">{item?.name} (x{req.quantity})</div>
                                                                    <Badge variant={item?.isPerishable ? "destructive" : "secondary"}>{item?.isPerishable ? 'Perishable' : 'Non-Perishable'}</Badge>
                                                                </TableCell>
                                                                <TableCell>{user?.name || 'N/A'}</TableCell>
                                                                <TableCell>{project?.title || 'Personal Use'}</TableCell>
                                                                <TableCell className="text-right">
                                                                     <div className="flex justify-end">
                                                                        <ReturnActions request={req} canConfirm={!!canManageInventory} onActionComplete={fetchData} />
                                                                     </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                            </TableBody>
                                        </Table>
                                    </TabsContent>
                                    <TabsContent value="logs" className="mt-4">
                                         <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Request</TableHead>
                                                    <TableHead>Details</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.inventoryRequests.map((req: any) => {
                                                    const item = data.inventory.find((i: any) => i.id === req.itemId);
                                                    const requester = data.users.find((u: any) => u.id === req.requestedById);
                                                    const approver = data.users.find((u: any) => u.id === req.fulfilledById);
                                                    const returner = data.users.find((u: any) => u.id === req.returnedById);
                                                    return (
                                                        <TableRow key={req.id}>
                                                            <TableCell>
                                                                <div className="font-medium flex items-center gap-2">
                                                                    <StatusCircle status={req.status} />
                                                                    <span>{item?.name} (x{req.quantity})</span>
                                                                </div>
                                                                <div className="text-sm text-muted-foreground mt-1">
                                                                    Requested by {requester?.name} on {req.createdAt ? format(req.createdAt.toDate(), "PP") : 'N/A'}
                                                                </div>
                                                                 <div className="text-sm text-muted-foreground mt-1">
                                                                    For: {data.projects.find((p:any) => p.id === req.projectId)?.title || req.reason}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {req.fulfilledAt && (
                                                                    <p className="text-sm">
                                                                        <span className="font-medium">Fulfilled</span> by {approver?.name} on {format(req.fulfilledAt.toDate(), "PP")}
                                                                    </p>
                                                                )}
                                                                {req.rejectedAt && (
                                                                     <p className="text-sm text-destructive">
                                                                        <span className="font-medium">Rejected</span> on {format(req.rejectedAt.toDate(), "PP")}
                                                                    </p>
                                                                )}
                                                                 {req.returnedAt && (
                                                                    <p className="text-sm text-green-600">
                                                                        <span className="font-medium">Returned</span> and confirmed by {returner?.name} on {format(req.returnedAt.toDate(), "PP")}
                                                                    </p>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TabsContent>
                                    <TabsContent value="stock" className="mt-4">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Item</TableHead>
                                                    <TableHead>Total</TableHead>
                                                    <TableHead>Available</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.inventory.map((item: any) => (
                                                    <EditableInventoryItemRow
                                                        key={item.id}
                                                        item={item}
                                                        onFormSubmit={fetchData}
                                                    />
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </>
            )}
        </Tabs>
        </div>
    </Dialog>
  )
}
