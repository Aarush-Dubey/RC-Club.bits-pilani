/**
 * This file defines the ActionItems component, which displays a personalized
 * list of tasks and notifications for the logged-in user on their dashboard.
 * It includes active projects they are a part of and pending reimbursement
 * requests, providing quick links to the relevant pages.
 */
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ArrowRight,
  HandCoins,
  ToyBrick,
} from 'lucide-react'
import { Button } from '../ui/button'

type ActionItemsProps = {
  data: {
    myActiveProjects: any[]
    reimbursements: any[]
  }
}

export function ActionItems({ data }: ActionItemsProps) {
  const hasActiveProjects = data.myActiveProjects.length > 0
  const hasPendingReimbursements = data.reimbursements.length > 0
  const hasActions = hasActiveProjects || hasPendingReimbursements
  const totalTasks = data.myActiveProjects.length + data.reimbursements.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            My Tasks
            {totalTasks > 0 && <span className="text-xs font-medium bg-primary text-primary-foreground h-5 w-5 flex items-center justify-center rounded-full">{totalTasks}</span>}
        </CardTitle>
        <CardDescription>
          A checklist of items that require your attention.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasActions ? (
          <ul className="space-y-3">
            {data.myActiveProjects.map((project) => (
              <li
                key={project.id}
                className="flex items-center justify-between gap-4 p-2 rounded-md hover:bg-secondary"
              >
                <div className="flex items-center gap-3">
                  <ToyBrick className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {project.title}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      Status: {project.status.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <Link href={`/dashboard/projects/${project.id}`}>
                  <Button variant="ghost" size="sm">
                    View <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </li>
            ))}
            {data.reimbursements.map((req) => (
              <li
                key={req.id}
                className="flex items-center justify-between gap-4 p-2 rounded-md hover:bg-secondary"
              >
                <div className="flex items-center gap-3">
                  <HandCoins className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      Reimbursement:{' '}
                      <span className="font-mono">₹{req.amount.toFixed(2)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      Status: {req.status}
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/reimbursements">
                  <Button variant="ghost" size="sm">
                    Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            <p>You have no pending action items.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

