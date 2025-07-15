
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { useAuth, type AppUser } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectActions } from "./project-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, LogOut, Flag, ShoppingCart, CheckCircle } from "lucide-react";
import { joinProject, leaveProject, completeProject } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RequestInventoryForm } from "./request-inventory-form";
import { NewUpdateForm } from "./new-update-form";


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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
    const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
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

    if (!initialData) {
        return null;
    }

    const { project, members, inventoryRequests, inventoryItems, updates } = initialData;
    
    const isMember = currentUser && project.memberIds.includes(currentUser.uid);
    const isLead = currentUser && currentUser.uid === project.leadId;

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

    const handleLeave = async () => {
        if (!currentUser) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to leave a project." });
            return;
        }
        setIsLeaving(true);
        try {
            await leaveProject(project.id, currentUser.uid);
            toast({ title: "You've left the project", description: `You are no longer a member of "${project.title}".` });
            router.refresh();
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to Leave", description: (error as Error).message });
        } finally {
            setIsLeaving(false);
        }
    };

    const handleCompleteProject = async () => {
        setIsSubmitting(true);
        try {
            await completeProject(project.id);
            toast({ title: "Project Completed", description: "The project has been marked as completed." });
            router.refresh();
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to Complete Project", description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleRequestSubmit = () => {
        router.refresh();
        setIsRequestFormOpen(false);
    }
    
    const handleUpdateSubmit = () => {
        router.refresh();
        setIsUpdateFormOpen(false);
    }

    return (
        <Dialog open={isRequestFormOpen} onOpenChange={setIsRequestFormOpen}>
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
                            <>
                               <ProjectActions project={project as any} currentUser={currentUser} />
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
                    <div className="flex items-center gap-2 mt-4 border-t pt-4">
                        <DialogTrigger asChild>
                            <Button variant="outline"><ShoppingCart className="mr-2"/>Request Additional Inventory</Button>
                        </DialogTrigger>
                         {isLead && (
                             <Button onClick={handleCompleteProject} disabled={isSubmitting} variant="outline">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2"/>}
                                Mark as Completed
                            </Button>
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
                                                        <Avatar>
                                                            <AvatarImage src={`https://i.pravatar.cc/150?u=${author?.email}`} />
                                                            <AvatarFallback>{author?.name?.charAt(0) || 'U'}</AvatarFallback>
                                                        </Avatar>
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
                                                    <TableCell><Badge variant={req.status === 'pending' ? 'secondary' : req.status === 'fulfilled' ? 'default' : 'destructive'}>{req.status}</Badge></TableCell>
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
