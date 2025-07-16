
import Link from 'next/link';
import { getRolesAndPermissions } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Helper to format permission keys into readable text
const formatPermissionName = (name: string) => {
    return name
        .replace(/([A-Z])/g, ' $1') // insert a space before all caps
        .replace(/^./, (str) => str.toUpperCase()); // uppercase the first character
};


export default async function ManageRolesPage() {
  const roles = await getRolesAndPermissions();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/manage-club">
            <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
            </Button>
        </Link>
        <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Roles & Permissions</h2>
            <p className="text-muted-foreground">
              A detailed view of all roles and their granted permissions.
            </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Existing Roles</CardTitle>
          <CardDescription>Click on a role to see its specific permissions.</CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {roles.map(role => (
                    <AccordionItem key={role.id} value={role.id}>
                        <AccordionTrigger className="text-lg capitalize font-medium">
                            {role.id.replace(/_/g, ' ')}
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 pt-2">
                                {role.permissions.map(permission => (
                                    <div key={permission} className="flex items-center gap-2 text-sm">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>{formatPermissionName(permission)}</span>
                                    </div>
                                ))}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
