"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth"
import { Loader2 } from "lucide-react"

import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

function ResetPasswordFormComponent() {
  const [newPassword, setNewPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isValidCode, setIsValidCode] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const oobCode = searchParams.get('oobCode')

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setIsValidCode(false)
        setIsVerifying(false)
        toast({
          variant: "destructive",
          title: "Invalid Link",
          description: "The password reset link is missing or invalid.",
        })
        router.push("/login")
        return
      }

      try {
        await verifyPasswordResetCode(auth, oobCode)
        setIsValidCode(true)
      } catch (error) {
        setIsValidCode(false)
        toast({
          variant: "destructive",
          title: "Invalid or Expired Link",
          description: "The password reset link is invalid or has expired. Please request a new one.",
        })
        router.push("/login")
      } finally {
        setIsVerifying(false)
      }
    }

    verifyCode()
  }, [oobCode, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oobCode) return

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Password Too Weak",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    setIsLoading(true)
    try {
      await confirmPasswordReset(auth, oobCode, newPassword)
      toast({
        title: "Password Reset Successful",
        description: "You can now log in with your new password.",
      })
      router.push("/login")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "An error occurred. The link may have expired.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="Enter your new password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Reset Password
      </Button>
    </form>
  )
}


export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-2">
            <Image src="/assets/logo.png" alt="RC-Club Logo" width={32} height={32} className="size-8" />
            <h1 className="text-2xl font-bold tracking-tighter font-headline">
              RC-Club
            </h1>
          </div>
          <CardTitle className="text-2xl font-headline">Reset Your Password</CardTitle>
          <CardDescription>
            Enter a new password below to regain access to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <ResetPasswordFormComponent />
          </Suspense>
          <div className="mt-4 text-center text-sm">
            Remember your password?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}