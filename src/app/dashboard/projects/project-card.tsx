
import Link from "next/link"
import Image from "next/image"
import type { AppUser } from "@/context/auth-context"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
    [key: string]: any;
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
      return <Badge variant="outline">{status.replace('_', ' ')}</Badge>
  }
}

export const ProjectCard = ({ project, users, currentUser }: { project: Project; users: User[]; currentUser: AppUser | null }) => {
  const projectLead = users.find((u: any) => u.id === project.leadId)
  const canManage = currentUser?.permissions?.canApproveProjects;

  return (
      <div key={project.id} className="group flex flex-col">
        <Link href={`/dashboard/projects/${project.id}`}>
          <div className="relative w-full h-48 mb-4 overflow-hidden rounded-md">
              <Image
                src={`https://placehold.co/600x400.png`}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint="rc project"
              />
          </div>
        </Link>
          {getStatusBadge(project.status)}
          <h3 className="font-headline text-xl mt-2 group-hover:text-primary transition-colors">{project.title}</h3>
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2 flex-grow">{project.description}</p>
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
          <div className="flex items-center gap-2 mt-4">
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
