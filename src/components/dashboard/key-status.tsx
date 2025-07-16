
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyRound } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type KeyStatusProps = {
    keys: {
        keyName: string;
        holder: string;
        heldSince: string | null;
    }[];
};

export function KeyStatus({ keys }: KeyStatusProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Key Status</CardTitle>
                <CardDescription>Who currently holds the club keys.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {keys.map(key => (
                        <li key={key.keyName} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <KeyRound className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-semibold capitalize">{key.keyName.replace(/([A-Z])/g, ' $1')}</p>
                                    <p className="text-sm text-muted-foreground">Held by {key.holder}</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {key.heldSince ? formatDistanceToNow(new Date(key.heldSince), { addSuffix: true }) : 'N/A'}
                            </p>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
