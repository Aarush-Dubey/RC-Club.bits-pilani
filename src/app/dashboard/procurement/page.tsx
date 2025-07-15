
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, ShoppingBasket, ClipboardCheck } from "lucide-react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, type AppUser } from "@/context/auth-context";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription as DialogDescriptionComponent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NewBucketForm } from "./new-bucket-form";

async function getData(currentUser: AppUser | null) {
  if (!currentUser) return { buckets: [], users: [] };

  const bucketsQuery = query(
    collection(db, "procurement_buckets"),
    where("members", "array-contains", currentUser.uid)
  );
  const bucketsSnapshot = await getDocs(bucketsQuery);
  let buckets = bucketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Sort buckets by date manually in the code as Firestore requires a composite index for this query
  buckets.sort((a, b) => {
    const dateA = a.createdAt?.toDate() || 0;
    const dateB = b.createdAt?.toDate() || 0;
    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;
    return 0;
  });

  const userIds = [...new Set(buckets.flatMap(b => b.members || []))];
  let users: any[] = [];
  if (userIds.length > 0) {
    // Firestore 'in' query has a limit of 30 items per query.
    const userChunks = [];
    for (let i = 0; i < userIds.length; i += 30) {
        userChunks.push(userIds.slice(i, i + 30));
    }
    
    for (const chunk of userChunks) {
        const usersQuery = query(collection(db, "users"), where("id", "in", chunk));
        const usersSnap = await getDocs(usersQuery);
        users.push(...usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
  }

  return { buckets, users };
}


const getStatusVariant = (status: string) => {
  switch (status) {
    case 'open': return 'default';
    case 'closed': return 'secondary';
    case 'ordered': return 'outline';
    case 'received': return 'destructive'; // Re-using for now, should be success
    default: return 'outline';
  }
};

export default function ProcurementPage() {
  const [data, setData] = useState<{ buckets: any[], users: any[] }>({ buckets: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user: currentUser } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchedData = await getData(currentUser);
      setData(fetchedData);
    } catch (error) {
      console.error("Failed to fetch procurement data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);
  
  const handleFormSubmit = () => {
    fetchData();
    setIsFormOpen(false);
  }

  const canCreate = currentUser?.permissions?.canCreateBuckets;
  const canApprove = currentUser?.permissions?.canApproveNewItemRequest;

  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">My Procurement</h2>
            <p className="text-muted-foreground">
              View and manage all procurement buckets you are a part of.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canApprove && (
                <Link href="/dashboard/procurement/approvals">
                    <Button variant="outline"><ClipboardCheck className="mr-2 h-4 w-4"/>Manage Approvals</Button>
                </Link>
            )}
             <Link href="/dashboard/procurement/new">
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> New Request
                </Button>
            </Link>
          </div>
        </div>

        {loading ? (
           <p>Loading buckets...</p>
        ) : data.buckets.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <CardHeader>
              <ShoppingBasket className="mx-auto h-12 w-12 text-muted-foreground" />
              <CardTitle>No Procurement Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">You have not created or joined any procurement buckets.</CardDescription>
              {canCreate && (
                <Link href="/dashboard/procurement/new">
                    <Button variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" /> Make a Request
                    </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.buckets.map((bucket) => {
              const creator = data.users.find(u => u.id === bucket.createdBy);
              return (
                <Link href={`/dashboard/procurement/buckets/${bucket.id}`} key={bucket.id} className="block">
                    <Card className="h-full hover:border-primary transition-colors">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="font-headline text-lg line-clamp-2">{bucket.description}</CardTitle>
                                <Badge variant={getStatusVariant(bucket.status) as any}>{bucket.status}</Badge>
                            </div>
                            <CardDescription>
                                Started by {creator?.name} on {bucket.createdAt ? format(bucket.createdAt.toDate(), "MMM d") : 'N/A'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">
                                {bucket.members?.length || 0} members
                            </div>
                        </CardContent>
                    </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">Create New Procurement Bucket</DialogTitle>
          <DialogDescriptionComponent>
            This will create a new shared bucket that other members can add their item requests to.
          </DialogDescriptionComponent>
        </DialogHeader>
        <NewBucketForm currentUser={currentUser} setOpen={setIsFormOpen} onFormSubmit={handleFormSubmit} />
      </DialogContent>
    </Dialog>
  );
}
