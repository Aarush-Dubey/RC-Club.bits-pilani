
"use client"

import { useState } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { Loader2 } from "lucide-react"

import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

// Mock current user - in a real app, this would come from an auth provider
const mockCurrentUser = { id: "user-5" }

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
})

type FormValues = z.infer<typeof formSchema>

interface NewProjectFormProps {
  onFormSubmit: () => void
}

export function NewProjectForm({ onFormSubmit }: NewProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "projects"), {
        ...data,
        createdById: mockCurrentUser.id,
        leadId: mockCurrentUser.id, // Creator is the initial lead
        memberIds: [mockCurrentUser.id], // Creator is the initial member
        status: "pending_approval",
        createdAt: serverTimestamp(),
        hasPendingReturns: false,
        newItemRequestIds: [],
        inventoryUsedIds: [],
      })
      toast({
        title: "Project Submitted",
        description: "Your project is now pending approval.",
      })
      onFormSubmit()
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not create the project. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., High-Speed FPV Drone" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the main goals and features of your project."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit for Approval
        </Button>
      </form>
    </Form>
  )
}
