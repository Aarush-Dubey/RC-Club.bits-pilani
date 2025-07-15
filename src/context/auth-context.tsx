
"use client"

import type { User } from "firebase/auth"
import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"

import { auth, db } from "@/lib/firebase"

export type Permissions = {
  [key: string]: boolean;
};

// Extend the User type to include our custom Firestore data
export type AppUser = User & {
  role?: string;
  permissions?: Permissions;
  // add other custom fields here
};


type AuthContextType = {
  user: AppUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, now fetch their Firestore data
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const role = userData.role || 'member'; // Default to member role
          let permissions: Permissions = {};
          
          // Fetch permissions for the role
          const permissionDocRef = doc(db, "permissions", role);
          const permissionDocSnap = await getDoc(permissionDocRef);
          if (permissionDocSnap.exists()) {
            permissions = permissionDocSnap.data() as Permissions;
          }

          setUser({
            ...firebaseUser,
            role,
            permissions,
          });
        } else {
          // Handle case where user exists in Auth but not in Firestore
          setUser(firebaseUser);
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
