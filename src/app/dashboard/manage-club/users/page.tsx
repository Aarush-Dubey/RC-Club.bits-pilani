
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getUsers, updateUserRole, updateEmailWhitelist, getWhitelistedEmails, deleteWhitelistedEmail } from '../actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Search, Upload, Info, Trash2, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const WhitelistDetailsDialog = ({ onListUpdate }: { onListUpdate: () => void }) => {
    const [emails, setEmails] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchEmails = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedEmails = await getWhitelistedEmails();
            setEmails(fetchedEmails);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch whitelisted emails.' });
        } finally {
            setLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        fetchEmails();
    }, [fetchEmails]);
    
    const handleDelete = async (email: string) => {
        setDeletingEmail(email);
        try {
            await deleteWhitelistedEmail(email);
            toast({ title: "Email Removed", description: `${email} has been removed from the whitelist.` });
            onListUpdate();
            // Refetch the list after deletion
            await fetchEmails();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: (error as Error).message });
        } finally {
            setDeletingEmail(null);
        }
    };

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Whitelisted Emails</DialogTitle>
                <DialogDescription>A list of all emails currently allowed to register.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-72 my-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : emails.length > 0 ? (
                    <div className="space-y-2 pr-4">
                        {emails.map(email => (
                            <div key={email} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50">
                                <span>{email}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(email)}
                                    disabled={deletingEmail === email}
                                >
                                    {deletingEmail === email ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center">The whitelist is empty.</p>
                )}
            </ScrollArea>
        </DialogContent>
    );
};

const WhitelistManager = ({ onUpdate }: { onUpdate: () => void }) => {
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const { toast } = useToast();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            const json = XLSX.utils.sheet_to_json(worksheet);

            if (json.length > 0 && 'email' in json[0]) {
                const emails = json.map((row: any) => row.email).filter(Boolean);
                await updateEmailWhitelist(emails);
                toast({
                    title: "Whitelist Updated",
                    description: `Successfully updated the whitelist with ${emails.length} emails.`,
                });
                onUpdate();
            } else {
                throw new Error("Invalid file format. The first column must be named 'email'.");
            }

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: (error as Error).message,
            });
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Email Whitelist</CardTitle>
                    <CardDescription>Upload an Excel file to update the list of users allowed to register and log in.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>File Format Instructions</AlertTitle>
                        <AlertDescription>
                            The Excel file must contain a single column with the header named "email". Each row should contain one email address.
                        </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".xlsx, .xls"
                            className="hidden"
                            id="whitelist-upload"
                        />
                        <label htmlFor="whitelist-upload">
                            <Button asChild variant="outline" disabled={isLoading}>
                               <div>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {isLoading ? 'Processing...' : 'Upload Whitelist File'}
                               </div>
                            </Button>
                        </label>
                        <DialogTrigger asChild>
                            <Button variant="secondary">
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </Button>
                        </DialogTrigger>
                    </div>
                </CardContent>
            </Card>
            <WhitelistDetailsDialog onListUpdate={onUpdate} />
        </Dialog>
    )
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { users, roles } = await getUsers();
    setUsers(users as User[]);
    setRoles(roles);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      await updateUserRole(userId, newRole);
      toast({
        title: 'Role Updated',
        description: `The user's role has been changed to ${newRole}.`,
      });
      // Refresh data
      const { users } = await getUsers();
      setUsers(users as User[]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: (error as Error).message,
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/manage-club">
            <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
            </Button>
        </Link>
        <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">User Management</h2>
            <p className="text-muted-foreground">
              Assign and update roles for all club members and manage access.
            </p>
        </div>
      </div>

      <WhitelistManager onUpdate={fetchData} />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>A complete list of all registered members in the club.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">Loading users...</TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {updatingUserId === user.id ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Updating...</span>
                        </div>
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(role => (
                              <SelectItem key={role} value={role} className="capitalize">
                                {role.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
