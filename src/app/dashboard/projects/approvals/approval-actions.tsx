
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
    <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
      <Link href={`/dashboard/projects/${projectId}`} className="w-full sm:w-auto">
        <Button variant="outline" className="w-full">
            <Eye className="mr-2 h-4 w-4" />
            View
        </Button>
      </Link>
      <Button onClick={onApprove} disabled={!!isLoading}>
        {isLoading === "approve" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
        Approve
      </Button>
      <Button variant="destructive" onClick={onReject} disabled={!!isLoading}>
        {isLoading === "reject" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
        Reject
      </Button>
    </div>
  )
}
