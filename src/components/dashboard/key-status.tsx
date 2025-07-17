
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { KeyRound, Send, Loader2 } from "lucide-react";
import { useAuth, type AppUser } from "@/context/auth-context";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getEligibleKeyHolders, transferKey } from "@/app/dashboard/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "../ui/scroll-area";

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

function TransferKeyForm({
    keyName,
    currentUser,
    eligibleUsers,
    closeDialog
}: {
    keyName: string,
    currentUser: AppUser | null,
    eligibleUsers: AppUser[],
    closeDialog: () => void
}) {
    const [selectedUserId, setSelectedUserId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !selectedUserId) {
            toast({ variant: "destructive", title: "Error", description: "You must select a recipient." });
            return;
        }
        setIsLoading(true);
        try {
            await transferKey(keyName, currentUser.uid, selectedUserId);
            toast({ title: "Success", description: "Key transferred successfully." });
            closeDialog();
        } catch (error) {
            toast({ variant: "destructive", title: "Transfer Failed", description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Select onValueChange={setSelectedUserId} value={selectedUserId}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a member to transfer to..." />
                </SelectTrigger>
                <SelectContent>
                    {eligibleUsers
                        .filter(u => u.uid !== currentUser?.uid)
                        .map(user => (
                            <SelectItem key={user.uid} value={user.uid}>{user.name}</SelectItem>
                        ))}
                </SelectContent>
            </Select>
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={closeDialog}>Cancel</Button>
                <Button type="submit" disabled={isLoading || !selectedUserId}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Transfer
                </Button>
            </DialogFooter>
        </form>
    );
}

export function KeyStatus({ keys, recentTransfers, onStatusChange }: KeyStatusProps) {
    const { user: currentUser } = useAuth();
    const [openDialogKey, setOpenDialogKey] = useState<string | null>(null);
    const [eligibleUsers, setEligibleUsers] = useState<AppUser[]>([]);

    const handleOpenDialog = async (keyName: string) => {
        try {
            const users = await getEligibleKeyHolders();
            setEligibleUsers(users as AppUser[]);
            setOpenDialogKey(keyName);
        } catch (error) {
            console.error("Failed to fetch eligible users:", error);
        }
    };
    
    const handleDialogClose = () => {
        setOpenDialogKey(null);
        onStatusChange();
    }
    
    const transfersForKey = (keyName: string) => recentTransfers.filter(t => t.keyName === keyName).slice(0, 5);

    return (
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
                                    <Dialog open={openDialogKey === key.keyName} onOpenChange={(isOpen) => !isOpen && setOpenDialogKey(null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(key.keyName)}>
                                                <Send className="mr-2 h-3 w-3"/>
                                                Transfer
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Transfer Key: {key.keyName.replace(/([A-Z])/g, ' $1')}</DialogTitle>
                                                <DialogDescription>
                                                    Select a member with key-holding permissions to transfer this key to.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <TransferKeyForm 
                                                keyName={key.keyName} 
                                                currentUser={currentUser} 
                                                eligibleUsers={eligibleUsers} 
                                                closeDialog={handleDialogClose}
                                            />
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Recent Transfers</h4>
                                                <ScrollArea className="h-32 rounded-md border">
                                                    <div className="p-2 text-sm">
                                                        {transfersForKey(key.keyName).length > 0 ? (
                                                            transfersForKey(key.keyName).map((t, i) => (
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
                                    </Dialog>
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
    );
}
