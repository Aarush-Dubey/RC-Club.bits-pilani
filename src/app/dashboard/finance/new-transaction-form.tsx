"use client"

import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { addTransaction, type ChartOfAccount } from "./actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PlusCircle, Trash2, Loader2, Search, Plus, X, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const transactionLineSchema = z.object({
  acctCode: z.string().min(1, "Account is required."),
  type: z.enum(["debit", "credit"], { required_error: "Type is required." }),
  amount: z.string().min(1, "Amount is required.").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Amount must be a positive number."),
});

const newAccountSchema = z.object({
  id: z.string().min(1, "Account code is required."),
  name: z.string().min(1, "Account name is required."),
  group: z.string().min(1, "Account group is required."),
  isDebitNormal: z.boolean(),
});

const formSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date." }),
  narration: z.string().min(5, "Narration is required."),
  lines: z.array(transactionLineSchema).min(2, "At least two lines are required."),
}).refine(data => {
    const totalDebits = data.lines.reduce((sum, line) => 
        sum + (line.type === 'debit' ? parseFloat(line.amount) * 100 : 0), 0);
    const totalCredits = data.lines.reduce((sum, line) => 
        sum + (line.type === 'credit' ? parseFloat(line.amount) * 100 : 0), 0);
    return Math.abs(totalDebits - totalCredits) < 1;
}, {
    message: "Total debits must equal total credits.",
    path: ["lines"],
});

type FormValues = z.infer<typeof formSchema>;
type NewAccountValues = z.infer<typeof newAccountSchema>;

const ACCOUNT_GROUPS = [
    { key: "Current Assets", label: "Current Assets", color: "bg-blue-50 text-blue-700 border-blue-200", isDebitNormal: true },
    { key: "Fixed Assets", label: "Fixed Assets", color: "bg-sky-50 text-sky-700 border-sky-200", isDebitNormal: true },
    { key: "Current Liabilities", label: "Current Liabilities", color: "bg-red-50 text-red-700 border-red-200", isDebitNormal: false },
    { key: "Equity", label: "Equity", color: "bg-purple-50 text-purple-700 border-purple-200", isDebitNormal: false },
    { key: "Revenue", label: "Revenue", color: "bg-green-50 text-green-700 border-green-200", isDebitNormal: false },
    { key: "Expenses", label: "Expenses", color: "bg-orange-50 text-orange-700 border-orange-200", isDebitNormal: true }
];

export function NewTransactionForm({ chartOfAccounts, onFormSubmit }: { chartOfAccounts: ChartOfAccount[], onFormSubmit: () => void }) {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [accounts, setAccounts] = useState<ChartOfAccount[]>(chartOfAccounts);
    const [selectedAccounts, setSelectedAccounts] = useState<(ChartOfAccount | null)[]>([]);
    const [showAccountDialog, setShowAccountDialog] = useState(false);
    const [showNewAccountDialog, setShowNewAccountDialog] = useState(false);
    const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        'Current Assets': true,
        'Fixed Assets': false,
        'Current Liabilities': false,
        'Equity': false,
        'Revenue': false,
        'Expenses': true
    });
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: format(new Date(), 'yyyy-MM-dd'),
            narration: "",
            lines: [
                { acctCode: "", type: "debit", amount: "" },
                { acctCode: "", type: "credit", amount: "" }
            ]
        }
    });

    const newAccountForm = useForm<NewAccountValues>({
        resolver: zodResolver(newAccountSchema),
        defaultValues: { id: "", name: "", group: "", isDebitNormal: true }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "lines"
    });

    React.useEffect(() => {
        const currentLength = fields.length;
        if (selectedAccounts.length < currentLength) {
            setSelectedAccounts(prev => [...prev, ...Array(currentLength - prev.length).fill(null)]);
        }
    }, [fields.length, selectedAccounts.length]);

    const groupedAccounts = React.useMemo(() => {
        const grouped: Record<string, ChartOfAccount[]> = {};
        ACCOUNT_GROUPS.forEach(group => {
            grouped[group.key] = accounts.filter(acc => acc.group === group.key);
        });
        return grouped;
    }, [accounts]);

    const getFilteredAccounts = (accountList: ChartOfAccount[], query: string) => {
        if (!query.trim()) return accountList;
        return accountList.filter(acc =>
            acc.id.toLowerCase().includes(query.toLowerCase()) ||
            acc.name.toLowerCase().includes(query.toLowerCase())
        );
    };

    const handleAccountSelect = (account: ChartOfAccount, index: number) => {
        form.setValue(`lines.${index}.acctCode`, account.id);
        const newSelected = [...selectedAccounts];
        newSelected[index] = account;
        setSelectedAccounts(newSelected);
        setShowAccountDialog(false);
        setCurrentLineIndex(null);
        setSearchQuery("");
    };

    const handleAccountClear = (index: number) => {
        form.setValue(`lines.${index}.acctCode`, "");
        const newSelected = [...selectedAccounts];
        newSelected[index] = null;
        setSelectedAccounts(newSelected);
    };

    const openAccountSelector = (index: number) => {
        setCurrentLineIndex(index);
        setShowAccountDialog(true);
    };

    const toggleGroup = (groupKey: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }));
    };

    const createNewAccount = async (data: NewAccountValues) => {
        // In a real app, this would call an API
        const newAccount: ChartOfAccount = { ...data };
        setAccounts(prev => [...prev, newAccount]);
        if (currentLineIndex !== null) {
            handleAccountSelect(newAccount, currentLineIndex);
        }
        toast({ title: 'Success', description: 'New account created successfully.' });
        setShowNewAccountDialog(false);
        newAccountForm.reset();
    };

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Not authenticated' });
            setIsLoading(false);
            return;
        }

        try {
            await addTransaction({
                date: data.date,
                narration: data.narration,
                createdById: currentUser.uid,
                lines: data.lines.map(line => ({
                    acctCode: line.acctCode,
                    debitMinor: line.type === 'debit' ? Math.round(parseFloat(line.amount) * 100) : 0,
                    creditMinor: line.type === 'credit' ? Math.round(parseFloat(line.amount) * 100) : 0,
                })),
            });
            toast({ title: 'Success', description: 'Transaction posted successfully.' });
            onFormSubmit();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const lines = form.watch("lines");
    const totalDebits = lines.reduce((sum, line) => 
        sum + (line.type === 'debit' ? parseFloat(line.amount || '0') : 0), 0);
    const totalCredits = lines.reduce((sum, line) => 
        sum + (line.type === 'credit' ? parseFloat(line.amount || '0') : 0), 0);
    const balanceError = form.formState.errors.lines?.root?.message;

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="date" render={({ field }) => (
                            <FormItem className="md:col-span-1"><FormLabel>Transaction Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="narration" render={({ field }) => (
                            <FormItem className="md:col-span-2"><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Briefly describe this transaction" {...field} className="resize-none" rows={1} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Journal Entries</h3>
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ acctCode: "", type: "debit", amount: "" })}><PlusCircle className="mr-2 h-4 w-4" /> Add Line</Button>
                        </div>
                        <div className="grid grid-cols-12 gap-3 py-2 px-3 bg-muted/50 rounded-md text-sm font-medium">
                            <div className="col-span-5">Account</div><div className="col-span-2">Type</div><div className="col-span-3">Amount</div>
                        </div>
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-3 p-2 border rounded-lg bg-card items-center">
                                    <FormField control={form.control} name={`lines.${index}.acctCode`} render={({ field }) => (
                                        <FormItem className="col-span-5">
                                            {selectedAccounts[index] ? (
                                                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border text-sm"><div className="flex-1"><p className="font-medium">{selectedAccounts[index]?.id} - {selectedAccounts[index]?.name}</p></div><Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleAccountClear(index)}><X className="h-4 w-4" /></Button></div>
                                            ) : (
                                                <Button type="button" variant="outline" className="w-full justify-start text-left h-10" onClick={() => openAccountSelector(index)}>Select Account</Button>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`lines.${index}.type`} render={({ field }) => (
                                        <FormItem className="col-span-2"><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-10"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="debit"><span className="text-green-700 font-medium">Debit</span></SelectItem><SelectItem value="credit"><span className="text-red-700 font-medium">Credit</span></SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`lines.${index}.amount`} render={({ field }) => (
                                        <FormItem className="col-span-3"><FormControl><Input type="number" placeholder="0.00" step="0.01" min="0" className="h-10" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <div className="col-span-1 flex items-center justify-center">{lines[index]?.type && (<div className={cn("w-3 h-3 rounded-full", lines[index].type === 'debit' ? "bg-green-500" : "bg-red-500")} />)}</div>
                                    <div className="col-span-1 flex items-center"><Button type="button" variant="ghost" size="icon" onClick={() => {remove(index); setSelectedAccounts(p => p.filter((_,i)=>i!==index))}} disabled={fields.length <= 2} className="h-10 w-10"><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex justify-between items-center"><div className="grid grid-cols-2 gap-6 text-center"><div><p className="text-sm font-medium text-muted-foreground">Total Debits</p><p className="text-lg font-semibold text-green-700">{totalDebits.toFixed(2)}</p></div><div><p className="text-sm font-medium text-muted-foreground">Total Credits</p><p className="text-lg font-semibold text-red-700">{totalCredits.toFixed(2)}</p></div></div><div className="text-right"><p className="text-sm font-medium text-muted-foreground">Balance</p><p className={cn("text-lg font-semibold",Math.abs(totalDebits - totalCredits) < 0.01 ? "text-green-600" : "text-destructive")}>{Math.abs(totalDebits - totalCredits) < 0.01 ? "✓ Balanced" : `${(totalDebits - totalCredits).toFixed(2)}`}</p></div></div>
                        {balanceError && (<div className="mt-3 p-3 bg-destructive/10 rounded-md"><span className="text-sm text-destructive font-medium">{balanceError}</span></div>)}
                    </div>
                    <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Post Transaction</Button>
                </form>
            </Form>

            <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader><DialogTitle>Select Account</DialogTitle><DialogDescription>Choose an account from your chart of accounts.</DialogDescription></DialogHeader>
                    <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search accounts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
                    <ScrollArea className="flex-grow pr-4 -mr-4"><div className="space-y-2">
                        {ACCOUNT_GROUPS.map((group) => {
                            const filteredAccounts = getFilteredAccounts(groupedAccounts[group.key] || [], searchQuery);
                            if (!filteredAccounts.length && searchQuery.trim()) return null;
                            return (
                                <Collapsible key={group.key} open={expandedGroups[group.key]} onOpenChange={() => toggleGroup(group.key)}>
                                    <CollapsibleTrigger asChild><Button variant="ghost" className="w-full justify-between p-2 h-auto"><div className="flex items-center gap-2"><Badge variant="outline" className={cn("font-medium", group.color)}>{group.label}</Badge><span className="text-xs text-muted-foreground">({filteredAccounts.length})</span></div>{expandedGroups[group.key] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</Button></CollapsibleTrigger>
                                    <CollapsibleContent className="space-y-1 mt-1 pl-2 border-l-2 ml-2">
                                        {filteredAccounts.length > 0 ? filteredAccounts.map((account) => (
                                            <button key={account.id} type="button" className="w-full p-2 text-left hover:bg-muted/50 rounded-md" onClick={() => currentLineIndex !== null && handleAccountSelect(account, currentLineIndex)}><p className="font-medium text-sm">{account.id} - {account.name}</p></button>
                                        )) : <p className="text-center text-muted-foreground py-2 text-sm">No accounts in this category.</p>}
                                    </CollapsibleContent>
                                </Collapsible>
                            )
                        })}
                    </div></ScrollArea>
                    <DialogFooter className="border-t pt-4"><Button type="button" variant="outline" className="w-full" onClick={() => {setShowAccountDialog(false); setShowNewAccountDialog(true);}}><Plus className="mr-2 h-4 w-4" />Create New Account</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showNewAccountDialog} onOpenChange={setShowNewAccountDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Create New Account</DialogTitle><DialogDescription>Add a new account to your chart of accounts.</DialogDescription></DialogHeader>
                    <Form {...newAccountForm}><form onSubmit={newAccountForm.handleSubmit(createNewAccount)} className="space-y-4">
                        <FormField control={newAccountForm.control} name="id" render={({ field }) => (<FormItem><FormLabel>Account Code</FormLabel><FormControl><Input placeholder="e.g., 1001" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={newAccountForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Account Name</FormLabel><FormControl><Input placeholder="e.g., Cash in Hand" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={newAccountForm.control} name="group" render={({ field }) => (
                            <FormItem><FormLabel>Account Group</FormLabel><Select onValueChange={(value) => { field.onChange(value); const group = ACCOUNT_GROUPS.find(g => g.key === value); if (group) newAccountForm.setValue('isDebitNormal', group.isDebitNormal); }} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select account group" /></SelectTrigger></FormControl><SelectContent>
                                {ACCOUNT_GROUPS.map((type) => (<SelectItem key={type.key} value={type.key}><div className="flex items-center gap-2"><Badge variant="outline" className={cn("text-xs", type.color)}>{type.label}</Badge></div></SelectItem>))}
                            </SelectContent></Select><FormMessage /></FormItem>
                        )}/>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNewAccountDialog(false)}>Cancel</Button><Button type="submit">Create Account</Button></DialogFooter>
                    </form></Form>
                </DialogContent>
            </Dialog>
        </>
    );
}
