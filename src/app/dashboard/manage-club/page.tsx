
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ShieldCheck, ArrowRight } from 'lucide-react';

export default function ManageClubPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">Manage Club</h2>
        <p className="text-muted-foreground">
          Administer users, roles, and permissions for the club.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View all members and manage their roles.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Assign roles like Admin, Coordinator, or Member to users, controlling their access level within the app.
            </p>
            <Link href="/dashboard/manage-club/users">
              <Button variant="outline">
                Manage Users <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>Define what each role can see and do.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create new roles or modify permissions for existing ones to fine-tune your club's operational security.
            </p>
            <Button variant="outline" disabled>
              Manage Roles <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
