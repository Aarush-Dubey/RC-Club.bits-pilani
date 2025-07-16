
"use client"

import React, { useState, useEffect } from 'react';
import Image from "next/image"
import { collection, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addLogbookEntry, deleteLogbookEntry, updateLogbookEntry } from './actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface LogbookEntry {
    id: string;
    date: string;
    description: string;
    debit?: number;
    credit?: number;
    balance: number;
    reimbursementId?: string;
    assetGroup: string;
    account: string;
}

const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '';
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

async function getRelatedFinanceData() {
    const reimbursementsSnap = await getDocs(collection(db, "reimbursements"));
    const reimbursements = reimbursementsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const usersSnap = await getDocs(collection(db, "users"));
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const newItemsSnap = await getDocs(collection(db, "new_item_requests"));
    const newItems = newItemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { reimbursements, users, newItems };
}

const logFormSchema = z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format." }),
    description: z.string().min(3, "Description is required."),
    assetGroup: z.string().min(3, "Asset group is required."),
    account: z.string().min(3, "Account is required."),
    debit: z.coerce.number().optional(),
    credit: z.coerce.number().optional(),
}).refine(data => data.debit || data.credit, {
    message: "Either debit or credit must have a value.",
    path: ["debit"],
});
type LogFormValues = z.infer<typeof logFormSchema>;

const LogEditorForm = ({
    log,
    onSuccess,
    onCancel
}: {
    log?: LogbookEntry | null,
    onSuccess: () => void,
    onCancel: () => void
}) => {
    const { toast } = useToast();
    const form = useForm<LogFormValues>({
        resolver: zodResolver(logFormSchema),
        defaultValues: log ? {
            ...log,
            date: log.date,
        } : {
            date: format(new Date(), 'yyyy-MM-dd'),
            description: "",
            assetGroup: "",
            account: "",
            debit: 0,
            credit: 0
        }
    });

    const onSubmit: SubmitHandler<LogFormValues> = async (values) => {
        try {
            if (log) {
                await updateLogbookEntry(log.id, values);
                toast({ title: "Success", description: "Log entry updated." });
            } else {
                await addLogbookEntry(values);
                toast({ title: "Success", description: "New log entry added." });
            }
            onSuccess();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: (error as Error).message });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="assetGroup" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Asset Group</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="account" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Account</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="debit" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Debit</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="credit" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Credit</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 <DialogFooter className="pt-4 border-t gap-2 sm:justify-between">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                     <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {log ? 'Update Entry' : 'Add Entry'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    )
}

const LogbookEditor = ({ logs, onUpdate, closeDialog }: { logs: LogbookEntry[], onUpdate: () => void, closeDialog: () => void }) => {
    const [selectedLog, setSelectedLog] = useState<LogbookEntry | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const { toast } = useToast();
    
    const handleDelete = async (logId: string) => {
        setIsDeleting(logId);
        try {
            await deleteLogbookEntry(logId);
            toast({ title: "Success", description: "Log entry deleted." });
            onUpdate();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: (error as Error).message });
        } finally {
            setIsDeleting(null);
        }
    }

    if (selectedLog || isAdding) {
        return (
            <div>
                <DialogHeader>
                    <DialogTitle>{isAdding ? 'Add New Log Entry' : 'Edit Log Entry'}</DialogTitle>
                </DialogHeader>
                 <div className="py-4">
                    <LogEditorForm 
                        log={selectedLog} 
                        onSuccess={() => {
                            onUpdate();
                            setSelectedLog(null);
                            setIsAdding(false);
                        }}
                        onCancel={() => {
                            setSelectedLog(null);
                            setIsAdding(false);
                        }}
                    />
                </div>
            </div>
        )
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Edit Logbook</DialogTitle>
                <DialogDescription>Add, remove, or update financial logbook entries.</DialogDescription>
            </DialogHeader>
             <div className="flex-grow overflow-hidden flex flex-col">
                <ScrollArea className="flex-grow pr-6 -mr-6">
                    <div className="space-y-2">
                        {logs.map(log => (
                            <div key={log.id} className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50">
                                <div className="flex-1 truncate">
                                    <span className="font-medium">{log.description}</span>
                                    <p className="text-xs text-muted-foreground">{log.date} - {formatCurrency(log.balance)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                                        <Pencil className="h-4 w-4"/>
                                     </Button>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={!!isDeleting}>
                                                {isDeleting === log.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <p>Deleting this entry may affect the balance of subsequent entries. This action cannot be undone.</p>
                                            </AlertDialogHeader>
                                             <DialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(log.id)}>Confirm Delete</AlertDialogAction>
                                            </DialogFooter>
                                        </AlertDialogContent>
                                     </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
             </div>
             <DialogFooter className="pt-4 border-t gap-2">
                 <Button variant="ghost" className="mr-auto" onClick={() => setIsAdding(true)}>
                    <Plus className="mr-2 h-4 w-4"/>
                    New Entry
                 </Button>
                 <Button variant="outline" onClick={closeDialog}>Close</Button>
            </DialogFooter>
        </>
    )
}


export default function Logbook() {
    const [logbookData, setLogbookData] = useState<LogbookEntry[]>([]);
    const [allReimbursements, setAllReimbursements] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allItems, setAllItems] = useState<any[]>([]);
    const [selectedLog, setSelectedLog] = useState<LogbookEntry | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();

    const isTreasurer = currentUser?.role === 'treasurer';
    
    const fetchData = () => {
         getRelatedFinanceData().then(({ reimbursements, users, newItems }) => {
            setAllReimbursements(reimbursements);
            setAllUsers(users);
            setAllItems(newItems);
        }).catch(error => {
            console.error("Error fetching related data: ", error);
        });
    }

    useEffect(() => {
        fetchData();

        const logbookQuery = query(collection(db, "logbook"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(logbookQuery, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LogbookEntry));
            setLogbookData(logs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const selectedReimbursement = selectedLog?.reimbursementId
        ? allReimbursements.find(r => r.id === selectedLog.reimbursementId)
        : null;

    const selectedProcurementItem = selectedReimbursement?.newItemRequestId
        ? allItems.find(item => item.id === selectedReimbursement.newItemRequestId)
        : null;
    
    const procurementRequester = selectedProcurementItem
        ? allUsers.find(u => u.id === selectedProcurementItem.requestedById)
        : null;

    const procurementApprover = selectedProcurementItem
        ? allUsers.find(u => u.id === selectedProcurementItem.approvedById)
        : null;


    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Dialog open={!!selectedReimbursement} onOpenChange={(isOpen) => !isOpen && setSelectedLog(null)}>
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Financial Logbook</CardTitle>
                            <CardDescription>A detailed record of all financial transactions. Click on a reimbursement log for more details.</CardDescription>
                        </div>
                        {isTreasurer && (
                             <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </DialogTrigger>
                        )}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logbookData.map((entry) => (
                                    <TableRow 
                                        key={entry.id} 
                                        onClick={() => entry.reimbursementId && setSelectedLog(entry)}
                                        className={cn(entry.reimbursementId && "cursor-pointer hover:bg-muted/50")}
                                    >
                                        <TableCell className="whitespace-nowrap">{entry.date}</TableCell>
                                        <TableCell>{entry.description}</TableCell>
                                        <TableCell className={cn(
                                            "text-right font-mono",
                                            entry.debit && "text-green-600",
                                            entry.credit && "text-red-600"
                                        )}>
                                            {entry.debit ? `+${formatCurrency(entry.debit)}` : `-${formatCurrency(entry.credit)}`}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(entry.balance)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <DialogContent className="h-[90vh] flex flex-col">
                    <LogbookEditor logs={logbookData} onUpdate={fetchData} closeDialog={() => setIsEditorOpen(false)} />
                </DialogContent>
            </Dialog>
            {selectedReimbursement && (
                <DialogContent className="sm:max-w-sm">
                     <DialogHeader>
                        <DialogTitle>Reimbursement Details</DialogTitle>
                        <p className="text-2xl font-bold font-mono pt-2">₹{selectedReimbursement.amount.toFixed(2)}</p>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] -mx-6">
                        <div className="px-6 space-y-4">
                            <div className="text-sm">
                                <span className="text-muted-foreground">Submitted by: </span>
                                <span className="font-medium">{allUsers.find((u: any) => u.id === selectedReimbursement.submittedById)?.name}</span>
                            </div>

                            {selectedProcurementItem && (
                                <Card className="bg-muted/50">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-base">Associated Procurement Request</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-sm space-y-2">
                                    <p><span className="font-medium text-muted-foreground">Item:</span> {selectedProcurementItem.itemName} (x{selectedProcurementItem.quantity})</p>
                                    <p><span className="font-medium text-muted-foreground">Justification:</span> {selectedProcurementItem.justification}</p>
                                    <p><span className="font-medium text-muted-foreground">Requested by:</span> {procurementRequester?.name || 'N/A'}</p>
                                    <p><span className="font-medium text-muted-foreground">Approved by:</span> {procurementApprover?.name || 'N/A'}</p>
                                </CardContent>
                                </Card>
                            )}
                            
                            {!selectedProcurementItem && (
                                <div>
                                    <h4 className="font-medium mb-1 text-sm text-muted-foreground">Notes/Reason</h4>
                                    <p className="text-sm">{selectedReimbursement.notes || 'No notes provided.'}</p>
                                </div>
                            )}

                            <div>
                                <h4 className="font-medium mb-1 text-sm text-muted-foreground">Receipt</h4>
                                {selectedReimbursement.proofImageUrls?.[0] ? (
                                <a href={selectedReimbursement.proofImageUrls[0]} target="_blank" rel="noopener noreferrer">
                                    <Image 
                                    src={selectedReimbursement.proofImageUrls[0]}
                                    alt="Receipt"
                                    width={400}
                                    height={400}
                                    className="w-full h-auto rounded-md border object-contain"
                                    />
                                </a>
                                ) : (
                                <p className="text-sm text-muted-foreground">No receipt image uploaded.</p>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                </DialogContent>
            )}
        </Dialog>
    );
}

    