
"use client"

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { addInventoryItem } from "./add-item-actions";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
    name: z.string().min(3, "Item name must be at least 3 characters long."),
    description: z.string().min(10, "Please provide a brief description.").optional(),
    totalQuantity: z.coerce.number().min(1, "Quantity must be at least 1."),
    costPerUnit: z.coerce.number().min(0, "Cost must be a positive number."),
    isPerishable: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface NewInventoryItemFormProps {
  onFormSubmit: () => void;
}

export function NewInventoryItemForm({ onFormSubmit }: NewInventoryItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      totalQuantity: 1,
      costPerUnit: 0,
      isPerishable: false,
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      await addInventoryItem({
        name: data.name,
        description: data.description || "",
        totalQuantity: data.totalQuantity,
        costPerUnit: data.costPerUnit,
        isPerishable: data.isPerishable,
      });

      toast({
        title: "Item Added",
        description: `Successfully added ${data.name} to the inventory.`,
      });
      onFormSubmit();
    } catch (error) {
      console.error("Error creating item:", error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "Could not add the item. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., RunCam Phoenix 2 FPV Camera" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="totalQuantity"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Total Quantity</FormLabel>
                    <FormControl>
                    <Input type="number" {...field} min={1} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="costPerUnit"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Cost per Unit (₹)</FormLabel>
                    <FormControl>
                    <Input type="number" step="0.01" {...field} min={0}/>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide a brief description of the item."
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isPerishable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  This item is perishable/consumable
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Item to Inventory
        </Button>
      </form>
    </Form>
  );
}
