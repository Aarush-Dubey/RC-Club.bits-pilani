
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Loader2, Sparkles } from "lucide-react"
import { useAuth } from "@/context/auth-context"

import { approveNewItemRequest, rejectNewItemRequest } from "../../actions"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { enhanceRejectionReason } from "@/ai/flows/enhance-rejection-reason"


export function BucketItemActions({ requestId, itemName }: { requestId: string, itemName: string }) {
  const [isLoading, setIsLoading] = useState<"approve" | "reject" | null>(null)
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const router = useRouter()
  const { toast } = useToast()
  const { user: currentUser } = useAuth();

  const handleAction = async (actionFn: () => Promise<void>, type: "approve" | "reject") => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }

    if (type === 'reject' && !rejectionReason) {
      toast({ variant: "destructive", title: "Reason Required", description: "Please provide a reason for rejection."});
      return;
    }

    setIsLoading(type);
    try {
      await actionFn();
      toast({
        title: `Request ${type === "approve" ? "Approved" : "Rejected"}`,
      });
      // No need to call router.refresh() here as onSnapshot will handle it
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

  const handleEnhanceReason = async () => {
    if (!rejectionReason) {
      toast({ variant: "destructive", title: "Cannot Enhance", description: "Please provide a basic reason first." });
      return;
    }
    setIsEnhancing(true);
    try {
      const result = await enhanceRejectionReason({ itemName, reason: rejectionReason });
      setRejectionReason(result.enhancedReason);
      toast({ title: "Reason Enhanced", description: "The rejection reason has been updated with AI." });
    } catch (error) {
      console.error("Error enhancing reason:", error);
      toast({ variant: "destructive", title: "Enhancement Failed", description: "Could not enhance the reason." });
    } finally {
      setIsEnhancing(false);
    }
  };

  const onApprove = () => handleAction(() => approveNewItemRequest(requestId, currentUser!.uid), "approve");
  const onReject = () => handleAction(() => rejectNewItemRequest(requestId, currentUser!.uid, rejectionReason), "reject");

  return (
    <div className="flex items-center gap-2">
      <Button onClick={onApprove} disabled={!!isLoading} size="icon" variant="outline">
        {isLoading === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
         <span className="sr-only">Approve</span>
      </Button>

       <AlertDialog>
        <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={!!isLoading} size="icon">
                {isLoading === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                <span className="sr-only">Reject</span>
            </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to reject this request?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Please provide a reason for the rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
               <Button type="button" variant="ghost" size="sm" onClick={handleEnhanceReason} disabled={isEnhancing || isLoading === 'reject'}>
                  {isEnhancing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Enhance
              </Button>
            </div>
            <Textarea 
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Duplicate request, item not needed, etc."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={onReject}
              disabled={!rejectionReason || isEnhancing}
            >
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
