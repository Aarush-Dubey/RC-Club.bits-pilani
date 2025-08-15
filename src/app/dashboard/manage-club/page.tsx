import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";

export default function ManageClubPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
          <Link href="/dashboard">
              <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
              </Button>
          </Link>
        <div>
          <h1 className="text-h1">Manage Club</h1>
          <p className="text-base text-muted-foreground mt-2">
            Administrative tools for managing users and system permissions.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-start gap-4">
                <div className="bg-secondary p-3">
                    <Users className="h-6 w-6 text-foreground" />
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
                <div className="bg-secondary p-3">
                    <ShieldCheck className="h-6 w-6 text-foreground" />
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
            <Link href="/dashboard/manage-club/roles" className="w-full">
                <Button className="w-full">
                Manage Permissions <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
