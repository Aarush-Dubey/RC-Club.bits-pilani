
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRolesAndPermissions } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Loader2, X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Helper to format permission keys into readable text
const formatPermissionName = (name: string) => {
    return name
        .replace(/([A-Z])/g, ' $1') // insert a space before all caps
        .replace(/^./, (str) => str.toUpperCase()); // uppercase the first character
};

interface Role {
  id: string;
  permissions: string[];
}

const PermissionToggleButton = ({ permission, isEnabled: initialIsEnabled }: { permission: string, isEnabled: boolean }) => {
    const [isEnabled, setIsEnabled] = useState(initialIsEnabled);

    const handleClick = () => {
        setIsEnabled(!isEnabled);
        // In a future step, we would call a server action here to update the database.
    };

    return (
        <button onClick={handleClick} className="flex items-center gap-2 text-sm">
            {isEnabled ? (
                <Check className="h-4 w-4 text-green-500" />
            ) : (
                <X className="h-4 w-4 text-red-500" />
            )}
            <span>{formatPermissionName(permission)}</span>
        </button>
    );
};


export default function ManageRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const fetchedRoles = await getRolesAndPermissions();
        setRoles(fetchedRoles);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

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
                                    <PermissionToggleButton key={permission} permission={permission} isEnabled={true} />
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
