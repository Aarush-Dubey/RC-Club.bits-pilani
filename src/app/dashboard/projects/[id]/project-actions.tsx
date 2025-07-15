
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Play, Flag, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Project } from "../page";
import { approveProject, rejectProject } from "./actions";

interface ProjectActionsProps {
  project: Project;
  currentUserRole: string;
}

export function ProjectActions({ project, currentUserRole }: ProjectActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await approveProject(project.id);
      toast({ title: "Project Approved", description: "Inventory has been checked out to the project lead." });
      router.refresh();
    } catch (error) {
      console.error("Failed to approve project:", error);
      toast({ variant: "destructive", title: "Approval Failed", description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReject = async () => {
    setIsLoading(true);
    try {
      await rejectProject(project.id);
      toast({ title: "Project Rejected", description: "The project has been marked as rejected." });
      router.refresh();
    } catch (error) {
      console.error("Failed to reject project:", error);
      toast({ variant: "destructive", title: "Rejection Failed", description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = currentUserRole === 'coordinator' || currentUserRole === 'admin';

  if (project.status === 'pending_approval' && isAdmin) {
    return (
      <div className="flex gap-2">
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Approve
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to approve this project?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will approve the project and fulfill all pending inventory requests, checking out the items to the project lead. This action cannot be undone.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleApprove}>Confirm Approval</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isLoading}>
                    <X className="mr-2 h-4 w-4" />
                    Reject
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to reject this project?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently reject the project and associated requests. This action cannot be undone.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleReject}>Confirm Rejection</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Placeholder for other actions based on status
  return (
    <div className="flex gap-2">
        {project.status === 'approved' && <Button disabled><Play className="mr-2"/>Start Project</Button>}
        {project.status === 'active' && <Button disabled><Flag className="mr-2"/>Post Update</Button>}
        {project.status === 'completed' && isAdmin && <Button disabled><Archive className="mr-2"/>Close Project</Button>}
    </div>
  );
}
