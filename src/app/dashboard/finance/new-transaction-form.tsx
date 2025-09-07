
"use client"

import { useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, Loader2, ChevronsUpDown, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const transactionLineSchema = z.object({
  acctCode: z.string().min(1, "Account is required."),
  type: z.enum(["debit", "credit"], { required_error: "Type is required." }),
  amount: z.string().min(1, "Amount is required.").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Amount must be a positive number."),
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

export function NewTransactionForm({ chartOfAccounts, onFormSubmit }: { chartOfAccounts: ChartOfAccount[], onFormSubmit: () => void }) {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
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

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "lines"
    });

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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Header Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="md:col-span-1">
                                <FormLabel>Transaction Date</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="narration"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Description</FormLabel>
                                <FormControl><Textarea placeholder="Briefly describe this transaction" {...field} className="resize-none" rows={1} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Transaction Lines Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Journal Entries</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ acctCode: "", type: "debit", amount: "" })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Line
                        </Button>
                    </div>
                    
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-3 py-2 px-3 bg-muted/50 rounded-md text-sm font-medium">
                        <div className="col-span-5">Account</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-3">Amount</div>
                        <div className="col-span-1"></div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Transaction Lines */}
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-3 p-3 border rounded-lg bg-card">
                                {/* Account Selection */}
                                <FormField
                                    control={form.control}
                                    name={`lines.${index}.acctCode`}
                                    render={({ field }) => (
                                        <FormItem className="col-span-5">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn("w-full justify-between h-10", !field.value && "text-muted-foreground")}
                                                        >
                                                            <span className="truncate">
                                                                {field.value ? 
                                                                    `${field.value} - ${chartOfAccounts.find(acc => acc.id === field.value)?.name}` : 
                                                                    "Select Account"
                                                                }
                                                            </span>
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[400px] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Search accounts..." />
                                                        <CommandList className="max-h-[200px] overflow-y-auto">
                                                            <CommandEmpty>No account found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {chartOfAccounts.map((acc) => (
                                                                    <CommandItem
                                                                        value={`${acc.name} ${acc.id}`}
                                                                        key={acc.id}
                                                                        onSelect={() => {
                                                                            form.setValue(`lines.${index}.acctCode`, acc.id)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                acc.id === field.value ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium">{acc.id} - {acc.name}</span>
                                                                        </div>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Debit/Credit Type */}
                                <FormField
                                    control={form.control}
                                    name={`lines.${index}.type`}
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="debit">
                                                        <span className="text-green-700 font-medium">Debit</span>
                                                    </SelectItem>
                                                    <SelectItem value="credit">
                                                        <span className="text-red-700 font-medium">Credit</span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Amount */}
                                <FormField
                                    control={form.control}
                                    name={`lines.${index}.amount`}
                                    render={({ field }) => (
                                        <FormItem className="col-span-3">
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    placeholder="0.00" 
                                                    step="0.01"
                                                    min="0"
                                                    className="h-10"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Visual Indicator */}
                                <div className="col-span-1 flex items-center justify-center">
                                    {lines[index]?.type && (
                                        <div className={cn(
                                            "w-3 h-3 rounded-full",
                                            lines[index].type === 'debit' ? "bg-green-500" : "bg-red-500"
                                        )} />
                                    )}
                                </div>

                                {/* Delete Button */}
                                <div className="col-span-1 flex items-center">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => remove(index)} 
                                        disabled={fields.length <= 2}
                                        className="h-10 w-10"
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Balance Summary */}
                <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                        <div className="grid grid-cols-2 gap-6 text-center">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Debits</p>
                                <p className="text-lg font-semibold text-green-700">{totalDebits.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
                                <p className="text-lg font-semibold text-red-700">{totalCredits.toFixed(2)}</p>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <p className="text-sm font-medium text-muted-foreground">Balance</p>
                            <p className={cn(
                                "text-lg font-semibold",
                                Math.abs(totalDebits - totalCredits) < 0.01 ? "text-green-600" : "text-destructive"
                            )}>
                                {Math.abs(totalDebits - totalCredits) < 0.01 ? "✓ Balanced" : `${(totalDebits - totalCredits).toFixed(2)}`}
                            </p>
                        </div>
                    </div>
                    
                    {balanceError && (
                        <div className="mt-3 p-3 bg-destructive/10 rounded-md">
                            <span className="text-sm text-destructive font-medium">{balanceError}</span>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post Transaction
                </Button>
            </form>
        </Form>
    );
}
