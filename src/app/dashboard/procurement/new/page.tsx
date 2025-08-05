
"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, ShoppingBasket, FilePlus2, Box, ArrowRight, Info } from "lucide-react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription as DialogDescriptionComponent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { NewItemRequestForm } from "../new-item-request-form";
import { useToast } from "@/hooks/use-toast";
import { NewBucketForm } from "../new-bucket-form";

async function getData() {
  const bucketsQuery = query(collection(db, "procurement_buckets"), where("status", "==", "open"));
  const bucketsSnapshot = await getDocs(bucketsQuery);
  const buckets = bucketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const usersSnapshot = await getDocs(collection(db, "users"));
  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return { buckets, users };
}

export default function NewProcurementPage() {
  const [data, setData] = useState<{ buckets: any[], users: any[] }>({ buckets: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [isSingleItemFormOpen, setIsSingleItemFormOpen] = useState(false);
  const [isNewBucketFormOpen, setIsNewBucketFormOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchedData = await getData();
      setData(fetchedData);
    } catch (error) {
      console.error("Failed to fetch procurement data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load data." });
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
    setIsSingleItemFormOpen(false);
    setIsNewBucketFormOpen(false);
  };
  
  const canCreateBucket = currentUser?.permissions?.canCreateBuckets;

  return (
    <Dialog open={isSingleItemFormOpen} onOpenChange={setIsSingleItemFormOpen}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">New Procurement Request</h2>
            <p className="text-muted-foreground">
              Request a single item or add items to a group purchasing bucket.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <Card className="h-full md:col-span-2">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <FilePlus2 className="w-8 h-8 text-primary"/>
                        <div>
                            <CardTitle className="font-headline text-xl">Request a Single Item</CardTitle>
                            <CardDescription>For individual, one-off purchases.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Use this option if you need to purchase a specific item that isn't part of a larger group order.
                        Your request will be routed for approval individually.
                    </p>
                </CardContent>
                <CardFooter>
                    <DialogTrigger asChild>
                        <Button className="w-full">Create Single Request</Button>
                    </DialogTrigger>
                </CardFooter>
            </Card>
        </div>

        <Dialog open={isNewBucketFormOpen} onOpenChange={setIsNewBucketFormOpen}>
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                         <h3 className="text-2xl font-bold tracking-tight font-headline">Open Buckets</h3>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="text-sm text-muted-foreground">
                                Add your item to an open bucket to combine shipping and simplify reimbursement. Select a bucket below to see its contents and add your request.
                            </PopoverContent>
                        </Popover>
                    </div>
                    {canCreateBucket && (
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Start a Bucket
                            </Button>
                        </DialogTrigger>
                    )}
                </div>
                {loading ? (
                    <p>Loading open buckets...</p>
                ) : data.buckets.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {data.buckets.map((bucket) => {
                            const creator = data.users.find(u => u.id === bucket.createdBy);
                            return (
                            <Card key={bucket.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="font-headline text-lg line-clamp-2">{bucket.description}</CardTitle>
                                    <CardDescription>
                                        Started by {creator?.name} on {bucket.createdAt ? format(bucket.createdAt.toDate(), "MMM d") : 'N/A'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="text-sm text-muted-foreground">
                                        {bucket.members?.length || 0} members contributing
                                    </div>
                                </CardContent>
                                 <CardFooter>
                                    <Link href={`/dashboard/procurement/buckets/${bucket.id}`} className="w-full">
                                        <Button variant="outline" className="w-full">
                                            View & Add to Bucket
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                            );
                        })}
                    </div>
                ) : (
                     <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                        <CardHeader>
                        <ShoppingBasket className="mx-auto h-12 w-12 text-muted-foreground" />
                        <CardTitle>No Open Buckets</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <CardDescription className="mb-4">There are no open purchasing buckets right now. You can create one or make a single request.</CardDescription>
                        </CardContent>
                    </Card>
                )}
            </div>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle className="text-2xl font-headline">Create New Procurement Bucket</DialogTitle>
                    <DialogDescriptionComponent>
                        This will create a new shared bucket that other members can add their item requests to.
                    </DialogDescriptionComponent>
                </DialogHeader>
                <NewBucketForm currentUser={currentUser} setOpen={setIsNewBucketFormOpen} onFormSubmit={handleFormSubmit} />
            </DialogContent>
        </Dialog>

      </div>
      <DialogContent className="sm:max-w-md h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">New Single Item Request</DialogTitle>
          <DialogDescriptionComponent>
            This request will be processed individually and is not part of a group bucket.
          </DialogDescriptionComponent>
        </DialogHeader>
        <NewItemRequestForm
          currentUser={currentUser}
          setOpen={setIsSingleItemFormOpen}
          onFormSubmit={handleFormSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
