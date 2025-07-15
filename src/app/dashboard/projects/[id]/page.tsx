
"use client"

import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, type AppUser } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { notFound } from "next/navigation";
import { ProjectActions } from "./project-actions";
import { Skeleton } from "@/components/ui/skeleton";

// Helper to convert Firestore Timestamps to strings
const serializeFirestoreTimestamps = (data: any): any => {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(serializeFirestoreTimestamps);
    }
    if (typeof data === 'object' && data !== null) {
        if (data instanceof Timestamp) {
            return data.toDate().toISOString();
        }
        const newObj: { [key: string]: any } = {};
        for (const key in data) {
            newObj[key] = serializeFirestoreTimestamps(data[key]);
        }
        return newObj;
    }
    return data;
};

async function getProjectData(projectId: string) {
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
        return null;
    }

    const projectData = projectSnap.data();
    const memberIds = Array.isArray(projectData.memberIds) && projectData.memberIds.length > 0
        ? projectData.memberIds
        : [projectData.leadId]; 

    const project = serializeFirestoreTimestamps({ id: projectSnap.id, ...projectData, memberIds });

    const usersQuery = query(collection(db, "users"), where("id", "in", memberIds));
    const usersSnap = await getDocs(usersQuery);
    const members = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const inventoryRequestsQuery = query(collection(db, "inventory_requests"), where("projectId", "==", projectId));
    const inventoryRequestsSnap = await getDocs(inventoryRequestsQuery);
    const inventoryRequests = inventoryRequestsSnap.docs.map(doc => serializeFirestoreTimestamps({ id: doc.id, ...doc.data() }));

    const inventoryItems = [];
    if(inventoryRequests.length > 0) {
        const itemIds = inventoryRequests.map(req => req.itemId).filter(id => id);
        if (itemIds.length > 0) {
            const inventoryItemsQuery = query(collection(db, "inventory_items"), where("id", "in", itemIds));
            const inventoryItemsSnap = await getDocs(inventoryItemsQuery);
            inventoryItems.push(...inventoryItemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
    }

    return { project, members, inventoryRequests, inventoryItems };
}

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


export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
    const { id: projectId } = params;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { user: currentUser, loading: authLoading } = useAuth(); 

    useEffect(() => {
        const fetchData = async () => {
            try {
                const projectData = await getProjectData(projectId);
                if (!projectData) {
                    notFound();
                }
                setData(projectData);
            } catch (error) {
                console.error("Failed to fetch project data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [projectId]);


    if (loading || authLoading) {
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
        return null; // or a not found component
    }

    const { project, members, inventoryRequests, inventoryItems } = data;
    const projectLead = members.find(m => m.id === project.leadId);

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
                <ProjectActions project={project as any} currentUser={currentUser} />
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
