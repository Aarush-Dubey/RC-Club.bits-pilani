
"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DoorClosed, DoorOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { toggleRoomStatus } from "@/app/dashboard/actions";
import { useRouter } from "next/navigation";


type RoomStatusProps = {
    isOpen: boolean;
    updatedBy: string | null;
    updatedAt: string | null;
};

export function RoomStatus({ isOpen, updatedBy, updatedAt }: RoomStatusProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const Icon = isOpen ? DoorOpen : DoorClosed;
    const text = isOpen ? "Room is Open" : "Room is Closed";
    const description = isOpen ? "The club room is currently accessible." : "Access to the room is currently restricted.";
    const color = isOpen ? "text-green-500" : "text-red-500";
    const buttonText = isOpen ? "Mark as Closed" : "Mark as Open";

    const handleToggle = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "You must be logged in." });
            return;
        }
        setIsLoading(true);
        try {
            await toggleRoomStatus(user.uid);
            toast({ title: "Status Updated", description: `Room is now ${isOpen ? 'Closed' : 'Open'}.` });
            // The revalidatePath in the action will trigger a refresh.
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>Room Status</CardTitle>
                <CardDescription>Current availability of the club room.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="flex items-center gap-4">
                    <Icon className={cn("h-12 w-12", color)} />
                    <div>
                        <p className={cn("text-xl font-bold", color)}>{text}</p>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>
                 {updatedBy && updatedAt && (
                    <p className="text-xs text-muted-foreground mt-4">
                        Last updated by {updatedBy} {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}.
                    </p>
                )}
            </CardContent>
            <CardFooter>
                 <Button onClick={handleToggle} disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {buttonText}
                 </Button>
            </CardFooter>
        </Card>
    );
}
