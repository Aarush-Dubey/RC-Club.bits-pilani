
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, X, Loader2, Eye } from "lucide-react"

import { approveProject, rejectProject } from "../[id]/actions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

export function ApprovalActions({ projectId }: { projectId: string }) {
  const [isLoading, setIsLoading] = useState<"approve" | "reject" | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleAction = async (action: () => Promise<void>, type: "approve" | "reject") => {
    setIsLoading(type)
    try {
      await action()
      toast({
        title: `Project ${type === "approve" ? "Approved" : "Rejected"}`,
        description: `The project has been successfully ${type === "approve" ? "approved" : "rejected"}.`,
      })
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: (error as Error).message,
      })
    } finally {
      setIsLoading(null)
    }
  }

  const onApprove = () => handleAction(() => approveProject(projectId), "approve")
  const onReject = () => handleAction(() => rejectProject(projectId), "reject")

  return (
    <div className="flex w-full sm:w-auto items-center gap-2">
      <Link href={`/dashboard/projects/${projectId}`} passHref>
         <Button variant="outline" size="icon">
            <Eye className="h-4 w-4" />
            <span className="sr-only">View Project</span>
        </Button>
      </Link>
      <Button onClick={onApprove} disabled={!!isLoading} size="icon">
        {isLoading === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
         <span className="sr-only">Approve</span>
      </Button>
      <Button variant="destructive" onClick={onReject} disabled={!!isLoading} size="icon">
        {isLoading === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
         <span className="sr-only">Reject</span>
      </Button>
    </div>
  )
}
