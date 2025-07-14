
"use client"

import React, { useState } from 'react'
import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
import { AlertCircle, CheckCircle, Loader2, Upload } from 'lucide-react'
import {
    ImageKitAbortError,
    ImageKitInvalidRequestError,
    ImageKitServerError,
    ImageKitUploadNetworkError,
    upload,
} from "@imagekit/next";

import { db } from '@/lib/firebase'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Mock user for demo purposes
const mockUser = { id: 'user-5', name: 'Mary Jane' }

interface ReimbursementFormProps {
  setOpen: (open: boolean) => void;
  onFormSubmit: () => void;
}

export function ReimbursementForm({ setOpen, onFormSubmit }: ReimbursementFormProps) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' | '' }>({ text: '', type: '' })

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
        const errorText = await response.text();
        throw new Error(`Request failed with status ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      const { signature, expire, token } = data;
      return { signature, expire, token };
    } catch (error) {
      console.error("Authentication error:", error);
      throw new Error("Authentication request failed. Check your server logs.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !selectedFile) {
      setMessage({ text: 'Amount and receipt image are required.', type: 'error' })
      return
    }

    setUploading(true)
    setMessage({ text: 'Submitting request...', type: 'info' })

    try {
       // 1. Get Authentication Parameters
      const authParams = await authenticator();
      const { signature, expire, token } = authParams;

      // 2. Upload image to ImageKit
      const uploadResponse = await upload({
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
        signature,
        expire,
        token,
        file: selectedFile,
        fileName: selectedFile.name,
      });

      const downloadURL = uploadResponse.url;

      // 3. Save reimbursement request to Firestore
      await addDoc(collection(db, 'reimbursements'), {
        amount: parseFloat(amount),
        notes,
        proofImageUrls: [downloadURL],
        status: 'pending',
        submittedById: mockUser.id, // Using mock user ID
        createdAt: serverTimestamp(),
      })

      setMessage({ text: 'Reimbursement request submitted successfully!', type: 'success' })
      onFormSubmit(); // Revalidate data on the main page
      setTimeout(() => {
        setOpen(false)
      }, 1500)
    } catch (error) {
        console.error('Submission error:', error)
        let errorMessage = 'Submission failed. Please try again.';
        if (error instanceof ImageKitInvalidRequestError) {
          errorMessage = "Invalid request to ImageKit. Check your public key and authentication."
        } else if (error instanceof ImageKitUploadNetworkError || error instanceof ImageKitServerError) {
          errorMessage = "Network or server error during upload. Please try again."
        } else if (error instanceof Error && error.message.includes("Authentication")) {
          errorMessage = "Could not authenticate with ImageKit. Please check your API keys and endpoint configuration."
        }
      setMessage({ text: errorMessage, type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="amount">Amount *</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
          className="mt-1"
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
  )
}
