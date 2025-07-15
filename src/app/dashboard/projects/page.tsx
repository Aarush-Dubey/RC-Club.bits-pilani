
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { PlusCircle } from "lucide-react"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth, type AppUser } from "@/context/auth-context"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription as DialogDescriptionComponent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { NewProjectForm } from "./new-project-form"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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

async function getData(currentUser: any) {
    if (!currentUser) return { myProjects: [], approvalRequests: [], users: [], inventory: [] };
    
    // My Projects Query
    const myProjectsQuery = query(
        collection(db, "projects"), 
        where("memberIds", "array-contains", currentUser.uid)
    );
    const myProjectsSnapshot = await getDocs(myProjectsQuery);
    const myProjects = myProjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];

    // Approval Requests Query
    let approvalRequests: Project[] = [];
    if (currentUser.permissions?.canApproveProjects) {
        const approvalRequestsQuery = query(
            collection(db, "projects"), 
            where("status", "==", "pending_approval"), 
            orderBy("createdAt", "desc")
        );
        const approvalRequestsSnapshot = await getDocs(approvalRequestsQuery);
        approvalRequests = approvalRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];
    }

    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];

    const inventorySnapshot = await getDocs(collection(db, "inventory_items"));
    const inventory = inventorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryItem[];

    return { myProjects, approvalRequests, users, inventory };
}

const ProjectCard = ({ project, users, currentUser }: { project: Project; users: User[]; currentUser: AppUser | null }) => {
  const projectLead = users.find((u: any) => u.id === project.leadId)
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'coordinator'

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
          {canManage && (
            <Link href={`/dashboard/projects/${project.id}`} className="mt-4">
              <Button variant="outline" className="w-full">
                Manage Project
              </Button>
            </Link>
          )}
      </div>
  )
}

const ProjectListSkeleton = () => (
  <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(3)].map((_, i) => (
      <div key={i}>
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-5 w-1/4 mb-2" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
  </div>
);


export default function ProjectsPage() {
  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [approvalRequests, setApprovalRequests] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { myProjects, approvalRequests, users, inventory } = await getData(currentUser);
      setMyProjects(myProjects);
      setApprovalRequests(approvalRequests);
      setUsers(users);
      setInventory(inventory);
    } catch(err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);
  
  const handleFormSubmit = () => {
    fetchData();
    setIsFormOpen(false);
  }
  
  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Projects</h2>
            <p className="text-muted-foreground">
              Track and manage all RC projects in the club.
            </p>
          </div>
          <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> New Project
              </Button>
            </DialogTrigger>
        </div>

        {loading ? (
          <ProjectListSkeleton />
        ) : (
          <>
            {currentUser?.permissions?.canApproveProjects && approvalRequests.length > 0 && (
              <div className="space-y-6">
                  <div>
                      <h3 className="text-2xl font-headline font-semibold">Approval Requests</h3>
                      <p className="text-muted-foreground">Projects waiting for your review.</p>
                  </div>
                  <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                      {approvalRequests.map((project) => (
                          <ProjectCard key={project.id} project={project} users={users} currentUser={currentUser} />
                      ))}
                  </div>
                <Separator className="my-12" />
              </div>
            )}

            <div className="space-y-6">
              <div>
                  <h3 className="text-2xl font-headline font-semibold">My Projects</h3>
                  <p className="text-muted-foreground">Projects you are a member of.</p>
              </div>
                {myProjects.length > 0 ? (
                  <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                    {myProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} users={users} currentUser={currentUser}/>
                    ))}
                  </div>
                ) : (
                  <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <CardHeader>
                      <CardTitle>No Projects Yet</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">You haven't joined or created any projects.</p>
                      <DialogTrigger asChild>
                          <Button variant="outline">
                            <PlusCircle className="mr-2 h-4 w-4" /> Propose Your First Project
                          </Button>
                        </DialogTrigger>
                    </CardContent>
                  </Card>
                )}
            </div>
          </>
        )}
      </div>
      <DialogContent className="sm:max-w-3xl h-screen sm:h-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">Propose a New Project</DialogTitle>
          <DialogDescriptionComponent>Fill out the details below to submit your project idea for approval.</DialogDescriptionComponent>
        </DialogHeader>
        <NewProjectForm onFormSubmit={handleFormSubmit} users={users} inventory={inventory} />
      </DialogContent>
    </Dialog>
  )
}
