
"use client"

import React, { useState } from 'react'
import { AlertCircle, CheckCircle, Loader2, Upload, Image as ImageIcon, Sparkles, X } from 'lucide-react'
import { upload } from "@imagekit/next"

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/auth-context'
import { addProjectUpdate } from './actions'
import Image from 'next/image'
import type { Project } from '../page'
import { enhanceUpdate } from '@/ai/flows/enhance-update'
import { useToast } from '@/hooks/use-toast'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

interface NewUpdateFormProps {
  project: Project;
  setOpen: (open: boolean) => void;
  onFormSubmit: () => void;
}

export function NewUpdateForm({ project, setOpen, onFormSubmit }: NewUpdateFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' | '' }>({ text: '', type: '' });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...imageFiles]);
      const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
      setMessage({ text: '', type: '' });
    } else if (files.length > 0) {
      setMessage({ text: 'Please select valid image files.', type: 'error' });
    }
     // Reset the input value to allow selecting the same file again
    e.target.value = '';
  }

  const handleRemoveImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }


  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleEnhanceUpdate = async () => {
    if (!text && selectedFiles.length === 0) {
        toast({
            variant: "destructive",
            title: "Cannot Enhance",
            description: "Please provide some text or an image for the update first.",
        });
        return;
    }
    setIsEnhancing(true);
    try {
        let imageUri: string | undefined = undefined;
        if (selectedFiles.length > 0) {
            imageUri = await fileToDataUri(selectedFiles[0]);
        }

        const result = await enhanceUpdate({
            projectTitle: project.title,
            projectDescription: project.description,
            updateText: text,
            updateImage: imageUri,
        });

        setText(result.enhancedUpdateText);
        toast({
            title: "Update Enhanced",
            description: "The update text has been refined with AI.",
        });
    } catch (error) {
        console.error("Error enhancing update:", error);
        toast({
            variant: "destructive",
            title: "Enhancement Failed",
            description: "Could not enhance the update. Please try again.",
        });
    } finally {
        setIsEnhancing(false);
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
     if (!text && selectedFiles.length === 0) {
      setMessage({ text: 'Update must include text or an image.', type: 'error' })
      return
    }

    setIsSubmitting(true);
    setMessage({ text: 'Posting update...', type: 'info' });

    try {
      let imageUrls: string[] | null = null;

      if (selectedFiles.length > 0) {
        imageUrls = [];
        
        for (const file of selectedFiles) {
            const authParams = await authenticator();
            const uploadResponse = await upload({
              file: file,
              fileName: file.name,
              ...authParams,
              publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY as string,
            });
            imageUrls.push(uploadResponse.url);
        }
      }
      
      await addProjectUpdate({
        projectId: project.id,
        text,
        imageUrls,
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
      <div className="space-y-2">
         <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Update Details</label>
             <Button type="button" variant="ghost" size="sm" onClick={handleEnhanceUpdate} disabled={isEnhancing || isSubmitting}>
                {isEnhancing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Enhance with AI
            </Button>
          </div>
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
            multiple
          />
           {previews.length === 0 ? (
                <label
                    htmlFor="update-image-upload"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors"
                >
                    <div className="text-center text-muted-foreground">
                        <ImageIcon className="mx-auto h-8 w-8" />
                        <p className="mt-2 text-sm">Click to add images (optional)</p>
                    </div>
                </label>
           ) : (
             <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                    {previews.map((src, index) => (
                        <div key={src} className="relative group">
                            <Image
                                src={src}
                                alt={`Preview ${index + 1}`}
                                width={150}
                                height={150}
                                className="h-24 w-full object-cover rounded-md border"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveImage(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                     <label
                        htmlFor="update-image-upload"
                        className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors text-muted-foreground"
                    >
                        <Upload className="h-6 w-6"/>
                        <span className="text-xs mt-1">Add more</span>
                    </label>
                </div>
             </div>
           )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || isEnhancing}
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
