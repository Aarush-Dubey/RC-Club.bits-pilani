
"use client"

import React, { useState, useEffect } from 'react';
import Image from "next/image"
import { collection, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

interface LogbookEntry {
    id: string;
    date: string;
    description: string;
    debit?: number;
    credit?: number;
    balance: number;
    reimbursementId?: string;
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

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const { reimbursements, users, newItems } = await getRelatedFinanceData();
                setAllReimbursements(reimbursements);
                setAllUsers(users);
                setAllItems(newItems);
            } catch (error) {
                console.error("Error fetching related data: ", error);
            }
        };

        fetchAllData(); // Fetch related data once

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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Logbook</DialogTitle>
                    </DialogHeader>
                    {/* Editor component will go here */}
                    <p>Logbook editing form will be here.</p>
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
