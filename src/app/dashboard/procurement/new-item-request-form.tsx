
"use client";

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
import type { AppUser } from "@/context/auth-context";
import { addRequestToBucket } from "./actions";

const formSchema = z.object({
  itemName: z.string().min(3, "Item name must be at least 3 characters."),
  justification: z.string().min(10, "Please provide a brief justification."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  estimatedCost: z.coerce.number().min(0.01, "Please provide an estimated cost."),
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
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: "",
      justification: "",
      quantity: 1,
      estimatedCost: 0,
    },
  });

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
        ...data,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="itemName"
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
            name="quantity"
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
            name="estimatedCost"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Total Estimated Cost ($)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.01" placeholder="25.99" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="justification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Justification</FormLabel>
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
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitButtonText}
        </Button>
      </form>
    </Form>
  );
}
