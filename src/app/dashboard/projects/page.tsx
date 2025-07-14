import Image from "next/image"
import { PlusCircle } from "lucide-react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-blue-500'
    case 'completed':
      return 'bg-green-500'
    case 'approved':
      return 'bg-yellow-500'
    case 'pending_approval':
      return 'bg-gray-500'
    default:
      return 'bg-gray-200'
  }
}

async function getData() {
    const projectsSnapshot = await getDocs(collection(db, "projects"));
    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { projects, users };
}

export default async function ProjectsPage() {
    const { projects, users } = await getData();
  
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Projects</h2>
          <p className="text-muted-foreground">
            Track and manage all RC projects in the club.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project: any) => {
          const projectLead = users.find((u: any) => u.id === project.teamLeadId)

          return (
            <Card key={project.id} className="overflow-hidden flex flex-col">
              <CardHeader className="p-0">
                <Image
                  src={`https://placehold.co/600x400.png`}
                  alt={project.title}
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover"
                  data-ai-hint="rc project"
                />
                 <div className="p-6">
                    <Badge className={`${getStatusColor(project.status)} text-white mb-2`}>{project.status.replace('_', ' ')}</Badge>
                    <CardTitle className="font-headline text-xl">{project.title}</CardTitle>
                    <CardDescription className="mt-1">{project.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="flex -space-x-2">
                  {project.memberIds.map((memberId: string) => {
                    const member: any = users.find((u: any) => u.id === memberId)
                    return (
                      <Avatar key={memberId} className="border-2 border-card">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${member?.email}`} />
                        <AvatarFallback>{member?.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )
                  })}
                </div>
                {projectLead && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Lead: </span>
                    <span className="font-semibold">{projectLead.name}</span>
                  </div>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
