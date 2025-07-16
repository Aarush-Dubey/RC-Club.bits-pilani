
"use server"

import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

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
                obj[key] = value;
                return obj;
            }, {} as Record<string, boolean>);

        return {
            id: doc.id,
            permissions: sortedPermissions,
        };
    });

    return roles;
}
