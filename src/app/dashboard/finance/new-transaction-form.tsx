
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
import { PlusCircle, Trash2, Loader2, ChevronsUpDown, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const transactionLineSchema = z.object({
  acctCode: z.string().min(1, "Account is required."),
  debit: z.string().optional(),
  credit: z.string().optional(),
});

const formSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date." }),
  narration: z.string().min(5, "Narration is required."),
  lines: z.array(transactionLineSchema).min(2, "At least two lines are required."),
}).refine(data => {
    const totalDebits = data.lines.reduce((sum, line) => sum + (parseFloat(line.debit || '0') * 100), 0);
    const totalCredits = data.lines.reduce((sum, line) => sum + (parseFloat(line.credit || '0') * 100), 0);
    return Math.abs(totalDebits - totalCredits) < 1; // Allow for small float inaccuracies before rounding
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
                { acctCode: "", debit: "", credit: "" },
                { acctCode: "", debit: "", credit: "" }
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
                    debitMinor: Math.round(parseFloat(line.debit || '0') * 100),
                    creditMinor: Math.round(parseFloat(line.credit || '0') * 100),
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
    const totalDebits = lines.reduce((sum, line) => sum + parseFloat(line.debit || '0'), 0);
    const totalCredits = lines.reduce((sum, line) => sum + parseFloat(line.credit || '0'), 0);


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="md:col-span-1">
                                <FormLabel>Date</FormLabel>
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
                                <FormLabel>Narration (Description)</FormLabel>
                                <FormControl><Textarea placeholder="Briefly describe this transaction" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div>
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-start gap-2 mb-2 p-2 border rounded-md">
                            <FormField
                                control={form.control}
                                name={`lines.${index}.acctCode`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                                    >
                                                        {field.value ? chartOfAccounts.find(acc => acc.id === field.value)?.name : "Select Account"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search accounts..." />
                                                    <CommandList className="max-h-60 overflow-y-auto">
                                                        <CommandEmpty>No account found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {chartOfAccounts.map((acc) => (
                                                                <CommandItem
                                                                    value={`${acc.name} ${acc.id}`}
                                                                    key={acc.id}
                                                                    onSelect={() => {
                                                                        form.setValue(`lines.${index}.acctCode`, acc.id);
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", acc.id === field.value ? "opacity-100" : "opacity-0")} />
                                                                    {acc.id} - {acc.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`lines.${index}.debit`}
                                render={({ field }) => (
                                    <FormItem className="w-32">
                                        <FormControl><Input type="number" placeholder="Debit" {...field} /></FormControl>
                                         <FormMessage/>
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`lines.${index}.credit`}
                                render={({ field }) => (
                                    <FormItem className="w-32">
                                        <FormControl><Input type="number" placeholder="Credit" {...field} /></FormControl>
                                         <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ acctCode: "", debit: "", credit: "" })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Line
                    </Button>
                </div>
                
                 <div className="flex justify-end items-center gap-4 p-2 border-t">
                    <div className="text-right">
                        <p className="text-sm font-medium">Totals</p>
                        <p className="text-xs text-muted-foreground">Debits: {totalDebits.toFixed(2)}</p>
                         <p className="text-xs text-muted-foreground">Credits: {totalCredits.toFixed(2)}</p>
                    </div>
                    {form.formState.errors.lines && (
                         <span className="text-sm text-destructive">{form.formState.errors.lines.message}</span>
                    )}
                 </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post Transaction
                </Button>
            </form>
        </Form>
    );
}
