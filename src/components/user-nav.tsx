
"use client"

import Link from "next/link"
import { LogOut, Settings, User as UserIcon } from "lucide-react"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"

import { useAuth } from "@/context/auth-context"
import { auth } from "@/lib/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"


export function UserNav() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast({ title: "Logged out successfully." })
      router.push("/login")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "An error occurred while logging out.",
      })
    }
  }
  
  if (!user) {
    return null
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || `https://i.pravatar.cc/150?u=${user.email}`} alt={`@${user.displayName}`} />
            <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
             {user.role && (
                <p className="text-xs leading-none text-muted-foreground capitalize pt-1">
                    Role: {user.role.replace(/_/g, ' ')}
                </p>
             )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/dashboard/settings" passHref>
            <DropdownMenuItem>
                <UserIcon />
                Profile
            </DropdownMenuItem>
          </Link>
          <Link href="/dashboard/settings" passHref>
            <DropdownMenuItem>
              <Settings />
              Settings
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
