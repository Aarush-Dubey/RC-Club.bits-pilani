
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Play, Flag, Archive, CheckCircle } from "lucide-react";
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
import { approveProject, rejectProject, startProject, completeProject, closeProject } from "./actions";
import type { AppUser } from "@/context/auth-context";

interface ProjectActionsProps {
  project: Project;
  currentUser: AppUser | null;
}

export function ProjectActions({ project, currentUser }: ProjectActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAction = async (action: () => Promise<void>, successTitle: string, successDescription: string, errorTitle: string) => {
    setIsLoading(true);
    try {
      await action();
      toast({ title: successTitle, description: successDescription });
      router.refresh();
    } catch (error) {
      console.error(`Failed to ${errorTitle}:`, error);
      toast({ variant: "destructive", title: errorTitle, description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const onApprove = () => handleAction(() => approveProject(project.id), "Project Approved", "Inventory has been checked out to the project lead.", "Approval Failed");
  const onReject = () => handleAction(() => rejectProject(project.id), "Project Rejected", "The project has been marked as rejected.", "Rejection Failed");
  const onStart = () => handleAction(() => startProject(project.id), "Project Started", "The project is now active.", "Failed to Start Project");
  const onComplete = () => handleAction(() => completeProject(project.id), "Project Completed", "The project has been marked as completed.", "Failed to Complete Project");
  const onClose = () => handleAction(() => closeProject(project.id), "Project Closed", "The project has been archived.", "Failed to Close Project");

  const canApprove = () => {
    if (!project || project.status !== 'pending_approval' || !currentUser?.permissions?.canApproveProjects) {
        return false;
    }

    const role = currentUser.role;
    if (role === 'admin' || role === 'coordinator') {
      return true;
    }
    if (role === 'drone_lead' && project.type === 'drone') {
      return true;
    }
    if (role === 'plane_lead' && project.type === 'plane') {
      return true;
    }
    return false;
  };

  const canManage = currentUser?.role && ['admin', 'coordinator'].includes(currentUser.role);
  const isProjectLead = currentUser?.uid === project.leadId;


  if (canApprove()) {
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
                <AlertDialogAction onClick={onApprove}>Confirm Approval</AlertDialogAction>
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
                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={onReject}>Confirm Rejection</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Other actions for project lifecycle
  return (
    <div className="flex gap-2">
        {project.status === 'approved' && isProjectLead && (
          <Button onClick={onStart} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2"/>}
            Start Project
          </Button>
        )}
        {project.status === 'active' && isProjectLead && (
          <>
            <Button disabled><Flag className="mr-2"/>Post Update</Button>
            <Button onClick={onComplete} disabled={isLoading} variant="outline">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2"/>}
              Mark as Completed
            </Button>
          </>
        )}
        {project.status === 'completed' && canManage && (
            <Button onClick={onClose} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2"/>}
                Close Project
            </Button>
        )}
    </div>
  );
}
