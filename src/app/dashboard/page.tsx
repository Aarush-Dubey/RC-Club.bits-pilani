
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { getDashboardData } from './actions'
import { OverviewMetrics } from '@/components/dashboard/overview-metrics'
import { ApprovalQueue } from '@/components/dashboard/approval-queue'
import { ActionItems } from '@/components/dashboard/action-items'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { Skeleton } from '@/components/ui/skeleton'

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>

const DashboardSkeleton = () => (
  <div className="space-y-8">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Skeleton className="h-96" />
      </div>
      <div>
        <Skeleton className="h-96" />
      </div>
    </div>
  </div>
)

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const dashboardData = await getDashboardData(user)
        setData(dashboardData)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, authLoading])

  if (loading || authLoading) {
    return <DashboardSkeleton />
  }

  if (!data) {
    return (
      <div className="text-center text-muted-foreground">
        Could not load dashboard data.
      </div>
    )
  }

  const canViewApprovals =
    user?.permissions?.canApproveProjects ||
    user?.permissions?.canApproveNewItemRequest ||
    user?.permissions?.canApproveReimbursements

  return (
    <div className="space-y-8">
      <OverviewMetrics metrics={data.overviewMetrics} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
           <ActionItems data={data.actionItems} inventoryItems={data.inventoryItems} />
           <ActivityFeed feed={data.activityFeed} users={data.users} inventoryItems={data.inventoryItems} />
        </div>

        <div className="flex flex-col gap-8">
           {canViewApprovals && <ApprovalQueue queues={data.approvalQueues} />}
        </div>
      </div>
    </div>
  )
}
