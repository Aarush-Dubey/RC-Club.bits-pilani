
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, ShieldCheck, ArrowRight } from "lucide-react";

export default function ManageClubPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">Manage Club</h2>
        <p className="text-muted-foreground">
          Administrative tools for managing users and system permissions.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View all club members and manage their roles.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">
                Assign roles such as Admin, Coordinator, or Member to users, controlling their access level within the app.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/manage-club/users" className="w-full">
              <Button className="w-full">
                Manage Users <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
             <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>Roles & Permissions</CardTitle>
                    <CardDescription>Define roles and their specific permissions.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
             <p className="text-sm text-muted-foreground">
                Create new roles or modify the permissions for existing ones to fine-tune access control across the application.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled>
              Manage Permissions (Coming Soon)
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
