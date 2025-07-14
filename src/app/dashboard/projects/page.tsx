import Image from "next/image"
import { PlusCircle } from "lucide-react"

import { projects, users } from "@/lib/data"
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
import { Progress } from "@/components/ui/progress"

function getStatusColor(status: string) {
  switch (status) {
    case 'In Progress':
      return 'bg-blue-500'
    case 'Completed':
      return 'bg-green-500'
    case 'Planning':
      return 'bg-yellow-500'
    case 'On Hold':
      return 'bg-gray-500'
    default:
      return 'bg-gray-200'
  }
}

export default function ProjectsPage() {
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
        {projects.map((project) => {
          const projectLead = users.find((u) => u.id === project.leadId)
          const progress = (project.spent / project.budget) * 100

          return (
            <Card key={project.id} className="overflow-hidden flex flex-col">
              <CardHeader className="p-0">
                <Image
                  src={project.imageUrl}
                  alt={project.name}
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover"
                  data-ai-hint={project.dataAiHint}
                />
                 <div className="p-6">
                    <Badge className={`${getStatusColor(project.status)} text-white mb-2`}>{project.status}</Badge>
                    <CardTitle className="font-headline text-xl">{project.name}</CardTitle>
                    <CardDescription className="mt-1">{project.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Budget</span>
                  <span>${project.spent.toFixed(2)} / ${project.budget.toFixed(2)}</span>
                </div>
                <Progress value={progress} aria-label={`${progress.toFixed(0)}% of budget spent`} />
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="flex -space-x-2">
                  {project.members.map((memberId) => {
                    const member = users.find((u) => u.id === memberId)
                    return (
                      <Avatar key={memberId} className="border-2 border-card">
                        <AvatarImage src={member?.avatar} />
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
