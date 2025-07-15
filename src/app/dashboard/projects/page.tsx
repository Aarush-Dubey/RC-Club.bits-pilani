
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { collection, getDocs, query, where } from "firebase/firestore"
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

async function getData(currentUser: AppUser | null) {
  if (!currentUser) return { myProjects: [], allUsers: [], inventory: [] };

  // Fetch projects the current user is a member of
  const myProjectsQuery = query(
    collection(db, "projects"),
    where("memberIds", "array-contains", currentUser.uid)
  );
  const myProjectsSnapshot = await getDocs(myProjectsQuery);
  const myProjects = myProjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];

  // Fetch ALL users so they can be added to new projects
  const allUsersSnapshot = await getDocs(collection(db, "users"));
  const allUsers = allUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];

  // Fetch all inventory items for the new project form
  const inventorySnapshot = await getDocs(collection(db, "inventory_items"));
  const inventory = inventorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryItem[];

  return { myProjects, allUsers, inventory };
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
  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { myProjects, allUsers, inventory } = await getData(currentUser);
      setMyProjects(myProjects);
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
            <h2 className="text-3xl font-bold tracking-tight font-headline">My Projects</h2>
            <p className="text-muted-foreground">
              Track and manage all RC projects you are a part of.
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
              {myProjects.length > 0 ? (
                <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                  {myProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} users={allUsers} currentUser={currentUser}/>
                  ))}
                </div>
              ) : (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                  <CardHeader>
                    <CardTitle>No Projects Yet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">You haven't joined or created any projects.</p>
                     <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Propose Your First Project
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

    