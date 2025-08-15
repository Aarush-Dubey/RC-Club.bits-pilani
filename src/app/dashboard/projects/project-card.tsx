
"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { AppUser } from "@/context/auth-context"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { User, Archive, Loader2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { closeProject } from "./[id]/actions"
import { useToast } from "@/hooks/use-toast"

export type Project = {
  id: string
  title: string
  description: string
  status: 'pending_approval' | 'approved' | 'active' | 'completed' | 'closed' | 'rejected' | 'pending_return'
  leadId: string
  memberIds: string[]
  [key: string]: any
}

export type User = {
  id: string
  name: string
  email: string
  [key: string]: any
}

export type InventoryItem = {
    id: string;
    name: string;
    totalQuantity: number;
    availableQuantity: number;
    [key: string]: any;
}

function getStatusConfig(status: string) {
    switch (status) {
        case 'pending_approval': return { color: 'bg-yellow-500', tooltip: 'Pending Approval' };
        case 'approved': return { color: 'bg-blue-500', tooltip: 'Approved' };
        case 'active': return { color: 'bg-sky-500', tooltip: 'Active' };
        case 'pending_return': return { color: 'bg-orange-500', tooltip: 'Pending Return' };
        case 'completed': return { color: 'bg-green-500', tooltip: 'Completed' };
        case 'closed': return { color: 'bg-gray-800', tooltip: 'Closed' };
        case 'rejected': return { color: 'bg-red-500', tooltip: 'Rejected' };
        default: return { color: 'bg-gray-400', tooltip: status ? status.replace(/_/g, ' ') : 'Unknown' };
    }
}

const StatusCircle = ({ status }: { status: string }) => {
  const config = getStatusConfig(status);

  return (
    <Tooltip>
        <TooltipTrigger asChild>
            <div className={cn("h-3 w-3", config.color)}></div>
        </TooltipTrigger>
        <TooltipContent>
            <p>{config.tooltip}</p>
        </TooltipContent>
    </Tooltip>
  );
};


export const ProjectCard = ({ project, users, currentUser }: { project: Project; users: User[]; currentUser: AppUser | null }) => {
  const projectLead = users.find((u: any) => u.id === project.leadId)
  const canManage = currentUser?.permissions?.canApproveProjects && project.status === 'pending_approval';
  const canClose = currentUser?.permissions?.canCloseProjects && !['closed', 'rejected'].includes(project.status);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();


  const handleCloseProject = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent link navigation
    if (!currentUser) return;
    setIsLoading(true);
     try {
      await closeProject(project.id, currentUser!.uid);
      toast({ title: "Project Closed", description: "The project has been archived." });
      router.refresh();
    } catch (error) {
      console.error(`Failed to close project:`, error);
      toast({ variant: "destructive", title: "Failed to Close Project", description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
      <div key={project.id} className="group flex flex-col border p-4 h-full relative bg-secondary">
          <div className="flex items-center justify-between">
            <StatusCircle status={project.status} />
          </div>
          <h3 className="text-h3 mt-2 group-hover:text-primary transition-colors flex-grow">
            <Link href={`/dashboard/projects/${project.id}`} className="static">
              <span className="absolute inset-0" />
              {project.title}
            </Link>
          </h3>
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2 ">{project.description}</p>
          <div className="flex items-center gap-4 mt-4">
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{project.memberIds.length} members</span>
              </div>
              {projectLead && (
              <div className="text-sm">
                  <span className="font-semibold">{projectLead.name}</span>
                  <span className="text-muted-foreground">, Lead</span>
              </div>
              )}
          </div>
          <div className="flex items-center gap-2 mt-4 z-10 relative">
            <Link href={`/dashboard/projects/${project.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                View Project
                </Button>
            </Link>
            {canManage && (
                 <Link href={`/dashboard/projects/${project.id}`}>
                    <Button className="w-full">Manage</Button>
                </Link>
            )}
             {canClose && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" disabled={isLoading} onClick={(e) => e.stopPropagation()}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to close this project?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently close the project and archive it. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleCloseProject}>
                                Confirm Close
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
          </div>
      </div>
  )
}
