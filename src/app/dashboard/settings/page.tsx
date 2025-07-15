
"use client"

import { useAuth } from "@/context/auth-context"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

import { changeUserPassword, updateUserProfile } from "./actions"

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Current password is required." }),
    newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type PasswordFormValues = z.infer<typeof passwordFormSchema>

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const { toast } = useToast()

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.displayName || "",
      email: user?.email || "",
    },
    values: { // Use values to update the form when user data is loaded
      name: user?.displayName || "",
      email: user?.email || "",
    }
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onProfileSubmit(data: ProfileFormValues) {
    try {
      await updateUserProfile(data.name)
      toast({
        title: "Profile Updated",
        description: "Your name has been successfully updated.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: (error as Error).message,
      })
    }
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    try {
      await changeUserPassword(data.currentPassword, data.newPassword)
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      })
      passwordForm.reset()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Password Change Failed",
        description: (error as Error).message,
      })
    }
  }

  if (loading || !user) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="Your email" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                        {profileForm.formState.isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Update Profile
                    </Button>
                </form>
                </Form>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password. Please enter your current password to proceed.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                         {passwordForm.formState.isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Change Password
                    </Button>
                </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  )
}
