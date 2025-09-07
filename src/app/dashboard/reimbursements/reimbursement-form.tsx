
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { upload } from "@imagekit/next";
import Image from 'next/image';
import { Loader2, Upload } from 'lucide-react';
import { useAuth, type AppUser } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { createReimbursementRequest } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  procurementRequestId: z.string().min(1, "Please select the item you purchased."),
  actualCost: z.coerce.number().min(0.01, "Please enter the actual cost."),
  vendor: z.string().optional(),
  receipt: z.instanceof(File, { message: "A receipt image is required." }),
});

type FormValues = z.infer<typeof formSchema>;

interface ReimbursementFormProps {
  onFormSubmit: () => void;
  currentUser: AppUser | null;
  procurementRequests: any[];
}

export function ReimbursementForm({ onFormSubmit, currentUser, procurementRequests }: ReimbursementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState('');
  const { toast } = useToast();

  const userPurchasedItems = procurementRequests.filter(
    (req) => req.requestedById === currentUser?.uid && req.status === 'approved'
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const selectedRequestId = form.watch("procurementRequestId");

  useEffect(() => {
    if (selectedRequestId) {
      const item = userPurchasedItems.find(req => req.id === selectedRequestId);
      if (item) {
        form.setValue("actualCost", item.expectedCost);
      }
    }
  }, [selectedRequestId, userPurchasedItems, form]);
  
  const authenticator = async () => {
    try {
        const response = await fetch('/api/upload-auth');
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Request failed with status ${response.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        const data = await response.json();
        return { signature: data.signature, expire: data.expire, token: data.token };
    } catch (error: any) {
        console.error("Authenticator error:", error);
        throw new Error(`Failed to get upload signature: ${error.message}`);
    }
  };


  const onSubmit = async (data: FormValues) => {
    if (!currentUser) return;

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
        ...data,
        receiptUrl: uploadResponse.url,
        submittedById: currentUser.uid,
      });
      
      toast({ title: 'Success', description: 'Reimbursement request submitted.' });
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
          name="procurementRequestId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchased Item *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an approved item" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {userPurchasedItems.length > 0 ? userPurchasedItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.itemName} (Est: ₹{item.expectedCost.toFixed(2)})
                    </SelectItem>
                  )) : <SelectItem value="none" disabled>No approved items to reimburse</SelectItem>}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="actualCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Actual Cost (₹) *</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vendor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Amazon, Robu.in" {...field} />
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
                    htmlFor="receipt-upload"
                    className="flex items-center justify-center w-full h-40 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors"
                  >
                     <input
                      id="receipt-upload"
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
          Submit Reimbursement
        </Button>
      </form>
    </Form>
  );
}

