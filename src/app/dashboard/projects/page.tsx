
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { PlusCircle, MoreVertical } from "lucide-react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription as DialogDescriptionComponent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { NewProjectForm } from "./new-project-form"
import { cn } from "@/lib/utils"

export type Project = {
  id: string
  title: string
  description: string
  status: 'pending_approval' | 'approved' | 'active' | 'completed' | 'closed'
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
    default:
      return <Badge variant="outline">{status.replace('_', ' ')}</Badge>
  }
}

async function getData() {
    const projectsQuery = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const projectsSnapshot = await getDocs(projectsQuery);
    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];

    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];

    const inventorySnapshot = await getDocs(collection(db, "inventory_items"));
    const inventory = inventorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryItem[];

    return { projects, users, inventory };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { projects, users, inventory } = await getData();
    setProjects(projects);
    setUsers(users);
    setInventory(inventory);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const handleFormSubmit = () => {
    fetchData();
    setIsFormOpen(false);
  }

  const currentUser = { role: 'coordinator' };

  const getAvailableActions = (status: Project['status']) => {
    const actions: string[] = [];
    if (currentUser.role === 'coordinator' || currentUser.role === 'core') {
      if (status === 'pending_approval') actions.push('Approve', 'Reject');
    }
    if (status === 'approved') actions.push('Start Project');
    if (status === 'active') actions.push('Post Update');
    if (status === 'completed') {
       if (currentUser.role === 'admin' || currentUser.role === 'core') actions.push('Close Project');
    } else {
       if (status !== 'closed') actions.push('Mark as Completed');
    }
    return actions;
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Projects</h2>
          <p className="text-muted-foreground">
            Track and manage all RC projects in the club.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl h-screen sm:h-auto overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline">Propose a New Project</DialogTitle>
              <DialogDescriptionComponent>Fill out the details below to submit your project idea for approval.</DialogDescriptionComponent>
            </DialogHeader>
            <NewProjectForm onFormSubmit={handleFormSubmit} users={users} inventory={inventory} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project: any) => {
          const projectLead = users.find((u: any) => u.id === project.leadId)
          const actions = getAvailableActions(project.status);

          return (
            <div key={project.id} className="group">
                <div className="relative w-full h-48 mb-4">
                  <Image
                    src={`https://placehold.co/600x400.png`}
                    alt={project.title}
                    fill
                    className="object-cover"
                    data-ai-hint="rc project"
                  />
                </div>
                {getStatusBadge(project.status)}
                <h3 className="font-headline text-xl mt-2 group-hover:text-primary transition-colors">{project.title}</h3>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{project.description}</p>
                <div className="flex items-center gap-4 mt-4">
                     <div className="flex -space-x-2">
                        {project.memberIds.map((memberId: string) => {
                            const member: any = users.find((u: any) => u.id === memberId)
                            return (
                            <Avatar key={memberId} className="border-2 border-card h-8 w-8">
                                <AvatarImage src={`https://i.pravatar.cc/150?u=${member?.email}`} />
                                <AvatarFallback>{member?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            )
                        })}
                    </div>
                    {projectLead && (
                    <div className="text-sm">
                        <span className="font-semibold">{projectLead.name}</span>
                        <span className="text-muted-foreground">, Lead</span>
                    </div>
                    )}
                </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
