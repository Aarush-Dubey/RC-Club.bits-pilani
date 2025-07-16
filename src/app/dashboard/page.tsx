
'use client'

import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { user } = useAuth()

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
      
      <Card>
        <CardHeader>
            <CardTitle>Dashboard V2</CardTitle>
            <CardDescription>
                This space is being redesigned. Use the sidebar to navigate to other sections.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p>Future dashboard widgets will appear here.</p>
        </CardContent>
      </Card>

    </div>
  )
}
