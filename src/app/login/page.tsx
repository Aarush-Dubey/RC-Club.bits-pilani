
"use client"
/**
 * This file defines the login page for the application.
 * It provides a user interface for signing in with either email and password or Google,
 * and handles the authentication logic using Firebase. It also checks if a user's email
 * is on a whitelist before allowing them to log in.
 */
console.log("Hello Login started")
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
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

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.918l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.08,44,30.019,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    console.log('auth instance:', auth);
    console.log('auth.constructor.name:', auth?.constructor?.name);
    const provider = new GoogleAuthProvider();
    console.log('provider instance:', provider);
    console.log('provider instanceof GoogleAuthProvider:', provider instanceof GoogleAuthProvider);
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user exists in whitelist
        const q = query(collection(db, "allowed_emails"), where("email", "==", user.email!.toLowerCase()), limit(1));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            toast({
                variant: "destructive",
                title: "Access Denied",
                description: "This email address is not authorized. Please contact an administrator.",
            });
            await auth.signOut(); // Sign out the user
            setIsGoogleLoading(false);
            return;
        }

        // Check if user document exists in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // User is new, create a document for them
            await setDoc(userDocRef, {
                id: user.uid,
                name: user.displayName,
                email: user.email,
                role: "probationary", // Default role
                createdAt: serverTimestamp(),
                joinedProjects: [],
                checkout_items: [],
                reimbursement: [],
                procurement: [],
            });
        }
        
        toast({
            title: "Login Successful",
            description: "Welcome back!",
        });
        window.location.href = 'https://rc-club-bits-pilani.vercel.app/dashboard';
    } catch (error: any) {
        console.error("Google Sign-In Error:", error);
        let errorMessage = `An error occurred: ${error.message} (Code: ${error.code})`;
        toast({
            variant: "destructive",
            title: "Google Sign-In Failed",
            description: errorMessage,
        });
    } finally {
        setIsGoogleLoading(false);
    }
  }

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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign In
            </Button>
          </form>

           <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
          </div>
          
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            Google
          </Button>

          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
console.log("Hello Login finised")


    