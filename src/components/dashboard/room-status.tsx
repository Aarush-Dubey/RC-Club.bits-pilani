
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DoorClosed, DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type RoomStatusProps = {
    isOpen: boolean;
};

export function RoomStatus({ isOpen }: RoomStatusProps) {
    const Icon = isOpen ? DoorOpen : DoorClosed;
    const text = isOpen ? "Room is Open" : "Room is Closed";
    const description = isOpen ? "The club room is currently accessible." : "Access to the room is currently restricted.";
    const color = isOpen ? "text-green-500" : "text-red-500";

    return (
        <Card>
            <CardHeader>
                <CardTitle>Room Status</CardTitle>
                <CardDescription>Current availability of the club room.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Icon className={cn("h-12 w-12", color)} />
                    <div>
                        <p className={cn("text-xl font-bold", color)}>{text}</p>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
