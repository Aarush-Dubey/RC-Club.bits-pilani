
"use client"

import React, { useState } from 'react'
import { AlertCircle, CheckCircle, Loader2, Upload, Image as ImageIcon } from 'lucide-react'
import { upload } from "@imagekit/next"

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/auth-context'
import { addProjectUpdate } from './actions'
import Image from 'next/image'

interface NewUpdateFormProps {
  projectId: string;
  setOpen: (open: boolean) => void;
  onFormSubmit: () => void;
}

export function NewUpdateForm({ projectId, setOpen, onFormSubmit }: NewUpdateFormProps) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' | '' }>({ text: '', type: '' });

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
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const data = await response.json();
      const { signature, expire, token } = data;
      return { signature, expire, token };
    } catch (error) {
      throw new Error("Authentication request failed. Check your server logs.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        setMessage({ text: 'You must be logged in to post an update.', type: 'error' });
        return;
    }
     if (!text && !selectedFile) {
      setMessage({ text: 'Update must include text or an image.', type: 'error' })
      return
    }

    setIsSubmitting(true);
    setMessage({ text: 'Posting update...', type: 'info' });

    try {
      let imageUrl: string | null = null;

      if (selectedFile) {
        const uploadResponse = await upload({
          file: selectedFile,
          fileName: selectedFile.name,
          authenticator,
        });
        imageUrl = uploadResponse.url;
      }
      
      await addProjectUpdate({
        projectId,
        text,
        imageUrl,
        userId: user.uid,
      });

      setMessage({ text: 'Update posted successfully!', type: 'success' });
      onFormSubmit();
      setTimeout(() => {
        setOpen(false);
      }, 1500);

    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's new? Share your progress..."
          rows={5}
          className="mt-1"
        />
      </div>

      <div>
        <div className="mt-1">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="update-image-upload"
          />
          <label
            htmlFor="update-image-upload"
            className="flex items-center justify-center w-full h-40 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors"
          >
            {preview ? (
              <Image
                src={preview}
                alt="Update Preview"
                width={300}
                height={160}
                className="h-full w-full object-contain rounded-md p-1"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <ImageIcon className="mx-auto h-8 w-8" />
                <p className="mt-2 text-sm">Click to add an image (optional)</p>
              </div>
            )}
          </label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Posting...
          </>
        ) : (
          'Post Update'
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
