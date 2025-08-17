
"use server"

import { db } from "@/lib/firebase";
import { collection, doc, getDocs, orderBy, query, setDoc, getDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function getRolesAndPermissions() {
    const permissionsCollection = collection(db, "permissions");
    const q = query(permissionsCollection, orderBy("__name__"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return [];
    }

    const roles = snapshot.docs.map(doc => {
        const permissionsData = doc.data();
        
        // Sort keys alphabetically
        const sortedPermissions = Object.entries(permissionsData)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .reduce((obj, [key, value]) => {
                (obj as Record<string, boolean>)[key] = value;
                return obj;
            }, {} as Record<string, boolean>);

        return {
            id: doc.id,
            permissions: sortedPermissions,
        };
    });

    return roles;
}


export async function createNewRole(roleName: string, permissions: Record<string, boolean>) {
    const roleId = roleName.toLowerCase().replace(/\s+/g, '_');
    const roleRef = doc(db, "permissions", roleId);

    const docSnapshot = await getDoc(roleRef);
    if (docSnapshot.exists()) {
        throw new Error(`Role '${roleId}' already exists.`);
    }

    await setDoc(roleRef, permissions);
    revalidatePath("/dashboard/manage-club/roles");
}

