
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { useAuth, type AppUser } from "@/context/auth-context";
import { doc, getDoc, collection, getDocs, query, where, Timestamp, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectActions } from "./project-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, LogOut, Flag, ShoppingCart, CheckCircle, ArrowLeft, User as UserIcon, Archive } from "lucide-react";
import { joinProject, leaveProject, initiateProjectCompletion, closeProject } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RequestInventoryForm } from "./request-inventory-form";
import { NewUpdateForm } from "./new-update-form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Project, InventoryItem } from "../page";


function getProjectStatusConfig(status: string) {
    switch (status) {
        case 'pending_approval': return { color: 'bg-yellow-500', tooltip: 'Pending Approval' }
        case 'approved': return { color: 'bg-blue-500', tooltip: 'Approved' }
        case 'active': return { color: 'bg-sky-500', tooltip: 'Active' }
        case 'pending_return': return { color: 'bg-orange-500', tooltip: 'Pending Return' }
        case 'completed': return { color: 'bg-green-500', tooltip: 'Completed' }
        case 'closed': return { color: 'bg-gray-800', tooltip: 'Closed' }
        case 'rejected': return { color: 'bg-red-500', tooltip: 'Rejected' }
        default: return { color: 'bg-gray-400', tooltip: status.replace(/_/g, ' ') }
    }
}

const getInventoryStatusConfig = (status: string) => {
    switch (status) {
        case 'pending': return { color: 'bg-yellow-500', tooltip: 'Pending' }
        case 'fulfilled': return { color: 'bg-blue-500', tooltip: 'Fulfilled' }
        case 'rejected': return { color: 'bg-red-500', tooltip: 'Rejected' }
        case 'pending_return': return { color: 'bg-orange-500', tooltip: 'Pending Return' }
        case 'returned': return { color: 'bg-green-500', tooltip: 'Returned' }
        default: return { color: 'bg-gray-400', tooltip: 'Unknown' }
    }
}

// Helper to convert Firestore Timestamps to strings for client-side state
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

const StatusCircle = ({ status, type }: { status: string, type: 'project' | 'inventory' }) => {
  const config = type === 'project' ? getProjectStatusConfig(status) : getInventoryStatusConfig(status);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          <div className={cn("h-3 w-3 rounded-full", config.color)}></div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function ProjectDetailsClient({ projectId }: { projectId: string }) {
    const { user: currentUser, loading: authLoading } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
    const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchProjectData = async () => {
            const projectRef = doc(db, "projects", projectId);
            const projectSnap = await getDoc(projectRef);

            if (!projectSnap.exists()) {
                setLoading(false);
                return;
            }
            
            const projectData = projectSnap.data();
            const memberIds = Array.isArray(projectData.memberIds) && projectData.memberIds.length > 0
                ? projectData.memberIds
                : [projectData.leadId];

            const project = serializeFirestoreTimestamps({ id: projectSnap.id, ...projectData, memberIds });
            
            let members: AppUser[] = [];
            if (memberIds.length > 0) {
                const usersQuery = query(collection(db, "users"), where("id", "in", memberIds));
                const usersSnap = await getDocs(usersQuery);
                members = usersSnap.docs.map(doc => serializeFirestoreTimestamps({ id: doc.id, ...doc.data() })) as AppUser[];
            }
            
            const inventoryRequestsQuery = query(collection(db, "inventory_requests"), where("projectId", "==", projectId));
            const inventoryRequestsSnap = await getDocs(inventoryRequestsQuery);
            const inventoryRequests = inventoryRequestsSnap.docs.map(doc => serializeFirestoreTimestamps({ id: doc.id, ...doc.data() }));

            const allInventoryItemsSnap = await getDocs(collection(db, "inventory_items"));
            const inventoryItems = allInventoryItemsSnap.docs.map(doc => serializeFirestoreTimestamps({ id: doc.id, ...doc.data() }));
            
            const updatesQuery = query(collection(db, "projects", projectId, "updates"), orderBy("createdAt", "desc"));
            const updatesSnap = await getDocs(updatesQuery);
            const updates = updatesSnap.docs.map(doc => serializeFirestoreTimestamps({ id: doc.id, ...doc.data() }));
            
            setData({ project, members, inventoryRequests, inventoryItems, updates });
            setLoading(false);
        }
        
        fetchProjectData();

    }, [projectId]);

    const onDataRefresh = () => {
        // This is a bit of a hack to re-trigger the useEffect. A more robust solution might use a state management library.
        setLoading(true);
        setData(null);
        setTimeout(() => {
             const fetchProjectData = async () => {
                const projectRef = doc(db, "projects", projectId);
                const projectSnap = await getDoc(projectRef);

                if (!projectSnap.exists()) {
                    setLoading(false);
                    return;
                }
                
                const projectData = projectSnap.data();
                const memberIds = Array.isArray(projectData.memberIds) && projectData.memberIds.length > 0
                    ? projectData.memberIds
                    : [projectData.leadId];

                const project = serializeFirestoreTimestamps({ id: projectSnap.id, ...projectData, memberIds });
                
                let members: AppUser[] = [];
                if (memberIds.length > 0) {
                    const usersQuery = query(collection(db, "users"), where("id", "in", memberIds));
                    const usersSnap = await getDocs(usersQuery);
                    members = usersSnap.docs.map(doc => serializeFirestoreTimestamps({ id: doc.id, ...doc.data() })) as AppUser[];
                }
                
                const inventoryRequestsQuery = query(collection(db, "inventory_requests"), where("projectId", "==", projectId));
                const inventoryRequestsSnap = await getDocs(inventoryRequestsQuery);
                const inventoryRequests = inventoryRequestsSnap.docs.map(doc => serializeFirestoreTimestamps({ id: doc.id, ...doc.data() }));

                const allInventoryItemsSnap = await getDocs(collection(db, "inventory_items"));
                const inventoryItems = allInventoryItemsSnap.docs.map(doc => serializeFirestoreTimestamps({ id: doc.id, ...doc.data() }));
                
                const updatesQuery = query(collection(db, "projects", projectId, "updates"), orderBy("createdAt", "desc"));
                const updatesSnap = await getDocs(updatesQuery);
                const updates = updatesSnap.docs.map(doc => serializeFirestoreTimestamps({ id: doc.id, ...doc.data() }));
                
                setData({ project, members, inventoryRequests, inventoryItems, updates });
                setLoading(false);
            }
        
            fetchProjectData();
        }, 100); // Small delay to ensure state update is processed
    };

    if (authLoading || loading) {
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
                            <CardHeader><CardTitle>Updates</CardTitle></CardHeader>
                            <CardContent><Skeleton className="h-48 w-full" /></CardContent>
                        </Card>
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
        return <p>Project not found.</p>;
    }

    const { project, members, inventoryRequests, inventoryItems, updates } = data;
    
    const isMember = currentUser && project.memberIds.includes(currentUser.uid);
    const isLead = currentUser && currentUser.uid === project.leadId;
    const canClose = currentUser?.permissions?.canCloseProjects && !['closed', 'rejected'].includes(project.status);

    const handleJoin = async () => {
        if (!currentUser) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to join a project." });
            return;
        }
        setIsJoining(true);
        try {
            await joinProject(project.id, currentUser.uid);
            toast({ title: "Success!", description: `You have joined the project "${project.title}".` });
            onDataRefresh();
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to Join", description: (error as Error).message });
        } finally {
            setIsJoining(false);
        }
    };

    const handleLeave = async () => {
        if (!currentUser) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to leave a project." });
            return;
        }
        setIsLeaving(true);
        try {
            await leaveProject(project.id, currentUser.uid);
            toast({ title: "You've left the project", description: `You are no longer a member of "${project.title}".` });
            onDataRefresh();
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to Leave", description: (error as Error).message });
        } finally {
            setIsLeaving(false);
        }
    };

    const handleCloseProject = async () => {
        if (!currentUser) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to close a project." });
            return;
        }
        setIsSubmitting(true);
        try {
            await closeProject(project.id, currentUser.uid);
            toast({ title: "Project Closed", description: "The project has been archived." });
            onDataRefresh();
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to Close Project", description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompleteProject = async () => {
        setIsSubmitting(true);
        try {
            await initiateProjectCompletion(project.id);
            toast({ title: "Project Completion Initiated", description: "Please return all non-perishable items to the inventory manager." });
            onDataRefresh();
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to Initiate Completion", description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleRequestSubmit = () => {
        onDataRefresh();
        setIsRequestFormOpen(false);
    }
    
    const handleUpdateSubmit = () => {
        onDataRefresh();
        setIsUpdateFormOpen(false);
    }

    return (
        <Dialog open={isRequestFormOpen} onOpenChange={setIsRequestFormOpen}>
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                         <Link href="/dashboard/projects" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
                        </Link>
                        <div className="flex items-center gap-4">
                            <h2 className="text-3xl font-bold tracking-tight font-headline">{project.title}</h2>
                            <StatusCircle status={project.status} type="project" />
                        </div>
                        <p className="text-muted-foreground mt-2 max-w-2xl">{project.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ProjectActions project={project as any} currentUser={currentUser} />
                        {isMember ? (
                            <>
                               {!isLead && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" disabled={isLeaving}>
                                                {isLeaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                                                Leave Team
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    You will be removed from the project team. This action can be reversed by joining the team again.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleLeave}>Confirm</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                               )}
                               {canClose && !isLead && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" disabled={isSubmitting}>
                                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                                                Close Project
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently close the project and archive it. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleCloseProject}>Confirm</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                               )}
                            </>
                        ) : (
                            <Button onClick={handleJoin} disabled={isJoining}>
                                {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                Join Team
                            </Button>
                        )}
                    </div>
                </div>
                
                {isMember && project.status === 'active' && (
                    <div className="flex items-center gap-2 border-t pt-4">
                        <DialogTrigger asChild>
                            <Button variant="outline"><ShoppingCart className="mr-2"/>Request Additional Inventory</Button>
                        </DialogTrigger>
                         {isLead && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button disabled={isSubmitting} variant="outline">
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2"/>}
                                        Mark as Completed
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Ready to complete the project?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will start the item return process. The project will be marked as 'completed' once all non-perishable items have been returned and confirmed by an inventory manager.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleCompleteProject}>Confirm</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         )}
                    </div>
                )}


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Dialog open={isUpdateFormOpen} onOpenChange={setIsUpdateFormOpen}>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Project Updates</CardTitle>
                                        <CardDescription>A timeline of progress and milestones.</CardDescription>
                                    </div>
                                    {isMember && project.status === 'active' && (
                                        <DialogTrigger asChild>
                                            <Button variant="outline"><Flag className="mr-2"/>Post Update</Button>
                                        </DialogTrigger>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {updates?.length > 0 ? (
                                        <div className="space-y-6">
                                            {updates.map((update: any) => {
                                                const author = members.find((m: AppUser) => m.uid === update.postedById);
                                                return (
                                                    <div key={update.id} className="flex gap-4">
                                                        <UserIcon className="h-9 w-9 text-muted-foreground p-1.5 bg-muted rounded-full" />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-baseline justify-between">
                                                                <p className="font-semibold">{author?.name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {format(new Date(update.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                                                </p>
                                                            </div>
                                                            {update.text && <p className="text-sm text-foreground whitespace-pre-wrap">{update.text}</p>}
                                                            {update.imageUrls && update.imageUrls.length > 0 && (
                                                                <Carousel className="w-full mt-2">
                                                                    <CarouselContent>
                                                                        {update.imageUrls.map((url: string, index: number) => (
                                                                            <CarouselItem key={index}>
                                                                                <div className="relative aspect-video">
                                                                                    <Image src={url} alt={`Project update image ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md border"/>
                                                                                </div>
                                                                            </CarouselItem>
                                                                        ))}
                                                                    </CarouselContent>
                                                                    {update.imageUrls.length > 1 && <>
                                                                        <CarouselPrevious className="left-2" />
                                                                        <CarouselNext className="right-2" />
                                                                    </>}
                                                                </Carousel>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground py-8">
                                            <Flag className="mx-auto h-8 w-8 mb-2" />
                                            <p>No updates have been posted for this project yet.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                             <DialogContent>
                                <DialogHeader>
                                <DialogTitle>Post Project Update</DialogTitle>
                                <DialogDescription>Share your progress with the team. You can include an image.</DialogDescription>
                                </DialogHeader>
                                <NewUpdateForm
                                project={project}
                                setOpen={setIsUpdateFormOpen}
                                onFormSubmit={handleUpdateSubmit}
                                />
                            </DialogContent>
                        </Dialog>

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
                                                    <TableCell><StatusCircle status={req.status} type="inventory" /></TableCell>
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
                                        <UserIcon className="h-9 w-9 text-muted-foreground p-1.5 bg-muted rounded-full" />
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
             <DialogContent>
                <DialogHeader>
                <DialogTitle>Request Additional Inventory</DialogTitle>
                <DialogDescription>Select the items and quantities needed for your project.</DialogDescription>
                </DialogHeader>
                <RequestInventoryForm 
                    project={project}
                    inventory={inventoryItems}
                    currentUser={currentUser}
                    onFormSubmit={handleRequestSubmit}
                />
            </DialogContent>
        </Dialog>
    );
}
