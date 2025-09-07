
"use client"

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { retireAsset } from './actions';
import { Label } from '@/components/ui/label';

interface Asset {
    id: string;
    itemName: string;
    actualCost?: number;
    expectedCost: number;
    status: string;
    createdAt: { toDate: () => Date };
    retirementReason?: string;
}

function RetireAssetDialog({ asset, onRetired }: { asset: Asset; onRetired: () => void }) {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user: currentUser } = useAuth();
    const { toast } = useToast();

    const handleRetire = async () => {
        if (!currentUser) {
            toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
            return;
        }
        if (!reason.trim()) {
            toast({ variant: "destructive", title: "Reason Required", description: "Please provide a reason for retirement." });
            return;
        }
        
        setIsLoading(true);
        try {
            await retireAsset(asset.id, reason, currentUser.uid);
            toast({ title: "Asset Retired", description: "The asset has been written off from the books." });
            onRetired();
        } catch (error) {
            toast({ variant: "destructive", title: "Retirement Failed", description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={asset.status === 'retired'}>
                    <Archive className="mr-2 h-4 w-4" />
                    Retire
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Retire Asset: {asset.itemName}</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will write off the asset from the balance sheet by recording a loss. This action is irreversible.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="retirement-reason">Reason for Retirement (Required)</Label>
                    <Textarea 
                        id="retirement-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Damaged beyond repair, lost during event, obsolete."
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRetire} disabled={isLoading || !reason.trim()}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Retirement
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default function AssetRegister({ onUpdate }: { onUpdate: () => void }) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();
    const isTreasurer = currentUser?.role === 'treasurer' || currentUser?.role === 'admin';

    const fetchAssets = async () => {
        setLoading(true);
        const q = query(
            collection(db, "procurement_requests"),
            where("itemType", "==", "asset"),
            where("status", "in", ["reimbursed", "purchased", "retired"])
        );
        const snapshot = await getDocs(q);
        const fetchedAssets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
        setAssets(fetchedAssets);
        setLoading(false);
    };

    useEffect(() => {
        fetchAssets();
    }, []);
    
    const handleAssetRetired = () => {
        fetchAssets();
        onUpdate(); // Re-fetch all finance data on parent
    };

    if (loading) {
        return <p>Loading assets...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Asset Register</CardTitle>
                <CardDescription>A list of all capital assets owned by the club.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Asset Name</TableHead>
                            <TableHead>Purchase Date</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>Status</TableHead>
                            {isTreasurer && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isTreasurer ? 5 : 4} className="h-24 text-center">
                                    No assets found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            assets.map(asset => (
                                <TableRow key={asset.id} className={asset.status === 'retired' ? 'text-muted-foreground' : ''}>
                                    <TableCell className="font-medium">{asset.itemName}</TableCell>
                                    <TableCell>{format(asset.createdAt.toDate(), 'PP')}</TableCell>
                                    <TableCell className="font-mono">
                                        ₹{(asset.actualCost || asset.expectedCost).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={asset.status === 'retired' ? 'secondary' : 'default'}>
                                            {asset.status === 'retired' ? 'Retired' : 'Active'}
                                        </Badge>
                                        {asset.status === 'retired' && (
                                            <p className="text-xs text-muted-foreground mt-1">{asset.retirementReason}</p>
                                        )}
                                    </TableCell>
                                    {isTreasurer && (
                                        <TableCell className="text-right">
                                            <RetireAssetDialog asset={asset} onRetired={handleAssetRetired} />
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
