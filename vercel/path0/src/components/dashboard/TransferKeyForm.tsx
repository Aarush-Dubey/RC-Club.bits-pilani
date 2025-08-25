/**
 * This file defines the TransferKeyForm component, which provides a user interface
 * for transferring a physical key from one club member to another. It includes a
 * dropdown to select an eligible recipient and a button to submit the transfer action,
 * which then calls a server action to update the key's holder in Firestore.
 */
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { AppUser } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { transferKey } from "@/app/dashboard/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

export function TransferKeyForm({
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

