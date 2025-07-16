
"use client"

import React, { useState, useEffect } from 'react'
import { addDoc, collection, doc, serverTimestamp } from 'firebase/firestore'
import { AlertCircle, CheckCircle, Loader2, Upload } from 'lucide-react'
import { upload } from "@imagekit/next"

import { db } from '@/lib/firebase'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AppUser } from '@/context/auth-context'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ReimbursementFormProps {
  setOpen: (open: boolean) => void;
  onFormSubmit: () => void;
  currentUser: AppUser | null;
  procurementItems: any[];
  procurementBuckets: any[];
}

const ReimbursementFormComponent = ({ setOpen, onFormSubmit, currentUser, procurementItems, procurementBuckets }: ReimbursementFormProps) => {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' | '' }>({ text: '', type: '' });
  const [isForProcurement, setIsForProcurement] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const { toast } = useToast();

  const orderedItems = procurementItems.filter(item => {
    // A single request that is approved and requested by the user is eligible for reimbursement.
    if (!item.linkedBucketId && item.status === 'approved' && item.requestedById === currentUser?.uid) {
        return true;
    }
    // An item in a bucket is eligible if the item is approved AND the bucket is ordered/received AND the bucket was created by the current user.
    if(item.linkedBucketId) {
        const bucket = procurementBuckets.find(b => b.id === item.linkedBucketId);
        if (bucket && ['ordered', 'received'].includes(bucket.status) && item.status === 'approved' && bucket.createdBy === currentUser?.uid) {
            return true;
        }
    }
    return false;
  });

  useEffect(() => {
    if (isForProcurement && selectedItemId) {
      const selectedItem = orderedItems.find(item => item.id === selectedItemId);
      if (selectedItem) {
        setAmount((selectedItem.estimatedCost * selectedItem.quantity).toString());
        setNotes(`Reimbursement for: ${selectedItem.itemName} (x${selectedItem.quantity})`);
      }
    } else {
      setAmount("");
      setNotes("");
    }
  }, [selectedItemId, isForProcurement, orderedItems]);

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
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      const { signature, expire, token } = data;
      return { signature, expire, token };
    } catch (error) {
      throw new Error("Authentication request failed. Check your server logs.");
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
    if (isForProcurement && !selectedItemId) {
        setMessage({ text: 'Please select the procured item.', type: 'error' })
        return
    }

    setUploading(true)
    setMessage({ text: 'Submitting request...', type: 'info' })

    try {
      const authParams = await authenticator();
      const uploadResponse = await upload({
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
        ...authParams,
        file: selectedFile,
        fileName: selectedFile.name,
      });

      const downloadURL = uploadResponse.url;

      const reimbursementData: any = {
        amount: parseFloat(amount),
        notes,
        proofImageUrls: [downloadURL],
        status: 'pending',
        submittedById: currentUser.uid,
        createdAt: serverTimestamp(),
      };
      
      if (isForProcurement && selectedItemId) {
        reimbursementData.newItemRequestId = selectedItemId;
      }

      await addDoc(collection(db, 'reimbursements'), reimbursementData);

      setMessage({ text: 'Reimbursement request submitted successfully!', type: 'success' })
      onFormSubmit();
      setTimeout(() => {
        setOpen(false)
      }, 1500)
    } catch (error) {
        console.error('Submission error:', error)
        const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred.';
        setMessage({ text: errorMessage, type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <ScrollArea className="h-[70vh] sm:h-auto">
      <form onSubmit={handleSubmit} className="space-y-4 pr-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="procurement-toggle" 
            checked={isForProcurement}
            onCheckedChange={setIsForProcurement}
          />
          <Label htmlFor="procurement-toggle">Is this for a pre-approved procurement item?</Label>
        </div>

        {isForProcurement && (
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
            disabled={isForProcurement}
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
            disabled={isForProcurement}
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
                <img
                  src={preview}
                  alt="Receipt Preview"
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

        <Button
          type="submit"
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Request'
          )}
        </Button>

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
  )
}

export const ReimbursementForm = React.memo(ReimbursementFormComponent);
