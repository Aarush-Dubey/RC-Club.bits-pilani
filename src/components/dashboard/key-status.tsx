
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { KeyRound, Send } from "lucide-react";
import { useAuth, type AppUser } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getEligibleKeyHolders } from "@/app/dashboard/actions";
import { ScrollArea } from "../ui/scroll-area";
import { TransferKeyForm } from "./TransferKeyForm";

type KeyStatusProps = {
    keys: {
        keyName: string;
        holder: string;
        holderId: string;
        heldSince: string | null;
    }[];
    recentTransfers: {
        keyName: string;
        fromName: string;
        toName: string;
        timestamp: string | null;
    }[];
    onStatusChange: () => void;
};

export function KeyStatus({ keys, recentTransfers, onStatusChange }: KeyStatusProps) {
    const { user: currentUser } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [eligibleUsers, setEligibleUsers] = useState<AppUser[]>([]);

    const handleOpenDialog = async (keyName: string) => {
        try {
            const users = await getEligibleKeyHolders();
            setEligibleUsers(users as AppUser[]);
            setSelectedKey(keyName);
            setIsDialogOpen(true);
        } catch (error) {
            console.error("Failed to fetch eligible users:", error);
        }
    };
    
    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setSelectedKey(null);
        onStatusChange();
    }
    
    const transfersForKey = (keyName: string) => recentTransfers.filter(t => t.keyName === keyName).slice(0, 5);

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Card>
                <CardHeader>
                    <CardTitle>Key Status</CardTitle>
                    <CardDescription>Who currently holds the club keys.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {keys.map(key => (
                            <li key={key.keyName} className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <KeyRound className="h-5 w-5 text-muted-foreground mt-1" />
                                    <div>
                                        <p className="font-semibold capitalize">{key.keyName.replace(/([A-Z])/g, ' $1')}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Held by {key.holderId === currentUser?.uid ? 'You' : key.holder}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {key.holderId === currentUser?.uid ? (
                                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(key.keyName)}>
                                            <Send className="mr-2 h-3 w-3"/>
                                            Transfer
                                        </Button>
                                    ) : (
                                         <p className="text-sm text-muted-foreground">
                                            {key.heldSince ? formatDistanceToNow(new Date(key.heldSince), { addSuffix: true }) : 'N/A'}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
            {selectedKey && (
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Transfer Key: {selectedKey.replace(/([A-Z])/g, ' $1')}</DialogTitle>
                        <DialogDescription>
                            Select a member with key-holding permissions to transfer this key to.
                        </DialogDescription>
                    </DialogHeader>
                    <TransferKeyForm 
                        keyName={selectedKey} 
                        currentUser={currentUser} 
                        eligibleUsers={eligibleUsers} 
                        closeDialog={handleDialogClose}
                    />
                    <div>
                        <h4 className="text-sm font-medium mb-2">Recent Transfers</h4>
                        <ScrollArea className="h-32 rounded-md border">
                            <div className="p-2 text-sm">
                                {transfersForKey(selectedKey).length > 0 ? (
                                    transfersForKey(selectedKey).map((t, i) => (
                                        <div key={i} className="p-1">
                                            <p>
                                                <span className="font-semibold">{t.fromName}</span> to <span className="font-semibold">{t.toName}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {t.timestamp ? formatDistanceToNow(new Date(t.timestamp), { addSuffix: true }) : ''}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground p-2">No recent transfers for this key.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
}
