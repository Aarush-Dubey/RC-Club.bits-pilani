
"use client"

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Plus, Trash2, AlertTriangle, TrendingUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createBudget, updateBudget, deleteBudget } from './actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, parseISO, isAfter, isBefore } from 'date-fns';

interface Budget {
    id: string;
    name: string;
    category: string;
    amount: number;
    spent: number;
    remaining: number;
    period: 'monthly' | 'semester' | 'annual';
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: any;
}

interface Transaction {
    type: 'income' | 'expense';
    category: string;
    amount: number;
    date: string;
    isReversed: boolean;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN').format(amount);
}

const budgetFormSchema = z.object({
    name: z.string().min(3, "Budget name is required."),
    category: z.string().min(2, "Category is required."),
    amount: z.coerce.number().min(1, "Budget amount must be greater than 0."),
    period: z.enum(['monthly', 'semester', 'annual'], { required_error: "Please select a budget period." }),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date." }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date." }),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date.",
    path: ["endDate"],
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

const BudgetForm = ({ 
    budget, 
    onSuccess, 
    onCancel 
}: { 
    budget?: Budget | null, 
    onSuccess: () => void, 
    onCancel: () => void 
}) => {
    const { toast } = useToast();
    const form = useForm<BudgetFormValues>({
        resolver: zodResolver(budgetFormSchema),
        defaultValues: budget ? {
            name: budget.name,
            category: budget.category,
            amount: budget.amount,
            period: budget.period,
            startDate: budget.startDate,
            endDate: budget.endDate,
        } : {
            name: '',
            category: '',
            amount: 0,
            period: 'semester',
            startDate: format(new Date(), 'yyyy-MM-dd'),
            endDate: format(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 6 months
        }
    });

    const onSubmit = async (values: BudgetFormValues) => {
        try {
            if (budget) {
                await updateBudget(budget.id, values);
                toast({ title: "Success", description: "Budget updated successfully." });
            } else {
                await createBudget(values);
                toast({ title: "Success", description: "Budget created successfully." });
            }
            onSuccess();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: (error as Error).message });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Budget Name</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g., Annual Events Budget" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl><Input {...field} placeholder="e.g., Events, Equipment" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="amount" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Budget Amount (₹)</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="period" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Budget Period</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="semester">Semester (6 months)</SelectItem>
                                <SelectItem value="annual">Annual</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="endDate" render={({ field }) => (
                        <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <DialogFooter className="pt-4 border-t gap-2">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {budget ? 'Update Budget' : 'Create Budget'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
};

const BudgetCard = ({ 
    budget, 
    onEdit, 
    onDelete 
}: { 
    budget: Budget, 
    onEdit: (budget: Budget) => void, 
    onDelete: (budgetId: string) => void 
}) => {
    const spentPercentage = (budget.spent / budget.amount) * 100;
    const isOverBudget = budget.spent > budget.amount;
    const isNearLimit = spentPercentage > 80 && !isOverBudget;
    const isActive = isAfter(parseISO(budget.endDate), new Date()) && isBefore(parseISO(budget.startDate), new Date());

    return (
        <Card className={`${isOverBudget ? 'border-red-500' : isNearLimit ? 'border-yellow-500' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{budget.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{budget.category}</Badge>
                            <Badge variant={isActive ? "default" : "secondary"}>
                                {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
                            </Badge>
                            {isOverBudget && (
                                <Badge variant="destructive">
                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                    Over Budget
                                </Badge>
                            )}
                            {isNearLimit && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                    Near Limit
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(budget)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete "{budget.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(budget.id)}>
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Spent: ₹{formatCurrency(budget.spent)}</span>
                        <span>Budget: ₹{formatCurrency(budget.amount)}</span>
                    </div>
                    <Progress 
                        value={Math.min(spentPercentage, 100)} 
                        className={`h-2 ${isOverBudget ? 'bg-red-100' : isNearLimit ? 'bg-yellow-100' : ''}`}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{spentPercentage.toFixed(1)}% used</span>
                        <span className={budget.remaining < 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                            ₹{formatCurrency(Math.abs(budget.remaining))} {budget.remaining < 0 ? 'over' : 'remaining'}
                        </span>
                    </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                    <p>Period: {format(parseISO(budget.startDate), 'MMM dd, yyyy')} - {format(parseISO(budget.endDate), 'MMM dd, yyyy')}</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default function BudgetManager() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const { user: currentUser } = useAuth();
    const isTreasurer = currentUser?.role === 'treasurer';
    const { toast } = useToast();

    const fetchData = async () => {
        // Fetch all transactions to calculate spending by category
        const transactionsSnap = await getDocs(collection(db, "transactions"));
        const allTransactions = transactionsSnap.docs.map(doc => doc.data()) as Transaction[];
        setTransactions(allTransactions);
        
        // Calculate spending for each budget category
        const categorySpending: Record<string, number> = {};
        allTransactions.forEach(transaction => {
            if (transaction.type === 'expense' && !transaction.isReversed) {
                categorySpending[transaction.category] = (categorySpending[transaction.category] || 0) + transaction.amount;
            }
        });

        // Update budgets with current spending (this would typically be done server-side)
        setBudgets(prev => prev.map(budget => ({
            ...budget,
            spent: categorySpending[budget.category] || 0,
            remaining: budget.amount - (categorySpending[budget.category] || 0)
        })));
    };

    useEffect(() => {
        fetchData();

        const unsubscribe = onSnapshot(query(collection(db, "budgets"), orderBy("createdAt", "desc")), (snapshot) => {
            const fetchedBudgets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Budget[];
            setBudgets(fetchedBudgets);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (budgetId: string) => {
        setIsDeleting(budgetId);
        try {
            await deleteBudget(budgetId);
            toast({ title: "Success", description: "Budget deleted successfully." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: (error as Error).message });
        } finally {
            setIsDeleting(null);
        }
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setSelectedBudget(null);
        fetchData();
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    const activeBudgets = budgets.filter(budget => 
        isAfter(parseISO(budget.endDate), new Date()) && 
        isBefore(parseISO(budget.startDate), new Date())
    );

    const overBudgetCount = budgets.filter(budget => budget.spent > budget.amount).length;
    const nearLimitCount = budgets.filter(budget => {
        const percentage = (budget.spent / budget.amount) * 100;
        return percentage > 80 && budget.spent <= budget.amount;
    }).length;

    return (
        <div className="space-y-6">
            {/* Budget Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Budgets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{budgets.length}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeBudgets.length}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Near Limit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{nearLimitCount}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{overBudgetCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Budget Management */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Budget Management</CardTitle>
                        <CardDescription>
                            Create and manage budgets by category to track spending limits.
                        </CardDescription>
                    </div>
                    {isTreasurer && (
                        <Button onClick={() => setIsFormOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Budget
                        </Button>
                    )}
                </CardHeader>
                
                <CardContent>
                    {budgets.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No budgets created yet.</p>
                            {isTreasurer && (
                                <Button variant="outline" className="mt-4" onClick={() => setIsFormOpen(true)}>
                                    Create Your First Budget
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {budgets.map(budget => (
                                <BudgetCard
                                    key={budget.id}
                                    budget={budget}
                                    onEdit={(budget) => {
                                        setSelectedBudget(budget);
                                        setIsFormOpen(true);
                                    }}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Budget Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedBudget ? 'Edit Budget' : 'Create New Budget'}
                        </DialogTitle>
                        <DialogDescription>
                            Set spending limits for different categories to control expenses.
                        </DialogDescription>
                    </DialogHeader>
                    <BudgetForm
                        budget={selectedBudget}
                        onSuccess={handleFormSuccess}
                        onCancel={() => {
                            setIsFormOpen(false);
                            setSelectedBudget(null);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
