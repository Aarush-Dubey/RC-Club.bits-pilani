
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { createNewItemRequest } from "./actions";
import { enhanceJustification } from "@/ai/flows/enhance-justification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const formSchema = z.object({
  itemName: z.string().min(3, "Item name must be at least 3 characters."),
  justification: z.string().min(10, "Please provide a brief justification."),
  itemType: z.enum(["consumable", "asset"], { required_error: "Please select an item type." }),
  expectedCost: z.coerce.number().min(0.01, "Please provide an estimated cost."),
});

type FormValues = z.infer<typeof formSchema>;

export function NewItemRequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: "",
      justification: "",
      itemType: "consumable",
      expectedCost: 0,
    },
  });

  const handleEnhanceJustification = async () => {
    const { itemName, justification } = form.getValues();
    if (!justification) {
      toast({
        variant: "destructive",
        title: "Cannot Enhance",
        description: "Please provide a basic justification first.",
      });
      return;
    }
    setIsEnhancing(true);
    try {
      const result = await enhanceJustification({ itemName, justification });
      form.setValue(`justification`, result.enhancedJustification, {
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
      setIsEnhancing(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Authentication Error" });
      return;
    }
    setIsSubmitting(true);
    try {
      await createNewItemRequest({ ...data, requestedById: currentUser.uid });
      toast({
        title: "Request Submitted",
        description: "Your request for a new item has been submitted for approval.",
      });
      router.push("/dashboard/procurement");
    } catch (error) {
      console.error("Error creating request:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: (error as Error).message,
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
            name="expectedCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Cost (₹)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="1500.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="itemType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Type</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="consumable">Consumable (e.g., props, filament)</SelectItem>
                      <SelectItem value="asset">Asset (e.g., tools, drones)</SelectItem>
                    </SelectContent>
                  </Select>
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
              <div className="flex justify-between items-center">
                <FormLabel>Justification</FormLabel>
                <Button type="button" variant="ghost" size="sm" onClick={handleEnhanceJustification} disabled={isEnhancing || isSubmitting}>
                  {isEnhancing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
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
        <Button type="submit" disabled={isSubmitting || isEnhancing} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Request for Approval
        </Button>
      </form>
    </Form>
  );
}

