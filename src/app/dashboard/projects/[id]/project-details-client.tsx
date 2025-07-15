
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectActions } from "./project-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";
import { joinProject } from "./actions";
import { useToast } from "@/hooks/use-toast";


function getStatusBadge(status: string) {
    switch (status) {
        case 'pending_approval':
        return <Badge variant="secondary">Pending Approval</Badge>
        case 'approved':
        return <Badge className="bg-yellow-500 text-white">Approved</Badge>
        case 'active':
        return <Badge className="bg-blue-500 text-white">Active</Badge>
        case 'completed':
        return <Badge className="bg-green-500 text-white">Completed</Badge>
        case 'closed':
        return <Badge variant="outline">Closed</Badge>
        case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
        default:
        return <Badge variant="outline">{status ? status.replace(/_/g, ' ') : 'Unknown'}</Badge>
    }
}

export default function ProjectDetailsClient({ initialData }: { initialData: any }) {
    const { user: currentUser, loading: authLoading } = useAuth(); 
    const [data] = useState(initialData);
    const [isJoining, setIsJoining] = useState(false);
    const { toast } = useToast();
    const router = useRouter();


    if (authLoading) {
        return (
             <div className="space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <Skeleton className="h-9 w-72 mb-3" />
                        <Skeleton className="h-5 w-96" />
                    </div>
                     <div className="flex gap-2">
                        <Skeleton className="h-10 w-28" />
                        <Skeleton className="h-10 w-28" />
                     </div>
                </div>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader><CardTitle>Requested Inventory</CardTitle></CardHeader>
                            <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                        </Card>
                    </div>
                    <div className="space-y-8">
                         <Card>
                            <CardHeader><CardTitle>Team</CardTitle></CardHeader>
                            <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    if (!data) {
        return null;
    }

    const { project, members, inventoryRequests, inventoryItems } = data;
    
    const isMember = currentUser && project.memberIds.includes(currentUser.uid);

    const handleJoin = async () => {
        if (!currentUser) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to join a project." });
            return;
        }
        setIsJoining(true);
        try {
            await joinProject(project.id, currentUser.uid);
            toast({ title: "Success!", description: `You have joined the project "${project.title}".` });
            router.refresh();
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to Join", description: (error as Error).message });
        } finally {
            setIsJoining(false);
        }
    };


    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold tracking-tight font-headline">{project.title}</h2>
                        {getStatusBadge(project.status)}
                    </div>
                    <p className="text-muted-foreground mt-2 max-w-2xl">{project.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    {isMember ? (
                         <ProjectActions project={project as any} currentUser={currentUser} />
                    ) : (
                        <Button onClick={handleJoin} disabled={isJoining}>
                            {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Join Team
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader><CardTitle>Requested Inventory</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inventoryRequests.length === 0 ? (
                                        <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No inventory requested.</TableCell></TableRow>
                                    ) : inventoryRequests.map((req: any) => {
                                        const item = inventoryItems.find((i: any) => i.id === req.itemId);
                                        return (
                                            <TableRow key={req.id}>
                                                <TableCell>{item?.name || 'Unknown Item'}</TableCell>
                                                <TableCell>{req.quantity}</TableCell>
                                                <TableCell><Badge variant={req.status === 'pending' ? 'secondary' : 'default'}>{req.status}</Badge></TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="space-y-8">
                    <Card>
                        <CardHeader><CardTitle>Team</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {members.map((member: any) => (
                                <div key={member.id} className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src={`https://i.pravatar.cc/150?u=${member.email}`} />
                                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{member.name}</p>
                                        <p className="text-sm text-muted-foreground">{member.id === project.leadId ? 'Project Lead' : 'Member'}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
