
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  CheckCircle,
  HandCoins,
  ShoppingCart,
  ToyBrick,
  Users,
} from 'lucide-react'

type OverviewMetricsProps = {
  metrics: {
    activeProjects: number
    totalProjects: number
    itemsOnLoan: number
    overdueItems: number
    pendingReimbursements: number
    roomStatus: {
      occupied: boolean
      user: string
      since: string
    }
  }
}

export function OverviewMetrics({ metrics }: OverviewMetricsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <ToyBrick className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activeProjects}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.totalProjects} total projects
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Items on Loan</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.itemsOnLoan}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.overdueItems} items overdue
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Reimbursements
          </CardTitle>
          <HandCoins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.pendingReimbursements}
          </div>
          <p className="text-xs text-muted-foreground">
            Awaiting treasurer review
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Room Status</CardTitle>
          {metrics.roomStatus.occupied ? (
            <Users className="h-4 w-4 text-muted-foreground" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">
            {metrics.roomStatus.occupied
              ? `Occupied by ${metrics.roomStatus.user}`
              : 'Available'}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.roomStatus.occupied
              ? `Since ${metrics.roomStatus.since}`
              : 'Ready for use'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
