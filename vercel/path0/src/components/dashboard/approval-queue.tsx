/**
 * This file defines the ApprovalQueue component, which serves as a centralized
 * hub on the dashboard for managers to see items awaiting their review. It displays
 * counts for pending projects, procurement requests, and reimbursements, with
 * links to the respective management pages.
 */
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, HandCoins, ToyBrick, Truck } from 'lucide-react'

type ApprovalQueueProps = {
  queues: {
    projects: number
    procurement: number
    reimbursements: number
  }
}

export function ApprovalQueue({ queues }: ApprovalQueueProps) {
  const totalApprovals =
    queues.projects + queues.procurement + queues.reimbursements

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Queue</CardTitle>
        <CardDescription>
          {totalApprovals > 0
            ? `There are ${totalApprovals} items waiting for your review.`
            : 'The approval queue is empty.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          <li className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ToyBrick className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Projects</span>
            </div>
            <Link href="/dashboard/projects/approvals">
              <Button variant="ghost" size="sm" disabled={queues.projects === 0}>
                {queues.projects}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </li>
          <li className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Procurement</span>
            </div>
            <Link href="/dashboard/procurement/approvals">
              <Button variant="ghost" size="sm" disabled={queues.procurement === 0}>
                {queues.procurement}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </li>
          <li className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HandCoins className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Reimbursements</span>
            </div>
             <Link href="/dashboard/reimbursements">
                <Button variant="ghost" size="sm" disabled={queues.reimbursements === 0}>
                    {queues.reimbursements}
                     <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
             </Link>
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}

