
"use server"

import { db } from "@/lib/firebase";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// Helper to convert Firestore Timestamps to JSON-serializable strings
const serializeData = (doc: any): any => {
    const data = doc.data();
    if (!data) return null;

    const serializedData: { [key: string]: any } = {};

    // Convert all Timestamp fields to ISO strings
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            if (data[key]?.toDate) {
                serializedData[key] = data[key].toDate().toISOString();
            } else {
                serializedData[key] = data[key];
            }
        }
    }
    return { id: doc.id, ...serializedData };
};


export async function getUsers() {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(serializeData);
    
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
