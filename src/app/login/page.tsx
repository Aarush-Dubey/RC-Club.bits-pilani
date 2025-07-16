
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { BarChart, Loader2 } from "lucide-react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

const devUsers: Record<string, string> = {
  admin: 'alex.doe@example.com',
  coordinator: 'jane.smith@example.com',
  inventory_manager: 'sam.wilson@example.com',
  drone_lead: 'peter.jones@example.com',
  plane_lead: 'mary.jane@example.com',
  member: 'member.fresh@example.com',
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isBypassLoading, setIsBypassLoading] = useState(false)
  const [bypassRole, setBypassRole] = useState("inventory_manager")
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (emailToLogin: string, passwordToLogin: string) => {
    try {
      await signInWithEmailAndPassword(auth, emailToLogin, passwordToLogin)
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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await handleLogin(email, password)
    setIsLoading(false)
  }

  const handleBypass = async () => {
    setIsBypassLoading(true)
    await handleLogin(devUsers[bypassRole], "password") // Assuming all dev users have this password
    setIsBypassLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-2">
            <BarChart className="size-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tighter font-headline">
              RC Club Manager
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
          
          {process.env.NODE_ENV === 'development' && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <p className="text-center text-sm text-muted-foreground">For Development Only</p>
                <div className="space-y-2">
                    <Label htmlFor="role-select">Bypass Login As</Label>
                     <Select value={bypassRole} onValueChange={setBypassRole}>
                        <SelectTrigger id="role-select">
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="inventory_manager">Inventory Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="coordinator">Coordinator</SelectItem>
                            <SelectItem value="drone_lead">Drone Lead</SelectItem>
                            <SelectItem value="plane_lead">Plane Lead</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="secondary" className="w-full" onClick={handleBypass} disabled={isBypassLoading}>
                    {isBypassLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Bypass Login
                </Button>
              </div>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
