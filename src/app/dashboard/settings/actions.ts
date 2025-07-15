
"use server"

import { revalidatePath } from "next/cache"
import { auth, db } from "@/lib/firebase"
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"

export async function updateUserProfile(name: string) {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User not found.")
  }

  // Update Firebase Auth profile
  await updateProfile(user, { displayName: name })

  // Update Firestore document
  const userDocRef = doc(db, "users", user.uid)
  await updateDoc(userDocRef, { name: name })

  revalidatePath("/dashboard/settings")
}

export async function changeUserPassword(currentPassword: string, newPassword: string) {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error("User not found or email is not available.");
    }
  
    try {
      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
  
      // If re-authentication is successful, update the password
      await updatePassword(user, newPassword);
      
      console.log("Password updated successfully.");
    } catch (error: any) {
      console.error("Password change error:", error);
      // Provide a more user-friendly error message
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error("The current password you entered is incorrect. Please try again.");
      }
      throw new Error("Failed to change password. Please try again later.");
    }
  }
