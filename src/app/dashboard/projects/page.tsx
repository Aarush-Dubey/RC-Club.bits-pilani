
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth, type AppUser } from "@/context/auth-context"

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ProjectCard, type Project, type User, type InventoryItem } from "./project-card"
import { TooltipProvider } from "@/components/ui/tooltip"

async function getData() {
  // Fetch all projects
  const projectsQuery = query(collection(db, "projects"), orderBy("createdAt", "desc"));
  const projectsSnapshot = await getDocs(projectsQuery);
  const allProjects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];

  // Define the sort order for statuses
  const statusOrder = {
      'active': 1,
      'approved': 1,
      'pending_return': 1,
      'pending_approval': 2,
      'completed': 3,
      'closed': 4,
      'rejected': 5,
  };

  // Sort projects based on status, then by creation date
  allProjects.sort((a, b) => {
    const orderA = statusOrder[a.status as keyof typeof statusOrder] || 99;
    const orderB = statusOrder[b.status as keyof typeof statusOrder] || 99;
    if (orderA !== orderB) {
        return orderA - orderB;
    }
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : 0;
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : 0;
    // @ts-ignore
    return dateB - dateA;
  });

  // Fetch ALL users so they can be added to new projects
  const allUsersSnapshot = await getDocs(collection(db, "users"));
  const allUsers = allUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];

  // Fetch all inventory items for the new project form
  const inventorySnapshot = await getDocs(collection(db, "inventory_items"));
  const inventory = inventorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryItem[];

  return { allProjects, allUsers, inventory };
}


const ProjectListSkeleton = () => (
  <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(3)].map((_, i) => (
      <div key={i}>
        <Skeleton className="h-6 w-1/4 mb-2" />
        <Skeleton className="h-7 w-3/4 mb-2" />
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
  </div>
);


export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { allProjects, allUsers, inventory } = await getData();
      setProjects(allProjects);
      setAllUsers(allUsers);
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
                Browse and manage all projects in the club.
              </p>
            </div>
            <div className="flex gap-2">
              {currentUser?.permissions?.canApproveProjects && (
                <Link href="/dashboard/projects/approvals">
                  <Button variant="outline">Manage Approvals</Button>
                </Link>
              )}
              <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> New Project
                </Button>
              </DialogTrigger>
            </div>
          </div>

          {loading ? (
            <ProjectListSkeleton />
          ) : (
            <div className="space-y-6">
                {projects.length > 0 ? (
                  <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                      <ProjectCard key={project.id} project={project} users={allUsers} currentUser={currentUser}/>
                    ))}
                  </div>
                ) : (
                  <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <CardHeader>
                      <CardTitle>No Projects Yet</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">There are no projects in the club yet. Be the first to create one!</p>
                      <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Propose a Project
                      </Button>
                    </CardContent>
                  </Card>
                )}
            </div>
          )}
        </div>
      <DialogContent className="sm:max-w-3xl h-screen sm:h-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">Propose a New Project</DialogTitle>
          <DialogDescriptionComponent>Fill out the details below to submit your project idea for approval.</DialogDescriptionComponent>
        </DialogHeader>
        <NewProjectForm onFormSubmit={handleFormSubmit} users={allUsers} inventory={inventory} currentUser={currentUser} />
      </DialogContent>
    </Dialog>
  )
}
