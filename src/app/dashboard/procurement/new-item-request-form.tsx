
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PlusCircle, Trash2, Sparkles } from "lucide-react";

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
import type { AppUser } from "@/context/auth-context";
import { addRequestToBucket } from "./actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { enhanceJustification } from "@/ai/flows/enhance-justification";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  requests: z.array(z.object({
    itemName: z.string().min(3, "Item name must be at least 3 characters."),
    justification: z.string().min(10, "Please provide a brief justification."),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
    estimatedCost: z.coerce.number().min(0.01, "Please provide an estimated cost."),
    isPerishable: z.boolean().default(false),
  })).min(1, "At least one item is required.")
});

type FormValues = z.infer<typeof formSchema>;

interface NewItemRequestFormProps {
  bucketId?: string | null;
  currentUser: AppUser | null;
  setOpen: (open: boolean) => void;
  onFormSubmit: () => void;
}

export function NewItemRequestForm({ bucketId = null, currentUser, setOpen, onFormSubmit }: NewItemRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enhancingIndex, setEnhancingIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requests: [{
        itemName: "",
        justification: "",
        quantity: 1,
        estimatedCost: 0,
        isPerishable: false,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "requests"
  });

  const handleEnhanceJustification = async (index: number) => {
    const { itemName, justification } = form.getValues(`requests.${index}`);
    if (!justification) {
      toast({
        variant: "destructive",
        title: "Cannot Enhance",
        description: "Please provide a basic justification first.",
      });
      return;
    }
    setEnhancingIndex(index);
    try {
      const result = await enhanceJustification({ itemName, justification });
      form.setValue(`requests.${index}.justification`, result.enhancedJustification, {
        shouldValidate: true,
      });
      toast({
        title: "Justification Enhanced",
        description: "The justification has been updated with AI.",
      });
    } catch (error) {
      console.error("Error enhancing justification:", error);
      toast({
        variant: "destructive",
        title: "Enhancement Failed",
        description: "Could not enhance the justification. Please try again.",
      });
    } finally {
      setEnhancingIndex(null);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to add a request.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await addRequestToBucket(bucketId, {
        requests: data.requests,
        requestedById: currentUser.uid,
      });

      toast({
        title: "Item Request Added",
        description: bucketId 
          ? "Your request has been added to the bucket."
          : "Your standalone request has been submitted.",
      });
      onFormSubmit();
      setOpen(false);
    } catch (error) {
      console.error("Error adding request:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not add your request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const submitButtonText = bucketId ? "Add Item to Bucket" : "Submit Single Request";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-grow overflow-hidden">
            <ScrollArea className="h-full">
            <div className="space-y-4 pr-4">
                {fields.map((field, index) => (
                <div key={field.id} className="space-y-4 rounded-md border p-4 relative">
                    {fields.length > 1 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => remove(index)}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    )}
                    <FormField
                    control={form.control}
                    name={`requests.${index}.itemName`}
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
                        name={`requests.${index}.quantity`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} min={1} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`requests.${index}.estimatedCost`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estimated cost / piece</FormLabel>
                            <FormControl>
                            <Input type="number" step="0.01" placeholder="1500.00" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                    <FormField
                    control={form.control}
                    name={`requests.${index}.justification`}
                    render={({ field }) => (
                        <FormItem>
                        <div className="flex justify-between items-center">
                            <FormLabel>Justification</FormLabel>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleEnhanceJustification(index)} disabled={enhancingIndex === index || isSubmitting}>
                                {enhancingIndex === index ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Enhance
                            </Button>
                        </div>
                        <FormControl>
                            <Textarea
                            placeholder="Why is this item needed? e.g., 'To replace a broken camera on Project Phoenix.'"
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
                    name={`requests.${index}.isPerishable`}
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
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
                </div>
                ))}
            </div>
            </ScrollArea>
        </div>

        <div className="py-2 flex-shrink-0">
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => append({ itemName: "", justification: "", quantity: 1, estimatedCost: 0, isPerishable: false })}
                >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Another Item
            </Button>
        </div>


        <div className="pt-4 border-t flex-shrink-0">
          <Button type="submit" disabled={isSubmitting || enhancingIndex !== null} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
