
import Link from "next/link"
import type { AppUser } from "@/context/auth-context"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type Project = {
  id: string
  title: string
  description: string
  status: 'pending_approval' | 'approved' | 'active' | 'completed' | 'closed' | 'rejected'
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
        case 'closed': return { color: 'bg-gray-500', tooltip: 'Closed' };
        case 'rejected': return { color: 'bg-red-500', tooltip: 'Rejected' };
        default: return { color: 'bg-gray-400', tooltip: status ? status.replace(/_/g, ' ') : 'Unknown' };
    }
}

const StatusCircle = ({ status }: { status: string }) => {
  const config = getStatusConfig(status);

  return (
    <Tooltip>
        <TooltipTrigger>
            <div className={cn("h-3 w-3 rounded-full", config.color)}></div>
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

  return (
      <div key={project.id} className="group flex flex-col border rounded-lg p-4 h-full relative">
          <div className="flex items-center justify-between">
            <StatusCircle status={project.status} />
          </div>
          <h3 className="font-headline text-xl mt-2 group-hover:text-primary transition-colors flex-grow">
            <Link href={`/dashboard/projects/${project.id}`} className="static">
              <span className="absolute inset-0" />
              {project.title}
            </Link>
          </h3>
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2 ">{project.description}</p>
          <div className="flex items-center gap-4 mt-4">
               <div className="flex -space-x-2">
                  {project.memberIds.slice(0,3).map((memberId: string) => {
                      const member: any = users.find((u: any) => u.id === memberId)
                      if (!member) return null;
                      return (
                      <Avatar key={memberId} className="border-2 border-card h-8 w-8">
                          <AvatarImage src={`https://i.pravatar.cc/150?u=${member?.email}`} />
                          <AvatarFallback>{member?.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      )
                  })}
                  {project.memberIds.length > 3 && (
                    <Avatar className="border-2 border-card h-8 w-8">
                        <AvatarFallback>+{project.memberIds.length - 3}</AvatarFallback>
                    </Avatar>
                  )}
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
          </div>
      </div>
  )
}
