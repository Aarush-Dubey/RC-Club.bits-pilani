
"use client"

import { useState } from 'react';
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Package,
  History,
  Undo2,
  Loader2,
  Send,
  PackageOpen,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { initiateReturn } from '@/app/dashboard/actions';

type MyInventoryProps = {
  data: {
    items: any[]
    inventoryItemDetails: Record<string, any>
    projectDetails: Record<string, any>
  }
  onReturn: () => void;
}

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'pending': return { color: 'text-yellow-600 dark:text-yellow-400', icon: History, label: 'Pending Approval' };
        case 'fulfilled': return { color: 'text-blue-600 dark:text-blue-400', icon: PackageOpen, label: 'On Loan' };
        case 'pending_return': return { color: 'text-orange-600 dark:text-orange-400', icon: Undo2, label: 'Pending Return' };
        default: return { color: 'text-gray-500', icon: Package, label: 'Unknown' };
    }
}

export function MyInventory({ data, onReturn }: MyInventoryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingReturn, setLoadingReturn] = useState<string | null>(null);
  
  const handleReturn = async (requestId: string) => {
    if (!user) return;
    setLoadingReturn(requestId);
    try {
        await initiateReturn(requestId, user.uid);
        toast({ title: 'Return Initiated', description: 'Your item is now marked as pending return.' });
        onReturn();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to Initiate Return', description: (error as Error).message });
    } finally {
        setLoadingReturn(null);
    }
  }

  const hasItems = data.items.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Checked-Out Inventory</CardTitle>
        <CardDescription>
          A list of all items you have requested or currently have on loan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasItems ? (
          <ul className="space-y-3">
            {data.items.map((item) => {
              const itemDetails = data.inventoryItemDetails[item.itemId];
              if (!itemDetails) return null;

              const projectDetails = data.projectDetails[item.projectId];
              const { color, icon: Icon, label } = getStatusConfig(item.status);
              const isReturnable = item.status === 'fulfilled' && !itemDetails.isPerishable;
              
              return (
                <li
                  key={item.requestId}
                  className="flex items-center justify-between gap-4 p-2 rounded-md hover:bg-secondary"
                >
                  <div className="flex items-center gap-3">
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                               <Icon className={cn("h-4 w-4", color)} />
                            </TooltipTrigger>
                            <TooltipContent>{label}</TooltipContent>
                        </Tooltip>
                     </TooltipProvider>
                    <div>
                      <p className="font-medium">
                        {itemDetails.name} (x{item.quantity})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {projectDetails ? `Project: ${projectDetails.title}` : 'General Use'}
                      </p>
                    </div>
                  </div>
                  {isReturnable && (
                    <Button variant="ghost" size="sm" onClick={() => handleReturn(item.requestId)} disabled={loadingReturn === item.requestId}>
                        {loadingReturn === item.requestId ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-3 w-3" />
                        )}
                      Return
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground border-2 border-dashed py-8">
            <Package className="h-8 w-8" />
            <p className="font-medium">No Items Checked Out</p>
            <p className="text-sm max-w-xs">You have no pending or fulfilled inventory requests.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
