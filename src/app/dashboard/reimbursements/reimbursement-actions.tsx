
"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { approveReimbursement, rejectReimbursement, markAsPaid } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Check, X, Loader2, HandCoins } from "lucide-react"

export function ReimbursementActions({ request, onActionComplete }: { request: any, onActionComplete: () => void }) {
  const [isLoading, setIsLoading] = useState<"approve" | "reject" | "pay" | null>(null)
  const { toast } = useToast()
  const { user: currentUser } = useAuth();

  const handleAction = async (actionFn: () => Promise<void>, type: "approve" | "reject" | "pay") => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }

    setIsLoading(type);
    try {
      await actionFn();
      toast({
        title: `Request ${type === "approve" ? "Approved" : type === "reject" ? "Rejected" : "Paid"}`,
      });
      onActionComplete();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(null);
    }
  }

  const onApprove = () => handleAction(() => approveReimbursement(request.id, currentUser!.uid), "approve");
  const onReject = () => handleAction(() => rejectReimbursement(request.id, currentUser!.uid), "reject");
  const onPay = () => handleAction(() => markAsPaid(request.id, currentUser!.uid), "pay");

  if (request.status === 'pending') {
    return (
      <div className="flex w-full justify-end gap-2">
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!!isLoading} size="sm">
                    {isLoading === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">Reject</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to reject this request?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onReject} className="bg-destructive hover:bg-destructive/90">Confirm Rejection</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Button onClick={onApprove} disabled={!!isLoading} size="sm">
          {isLoading === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">Approve</span>
        </Button>
      </div>
    )
  }
  
  if (request.status === 'approved') {
     return (
        <div className="flex w-full justify-end">
            <Button onClick={onPay} disabled={!!isLoading} size="sm">
                {isLoading === "pay" ? <Loader2 className="h-4 w-4 animate-spin" /> : <HandCoins className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Mark as Paid</span>
            </Button>
        </div>
    )
  }

  return null
}
