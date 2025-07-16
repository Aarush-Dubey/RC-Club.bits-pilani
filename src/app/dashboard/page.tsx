
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { getPendingProjectApprovals } from './actions'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Project, User } from './projects/project-card'
import { ArrowRight } from 'lucide-react'

type DashboardData = {
    approvalRequests: Project[],
    users: Record<string, User>
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

  const canApproveProjects = user?.permissions?.canApproveProjects;

  useEffect(() => {
    if (authLoading) return;
    if (!user || !canApproveProjects) {
        setLoading(false);
        return;
    }

    const fetchData = async () => {
        setLoading(true);
        try {
            const approvalData = await getPendingProjectApprovals();
            setData(approvalData);
        } catch (error) {
            console.error("Failed to fetch pending approvals:", error);
            setData({ approvalRequests: [], users: {} });
        } finally {
            setLoading(false);
        }
    };
    
    fetchData();

  }, [user, authLoading, canApproveProjects]);


  return (
    <div className="space-y-8">
       <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          Welcome, {user?.displayName || 'Club Member'}!
        </h2>
        <p className="text-muted-foreground">
          Here's a quick overview of what's happening in the club.
        </p>
      </div>
      
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
                         <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                            <h3 className="text-xl font-semibold">All Clear!</h3>
                            <p>There are no projects waiting for approval.</p>
                        </div>
                      )
                  )}
              </CardContent>
          </Card>
      )}

    </div>
  )
}
