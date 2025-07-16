
"use server"

import { db } from "@/lib/firebase";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function getUsers() {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // For simplicity, fetching all possible roles from the seed file.
    // In a real app, this might come from a dedicated 'roles' collection.
    const roles = ['admin', 'coordinator', 'treasurer', 'inventory_manager', 'drone_lead', 'plane_lead', 'member'];
    
    return { users, roles };
}

export async function updateUserRole(userId: string, newRole: string) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
        role: newRole
    });
    revalidatePath("/dashboard/manage-club/users");
}
