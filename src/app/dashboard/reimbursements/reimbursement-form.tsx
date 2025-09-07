
"use client"

import React, { useState, useEffect } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { AlertCircle, CheckCircle, Loader2, Upload } from 'lucide-react'
import { upload } from "@imagekit/next"
import Image from 'next/image';

import { db } from '@/lib/firebase'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AppUser } from '@/context/auth-context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'


interface ReimbursementFormProps {
  mode: 'procurement' | 'manual';
  onFormSubmit: () => void;
  onCancel: () => void;
  currentUser: AppUser | null;
  procurementItems: any[];
  procurementBuckets: any[];
}

export function ReimbursementForm({ mode, onFormSubmit, onCancel, currentUser, procurementItems, procurementBuckets }: ReimbursementFormProps) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' | '' }>({ text: '', type: '' });
  const [selectedItemId, setSelectedItemId] = useState("");
  const { toast } = useToast();

  const orderedItems = procurementItems.filter(item => {
    if (!item.linkedBucketId && item.status === 'approved' && item.requestedById === currentUser?.uid) {
        return true;
    }
    if(item.linkedBucketId) {
        const bucket = procurementBuckets.find(b => b.id === item.linkedBucketId);
        if (bucket && ['ordered', 'received'].includes(bucket.status) && item.status === 'approved' && bucket.createdBy === currentUser?.uid) {
            return true;
        }
    }
    return false;
  });

  useEffect(() => {
    if (mode === 'procurement' && selectedItemId) {
      const item = orderedItems.find(item => item.id === selectedItemId);
      if (item) {
        setAmount((item.estimatedCost * item.quantity).toString());
        setNotes(`Reimbursement for: ${item.itemName} (x${item.quantity})`);
      }
    }
  }, [selectedItemId, mode, orderedItems]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file)
        setPreview(URL.createObjectURL(file))
        setMessage({ text: '', type: '' })
      } else {
        setMessage({ text: 'Please select a valid image file.', type: 'error' })
        setSelectedFile(null)
        setPreview('')
      }
    }
  }

  const authenticator = async () => {
    try {
      const response = await fetch('/api/upload-auth');
      const data = await response.json();
      if (!response.ok) {
          // If the server returns an error, try to parse it and throw
          throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      return { signature: data.signature, expire: data.expire, token: data.token };
    } catch (error) {
      console.error("Authenticator error:", error);
      // Re-throw the error to be caught by the handleSubmit function
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
        toast({ variant: "destructive", title: "Not Authenticated" });
        return;
    }
     if (!amount || !selectedFile) {
      setMessage({ text: 'Amount and receipt image are required.', type: 'error' })
      return
    }
    if (mode === 'procurement' && !selectedItemId) {
        setMessage({ text: 'Please select the procured item.', type: 'error' })
        return
    }

    setIsSubmitting(true)
    setMessage({ text: 'Submitting request...', type: 'info' })

    try {
      const authParams = await authenticator();
      const uploadResponse = await upload({
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
        ...authParams,
        file: selectedFile,
        fileName: selectedFile.name,
      });

      const reimbursementData: any = {
        amount: parseFloat(amount),
        notes,
        proofImageUrls: [uploadResponse.url],
        status: 'pending',
        submittedById: currentUser.uid,
        createdAt: serverTimestamp(),
        isProcurement: mode === 'procurement',
      };
      
      if (mode === 'procurement' && selectedItemId) {
        reimbursementData.newItemRequestId = selectedItemId;
      }

      await addDoc(collection(db, 'reimbursements'), reimbursementData);

      setMessage({ text: 'Reimbursement request submitted successfully!', type: 'success' })
      setTimeout(() => onFormSubmit(), 1500)

    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred.';
        setMessage({ text: errorMessage, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = mode === 'procurement' ? "Pre-approved Item" : "New Reimbursement";
  const description = mode === 'procurement' ? "Select your ordered item to auto-fill details." : "Fill out the details for your expense.";

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <ScrollArea className="max-h-[60vh] -mx-4">
        <form onSubmit={handleSubmit} className="space-y-4 px-4">
          {mode === 'procurement' && (
            <div>
              <Label htmlFor="procurement-item">Procurement Item *</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger id="procurement-item" className="mt-1">
                    <SelectValue placeholder="Select an ordered item" />
                </SelectTrigger>
                <SelectContent>
                    {orderedItems.length > 0 ? orderedItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                            {item.itemName} (₹{(item.estimatedCost * item.quantity).toFixed(2)})
                        </SelectItem>
                    )) : (
                        <SelectItem value="none" disabled>No items awaiting reimbursement.</SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="amount">Amount (INR) *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="mt-1"
              disabled={mode === 'procurement'}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Purchase of new servos for Project Phoenix"
              className="mt-1"
              disabled={mode === 'procurement'}
            />
          </div>

          <div>
            <Label htmlFor="receipt-upload">Receipt Image *</Label>
            <div className="mt-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="receipt-upload"
              />
              <label
                htmlFor="receipt-upload"
                className="flex items-center justify-center w-full h-40 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors"
              >
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
            </div>
          </div>
          
           {message.text && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'error' && <AlertCircle className="h-4 w-4" />}
              {message.type === 'success' && <CheckCircle className="h-4 w-4" />}
              <AlertTitle>
                {message.type === 'error' ? 'Error' : message.type === 'success' ? 'Success' : 'Info'}
              </AlertTitle>
              <AlertDescription>
                {message.text}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </ScrollArea>
      <div className="pt-4 border-t flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full">Back</Button>
            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                onClick={handleSubmit}
            >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Request'}
            </Button>
        </div>
    </>
  )
}

    