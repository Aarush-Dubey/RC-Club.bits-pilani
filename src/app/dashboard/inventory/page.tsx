

"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { PlusCircle, Check, X, Loader2, ClipboardCheck, ShoppingCart, SlidersHorizontal, History, Pencil, Box, Filter, Search } from "lucide-react"
import { format } from "date-fns"

import { useAuth, type AppUser } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { approveInventoryRequest, rejectInventoryRequest, confirmReturn, requestInventory } from "./actions"
import { updateInventoryItem, deleteInventoryItem } from "./manage-actions"
import { NewInventoryItemForm } from "./new-item-form"

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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"

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
          <div className={cn("h-3 w-3", config.color)}></div>
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
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (quantity > item.availableQuantity) {
            toast({ variant: "destructive", title: "Request Failed", description: `You can request at most ${item.availableQuantity} available items.` });
            return;
        }

        setIsLoading(true);
        try {
            await requestInventory({ itemId: item.id, quantity, userId: currentUser.uid });
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
                    value={quantity === 0 ? '' : quantity}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                            setQuantity(0);
                        } else {
                            const numValue = parseInt(value, 10);
                            setQuantity(isNaN(numValue) || numValue < 1 ? 1 : numValue);
                        }
                    }}
                    onBlur={() => {
                        if (quantity === 0) setQuantity(1);
                    }}
                    min={1}
                    max={item.availableQuantity}
                    required
                />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                         <div>
                            <div className="text-sm font-medium text-muted-foreground">Location</div>
                            <div className="text-lg font-bold">{item.location || 'N/A'}</div>
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
    
    const userIds = [
        ...new Set([
            ...inventoryRequests.map(req => req.requestedById),
            ...inventoryRequests.map(req => req.fulfilledById),
            ...inventoryRequests.map(req => req.returnedById),
            ...inventoryRequests.map(req => req.rejectedById),
            ...inventoryRequests.map(req => req.checkedOutToId),
        ].filter(Boolean))
    ];
    
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

    const projectsSnapshot = await getDocs(collection(db, "projects"));
    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));


    return { inventory, inventoryRequests, users, projects };
}

function RequestActions({ request, onActionComplete }: { request: any, onActionComplete: () => void }) {
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

    if (request.status !== 'pending') {
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

function RequestRow({ request, item, user, project, onActionComplete }: { request: any, item: any, user: any, project: any, onActionComplete: () => void }) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogTrigger asChild>
                     <div className="p-4 border-b">
                        <div className="font-medium">{item?.name} (x{request.quantity})</div>
                        <div className="text-sm text-muted-foreground">Requested by {user?.name}</div>
                    </div>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{item?.name} (x{request.quantity})</DialogTitle>
                        <DialogDescription>Requested by {user?.name} on {request.createdAt.toDate().toLocaleDateString()}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <h4 className="font-semibold">Reason</h4>
                            <p className="text-sm text-muted-foreground">{project ? `For: ${project.title}` : request.reason || 'N/A'}</p>
                        </div>
                         <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Status</h4>
                             <div className="flex items-center gap-2">
                                <StatusCircle status={request.status} />
                                <span className="font-medium capitalize">{request.status.replace(/_/g, " ")}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <RequestActions request={request} onActionComplete={() => { onActionComplete(); setIsDetailsOpen(false); }} />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <TableRow key={request.id}>
            <TableCell>
                <div className="font-medium">{item?.name} (x{request.quantity})</div>
                <div className="text-sm text-muted-foreground">
                    {project ? `For: ${project.title}` : `Reason: ${request.reason || 'N/A'}`}
                </div>
            </TableCell>
            <TableCell>{user?.name}</TableCell>
            <TableCell>{request.createdAt.toDate().toLocaleDateString()}</TableCell>
            <TableCell><StatusCircle status={request.status} /></TableCell>
            <TableCell className="text-right space-x-2">
                <RequestActions request={request} onActionComplete={onActionComplete} />
            </TableCell>
        </TableRow>
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

const editItemFormSchema = z.object({
  name: z.string().min(3, "Item name must be at least 3 characters long."),
  description: z.string().optional(),
  totalQuantity: z.coerce.number().min(0, "Quantity cannot be negative."),
  location: z.string().optional(),
});
type EditItemFormValues = z.infer<typeof editItemFormSchema>;

function EditItemForm({ item, onFormSubmit }: { item: any, onFormSubmit: () => void }) {
    const { toast } = useToast();
    const form = useForm<EditItemFormValues>({
        resolver: zodResolver(editItemFormSchema),
        defaultValues: {
            name: item.name,
            description: item.description || "",
            totalQuantity: item.totalQuantity,
            location: item.location || "",
        },
    });

    const onSubmit = async (values: EditItemFormValues) => {
        try {
            await updateInventoryItem({
                itemId: item.id,
                name: values.name,
                description: values.description || "",
                location: values.location || "",
                totalQuantity: values.totalQuantity,
                checkedOutQuantity: item.checkedOutQuantity,
            });
            toast({ title: "Item Updated", description: `${item.name} has been updated.` });
            onFormSubmit();
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: (error as Error).message });
        }
    };
    
    const handleDelete = async () => {
        form.handleSubmit(async () => {
            try {
                await deleteInventoryItem(item.id);
                toast({ title: "Item Deleted", description: `${item.name} has been removed from inventory.` });
                onFormSubmit();
            } catch (error) {
                toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message });
            }
        })();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="totalQuantity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Total Quantity</FormLabel>
                             <FormControl>
                                <Input type="number" {...field} min={item.checkedOutQuantity} />
                             </FormControl>
                             <FormMessage />
                             <p className="text-xs text-muted-foreground pt-1">
                                Cannot be less than the currently checked out quantity ({item.checkedOutQuantity}).
                            </p>
                        </FormItem>
                    )}
                />

                <DialogFooter className="flex w-full justify-between pt-4">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" type="button" disabled={form.formState.isSubmitting}>Delete Item</Button>
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
                                <AlertDialogAction onClick={handleDelete} disabled={form.formState.isSubmitting} className="bg-destructive hover:bg-destructive/90">
                                    {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Confirm Deletion
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Update Item
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}


function EditableInventoryItemRow({ item, onFormSubmit }: { item: any, onFormSubmit: () => void }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    return (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <TableRow>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.location || 'N/A'}</TableCell>
                <TableCell>{item.totalQuantity}</TableCell>
                <TableCell>{item.availableQuantity}</TableCell>
                <TableCell className="text-right">
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
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

function ActivityLogItemRow({ request, item, user, project, approver, returner }: { request: any, item: any, user: any, project: any, approver: any, returner: any }) {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <TableRow className="cursor-pointer">
                    <TableCell>
                        <div className="font-medium flex items-center gap-2">
                            <StatusCircle status={request.status} />
                            <span>{item?.name} (x{request.quantity})</span>
                        </div>
                    </TableCell>
                    <TableCell>{request.fulfilledAt ? format(request.fulfilledAt.toDate(), "PP") : 'N/A'}</TableCell>
                    <TableCell>{request.returnedAt ? format(request.returnedAt.toDate(), "PP") : 'N/A'}</TableCell>
                </TableRow>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log Details: {item?.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-1">
                        <h4 className="font-semibold">Request</h4>
                        <p className="text-sm text-muted-foreground">
                            Requested by <span className="font-medium text-foreground">{user?.name}</span> on {request.createdAt ? format(request.createdAt.toDate(), "PP") : 'N/A'}.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            For: <span className="font-medium text-foreground">{project?.title || request.reason}</span>
                        </p>
                    </div>
                     {request.fulfilledAt && (
                        <div className="space-y-1">
                            <h4 className="font-semibold">Approval</h4>
                            <p className="text-sm text-muted-foreground">
                                Approved by <span className="font-medium text-foreground">{approver?.name || "N/A"}</span> on {format(request.fulfilledAt.toDate(), "PP")}.
                            </p>
                        </div>
                    )}
                    {request.rejectedAt && (
                         <div className="space-y-1">
                            <h4 className="font-semibold text-destructive">Rejection</h4>
                            <p className="text-sm text-destructive/80">
                                Rejected by <span className="font-medium text-destructive">{approver?.name || "N/A"}</span> on {format(request.rejectedAt.toDate(), "PP")}.
                            </p>
                        </div>
                    )}
                    {request.returnedAt && (
                        <div className="space-y-1">
                            <h4 className="font-semibold text-green-600">Return</h4>
                            <p className="text-sm text-green-700">
                                Return confirmed by <span className="font-medium text-green-800">{returner?.name}</span> on {format(request.returnedAt.toDate(), "PP")}.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function AllItemsView({ data, currentUser, fetchData }: { data: any, currentUser: AppUser | null, fetchData: () => void }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Available Inventory</CardTitle>
                <CardDescription>All items available for request. Click an item to view details.</CardDescription>
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
                                    No items in inventory.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function RequestsView({ data, fetchData }: { data: any, fetchData: () => void }) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                    <CardDescription>Tap a request to view details and take action.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {data.inventoryRequests.filter((r:any) => r.status === 'pending').length > 0 ? (
                        data.inventoryRequests.filter((r:any) => r.status === 'pending').map((req: any) => {
                            const item = data.inventory.find((i: any) => i.id === req.itemId);
                            const user = data.users.find((u: any) => u.id === req.requestedById);
                            const project = data.projects.find((p: any) => p.id === req.projectId);
                            return (
                                <RequestRow key={req.id} request={req} item={item} user={user} project={project} onActionComplete={fetchData} />
                            )
                        })
                    ) : (
                        <div className="p-4 text-center text-muted-foreground">No pending requests.</div>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
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
                        <RequestRow key={req.id} request={req} item={item} user={user} project={project} onActionComplete={fetchData} />
                    )
                })}
            </TableBody>
        </Table>
    )
}

function ManageView({ data, canManageInventory, fetchData }: { data: any, canManageInventory: boolean, fetchData: () => void }) {
    const isMobile = useIsMobile();
    const [activeManageTab, setActiveManageTab] = useState("checkouts");
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<{ userId: string | null; projectId: string | null }>({ userId: null, projectId: null });
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const manageTabs = [
        { value: "checkouts", label: "Current Checkouts", icon: SlidersHorizontal },
        { value: "logs", label: "Activity Log", icon: History },
        { value: "stock", label: "Stock", icon: Box },
    ];
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Inventory</CardTitle>
                <CardDescription>View currently checked-out items and see a log of all activities.</CardDescription>
            </CardHeader>
            <CardContent>
                {isMobile ? (
                    <div className="space-y-4">
                        <Select value={activeManageTab} onValueChange={setActiveManageTab}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a view" />
                            </SelectTrigger>
                            <SelectContent>
                                {manageTabs.map(tab => (
                                    <SelectItem key={tab.value} value={tab.value}>
                                        <div className="flex items-center gap-2">
                                            <tab.icon className="h-4 w-4" />
                                            {tab.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         {activeManageTab === "checkouts" && <ManageCheckoutsView data={data} canManageInventory={canManageInventory} fetchData={fetchData} filters={filters} searchQuery={searchQuery} />}
                         {activeManageTab === "logs" && <ManageLogsView data={data} />}
                         {activeManageTab === "stock" && <ManageStockView data={data} fetchData={fetchData} />}
                    </div>
                ) : (
                    <Tabs defaultValue="checkouts">
                        <div className="flex justify-between items-center mb-4">
                            <TabsList>
                                {manageTabs.map(tab => (
                                    <TabsTrigger key={tab.value} value={tab.value}>
                                        <tab.icon className="mr-2 h-4 w-4" />
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search checkouts..."
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80" align="end">
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Filters</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Filter checked out items.
                                                </p>
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="grid grid-cols-3 items-center gap-4">
                                                    <Label htmlFor="user-filter">User</Label>
                                                    <Select value={filters.userId || ''} onValueChange={(value) => setFilters(f => ({ ...f, userId: value === 'all' ? null : value }))}>
                                                        <SelectTrigger id="user-filter" className="col-span-2 h-8">
                                                            <SelectValue placeholder="Select a user" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Users</SelectItem>
                                                            {data.users.map((user: any) => (
                                                                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                 <div className="grid grid-cols-3 items-center gap-4">
                                                    <Label htmlFor="project-filter">Project</Label>
                                                    <Select value={filters.projectId || ''} onValueChange={(value) => setFilters(f => ({ ...f, projectId: value === 'all' ? null : value }))}>
                                                        <SelectTrigger id="project-filter" className="col-span-2 h-8">
                                                            <SelectValue placeholder="Select a project" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Projects</SelectItem>
                                                             <SelectItem value="personal">Personal Use</SelectItem>
                                                            {data.projects.map((project: any) => (
                                                                <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                             <Button variant="ghost" onClick={() => setFilters({ userId: null, projectId: null })}>Clear Filters</Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <TabsContent value="checkouts" className="mt-4">
                             <ManageCheckoutsView data={data} canManageInventory={canManageInventory} fetchData={fetchData} filters={filters} searchQuery={searchQuery} />
                        </TabsContent>
                        <TabsContent value="logs" className="mt-4">
                           <ManageLogsView data={data} />
                        </TabsContent>
                        <TabsContent value="stock" className="mt-4">
                            <ManageStockView data={data} fetchData={fetchData} />
                        </TabsContent>
                    </Tabs>
                )}
            </CardContent>
        </Card>
    )
}

const ManageCheckoutsView = ({ data, canManageInventory, fetchData, filters, searchQuery }: { data: any, canManageInventory: boolean, fetchData: () => void, filters: { userId: string | null, projectId: string | null }, searchQuery: string }) => {
    
    const filteredRequests = data.inventoryRequests
        .filter((req: any) => {
            const item = data.inventory.find((i: any) => i.id === req.itemId);
            return ['fulfilled', 'pending_return'].includes(req.status) && item && !item.isPerishable;
        })
        .filter((req: any) => {
            if (!filters.userId && !filters.projectId) return true;
            
            const userMatch = !filters.userId || req.checkedOutToId === filters.userId;
            
            let projectMatch = true;
            if (filters.projectId) {
                if (filters.projectId === 'personal') {
                    projectMatch = !req.projectId;
                } else {
                    projectMatch = req.projectId === filters.projectId;
                }
            }
            
            return userMatch && projectMatch;
        })
        .filter((req: any) => {
            if (!searchQuery) return true;
            const item = data.inventory.find((i: any) => i.id === req.itemId);
            const user = data.users.find((u: any) => u.id === req.checkedOutToId);
            const project = data.projects.find((p: any) => p.id === req.projectId);
            const lowerCaseQuery = searchQuery.toLowerCase();

            return (
                item?.name.toLowerCase().includes(lowerCaseQuery) ||
                user?.name.toLowerCase().includes(lowerCaseQuery) ||
                (project?.title || 'Personal Use').toLowerCase().includes(lowerCaseQuery)
            );
        });

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Item Details</TableHead>
                    <TableHead>Checked Out To</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredRequests.map((req: any) => {
                        const item = data.inventory.find((i: any) => i.id === req.itemId);
                        const user = data.users.find((u: any) => u.id === req.checkedOutToId);
                        const project = data.projects.find((p: any) => p.id === req.projectId);
                        return (
                            <TableRow key={req.id}>
                                <TableCell>
                                    <div className="font-medium">{item?.name} (x{req.quantity})</div>
                                    {req.status === 'pending_return' && <Badge variant="outline" className="mt-1 bg-orange-100 text-orange-800 border-orange-200">Pending Return</Badge>}
                                </TableCell>
                                <TableCell>{user?.name || 'N/A'}</TableCell>
                                <TableCell>{project?.title || 'Personal Use'}</TableCell>
                                <TableCell className="text-right">
                                    <ReturnActions request={req} canConfirm={canManageInventory} onActionComplete={fetchData} />
                                </TableCell>
                            </TableRow>
                        );
                    })}
            </TableBody>
        </Table>
    );
}

const ManageLogsView = ({ data }: { data: any }) => (
     <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Checked Out</TableHead>
                <TableHead>Returned</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {data.inventoryRequests.map((req: any) => {
                const item = data.inventory.find((i: any) => i.id === req.itemId);
                const requester = data.users.find((u: any) => u.id === req.requestedById);
                const approver = data.users.find((u: any) => u.id === req.fulfilledById || u.id === req.rejectedById);
                const returner = data.users.find((u: any) => u.id === req.returnedById);
                const project = data.projects.find((p:any) => p.id === req.projectId);
                return (
                    <ActivityLogItemRow 
                        key={req.id}
                        request={req}
                        item={item}
                        user={requester}
                        project={project}
                        approver={approver}
                        returner={returner}
                    />
                );
            })}
        </TableBody>
    </Table>
);

function ManageStockView({ data, fetchData }: { data: any, fetchData: () => void }) {
    const [isNewItemFormOpen, setIsNewItemFormOpen] = useState(false);

    const handleFormSubmit = () => {
        fetchData();
        setIsNewItemFormOpen(false);
    };
    
    return (
        <Dialog open={isNewItemFormOpen} onOpenChange={setIsNewItemFormOpen}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Manage Stock</CardTitle>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Item
                        </Button>
                    </DialogTrigger>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Location</TableHead>
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
                </CardContent>
            </Card>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Inventory Item</DialogTitle>
                    <DialogDescription>
                        Add a new item to the club's inventory.
                    </DialogDescription>
                </DialogHeader>
                <NewInventoryItemForm onFormSubmit={handleFormSubmit} />
            </DialogContent>
        </Dialog>
    );
}


export default function InventoryPage() {
    const [data, setData] = useState<any>({ inventory: [], inventoryRequests: [], users: [], projects: [] });
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState("all");
    const { user: currentUser } = useAuth();
    const isMobile = useIsMobile();
    
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

    const mainViews = [
        { value: "all", label: "All Items", visible: true },
        { value: "requests", label: "Requests", visible: !!canManageInventory },
        { value: "manage", label: "Manage", visible: !!canManageInventory },
    ].filter(v => v.visible);

  return (
    <Dialog>
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                <h1 className="text-h1">Inventory</h1>
                <p className="text-base text-muted-foreground mt-2">
                    Manage equipment, track loans, and approve requests.
                </p>
                </div>
                {canManageProcurement && (
                    <Link href="/dashboard/procurement/approvals" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full">
                            <ClipboardCheck className="mr-2 h-4 w-4" /> Manage Procurement
                        </Button>
                    </Link>
                )}
            </div>

            {isMobile ? (
                <div className="space-y-4">
                    <Select value={activeView} onValueChange={setActiveView}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a view" />
                        </SelectTrigger>
                        <SelectContent>
                            {mainViews.map(view => (
                                <SelectItem key={view.value} value={view.value}>{view.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    {activeView === 'all' && <AllItemsView data={data} currentUser={currentUser} fetchData={fetchData} />}
                    {activeView === 'requests' && canManageInventory && <RequestsView data={data} fetchData={fetchData} />}
                    {activeView === 'manage' && canManageInventory && <ManageView data={data} canManageInventory={canManageInventory} fetchData={fetchData} />}

                </div>
            ) : (
                <Tabs defaultValue="all" value={activeView} onValueChange={setActiveView}>
                    <TabsList>
                        {mainViews.map(view => (
                             <TabsTrigger key={view.value} value={view.value}>{view.label}</TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value="all" className="mt-4">
                        <AllItemsView data={data} currentUser={currentUser} fetchData={fetchData} />
                    </TabsContent>
                    {canManageInventory && (
                        <>
                            <TabsContent value="requests" className="mt-4">
                                <RequestsView data={data} fetchData={fetchData} />
                            </TabsContent>
                            <TabsContent value="manage" className="mt-4">
                               <ManageView data={data} canManageInventory={canManageInventory} fetchData={fetchData} />
                            </TabsContent>
                        </>
                    )}
                </Tabs>
            )}
        </div>
    </Dialog>
  )
}
