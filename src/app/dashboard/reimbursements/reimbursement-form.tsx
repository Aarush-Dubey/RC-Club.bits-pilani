
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { upload } from "@imagekit/next";
import Image from 'next/image';
import { Loader2, Upload } from 'lucide-react';
import { type AppUser } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { createReimbursementRequest } from './actions';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, "Please enter the amount."),
  reason: z.string().min(5, "A reason is required."),
  receipt: z.instanceof(File, { message: "A receipt image is required." }),
});

type FormValues = z.infer<typeof formSchema>;

interface ReimbursementFormProps {
  onFormSubmit: () => void;
  currentUser: AppUser | null;
}

export function ReimbursementForm({ onFormSubmit, currentUser }: ReimbursementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState('');
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      reason: "",
    }
  });

  const authenticator = async () => {
    try {
      const response = await fetch('/api/upload-auth');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication request failed: ${errorText}`);
      }
      const data = await response.json();
      return { signature: data.signature, expire: data.expire, token: data.token };
    } catch (error: any) {
      console.error("Authenticator error:", error);
      throw new Error(`Failed to get upload signature: ${error.message}`);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Not authenticated.' });
        return;
    }
    if (!data.receipt) {
        toast({ variant: 'destructive', title: 'Receipt image is required.' });
        return;
    }

    setIsSubmitting(true);
    try {
      const authParams = await authenticator();
      const uploadResponse = await upload({
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
        ...authParams,
        file: data.receipt,
        fileName: data.receipt.name,
      });

      await createReimbursementRequest({
        submittedById: currentUser.uid,
        amount: data.amount,
        reason: data.reason,
        receiptUrl: uploadResponse.url,
      });
      
      toast({ title: 'Success', description: 'Your reimbursement request has been submitted.' });
      onFormSubmit();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (₹) *</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason *</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Purchased snacks for club meeting" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="receipt"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>Receipt Image *</FormLabel>
              <FormControl>
                 <label
                    htmlFor="receipt-upload-general"
                    className="flex items-center justify-center w-full h-40 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors"
                  >
                     <input
                      id="receipt-upload-general"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onChange(file);
                          setPreview(URL.createObjectURL(file));
                        }
                      }}
                      {...rest}
                    />
                    {preview ? (
                      <Image
                        src={preview}
                        alt="Receipt Preview"
                        width={200}
                        height={160}
                        className="h-full w-full object-contain rounded-md p-1"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Upload className="mx-auto h-8 w-8" />
                        <p className="mt-2 text-sm">Click to select an image</p>
                      </div>
                    )}
                  </label>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Request
        </Button>
      </form>
    </Form>
  );
}
