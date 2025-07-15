
"use client"

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { createProcurementBucket } from "./actions";

const formSchema = z.object({
  description: z.string().min(10, "Please provide a brief description or purpose for this bucket."),
});

type FormValues = z.infer<typeof formSchema>;

interface NewBucketFormProps {
  currentUser: AppUser | null;
  setOpen: (open: boolean) => void;
  onFormSubmit: () => void;
}

export function NewBucketForm({ currentUser, setOpen, onFormSubmit }: NewBucketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to create a bucket.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await createProcurementBucket({
        description: data.description,
        createdById: currentUser.uid,
      });

      toast({
        title: "Bucket Created",
        description: "The new procurement bucket is now open for requests.",
      });
      onFormSubmit();
      setOpen(false);
    } catch (error) {
      console.error("Error creating bucket:", error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "Could not create the bucket. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., 'Q3 Parts Order for Drone Maintenance' or 'Combined order from HobbyKing'"
                  {...field}
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Bucket
        </Button>
      </form>
    </Form>
  );
}
