
"use client"
/**
 * This file defines the login page for the application.
 * It provides a user interface for signing in with either email and password or Google,
 * and handles the authentication logic using Firebase. It also checks if a user's email
 * is on a whitelist before allowing them to log in.
 */
console.log("Hello Login started")
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { BarChart, Loader2 } from "lucide-react"
import { collection, query, where, getDocs, limit, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"


import { auth, db } from "@/lib/firebase"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // 1. Check if email is in the whitelist
      const q = query(collection(db, "allowed_emails"), where("email", "==", email.toLowerCase()), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "This email address is not authorized to access the platform.",
        });
        setIsLoading(false);
        return;
      }

      // 2. If whitelisted, attempt to sign in
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      })
      router.push("/dashboard")
    } catch (error: any) {
      let errorMessage = "An unknown error occurred."
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password. Please try again."
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({ variant: 'destructive', title: 'Email required', description: 'Please enter your email address.' });
        return;
    }
    setIsResetLoading(true);
    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({ title: 'Password Reset Email Sent', description: 'Check your inbox for a link to reset your password.' });
        setIsResetDialogOpen(false);
        setResetEmail('');
    } catch (error: any) {
        let errorMessage = 'An error occurred. Please try again.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No user found with this email address.';
        }
        toast({ variant: 'destructive', title: 'Reset Failed', description: errorMessage });
    } finally {
        setIsResetLoading(false);
    }
  };

  return (
    <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex items-center gap-2">
              <Image src="/assets/logo.png" alt="RC-Club Logo" width={32} height={32} className="size-8" />
              <h1 className="text-2xl font-bold tracking-tighter font-headline">
                RC-Club
              </h1>
            </div>
            <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                     <DialogTrigger asChild>
                        <button type="button" className="text-sm font-medium text-primary hover:underline">
                            Forgot Password?
                        </button>
                    </DialogTrigger>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign In
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
       <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Forgot Password</DialogTitle>
                <DialogDescription>
                    Enter your email address and we will send you a link to reset your password.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancel</Button>
                </DialogClose>
                <Button type="button" onClick={handlePasswordReset} disabled={isResetLoading}>
                    {isResetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}
console.log("Hello Login finised")


    