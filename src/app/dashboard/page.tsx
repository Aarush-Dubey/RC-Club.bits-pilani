
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { getPendingProjectApprovals } from './actions'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Project, User } from './projects/project-card'
import { ArrowRight, PackageCheck } from 'lucide-react'
import { ActionItems } from '@/components/dashboard/action-items'

type DashboardData = {
    approvalRequests: Project[],
    users: Record<string, User>,
    actionItems: {
        itemsOnLoan: any[],
        reimbursements: any[]
    },
    inventoryItems: Record<string, any>
}

const ApprovalListSkeleton = () => (
    <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
            <Card key={i}>
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                </CardContent>
            </Card>
        ))}
    </div>
);


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const canApproveProjects = user?.permissions?.canApproveProjects && user?.role !== 'coordinator';
  
  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
        setLoading(true);
        try {
            const approvalData = await getPendingProjectApprovals(user.uid);
            setData(approvalData);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            setData(null);
        } finally {
            setLoading(false);
        }
    };
    
    fetchData();

  }, [user, authLoading]);


  return (
    <div className="space-y-8">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            Welcome, {user?.displayName || 'Club Member'}!
          </h2>
          <p className="text-muted-foreground">
            Here's a quick overview of what's happening in the club.
          </p>
        </div>
        {user?.role === 'coordinator' && (
            <Link href="/dashboard/manage-club">
                <Button>Manage Club</Button>
            </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="flex flex-col gap-8 lg:col-span-2">
            {loading ? (
                <Card>
                    <CardHeader><Skeleton className='h-8 w-1/3' /></CardHeader>
                    <CardContent className='space-y-4'>
                        <Skeleton className='h-12 w-full' />
                        <Skeleton className='h-12 w-full' />
                    </CardContent>
                </Card>
            ) : data && <ActionItems data={data.actionItems} inventoryItems={data.inventoryItems} />}
        </div>
        <div className="flex flex-col gap-8">
            {canApproveProjects && (
              <Card>
                  <CardHeader>
                      <CardTitle>Pending Project Approvals</CardTitle>
                      <CardDescription>
                          The following projects are waiting for your review.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      {loading ? <ApprovalListSkeleton /> : (
                          data && data.approvalRequests.length > 0 ? (
                              <div className="space-y-4">
                                {data.approvalRequests.map((project) => (
                                  <Card key={project.id}>
                                        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="font-semibold font-headline text-lg">{project.title}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                                            </div>
                                            <Link href={`/dashboard/projects/${project.id}`}>
                                                <Button variant="outline">
                                                    Review <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </CardContent>
                                  </Card>
                                ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg flex flex-col items-center gap-2">
                                <PackageCheck className="h-10 w-10 text-green-500" />
                                <h3 className="text-xl font-semibold">All Clear!</h3>
                                <p>There are no projects waiting for approval.</p>
                            </div>
                          )
                      )}
                  </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  )
}
