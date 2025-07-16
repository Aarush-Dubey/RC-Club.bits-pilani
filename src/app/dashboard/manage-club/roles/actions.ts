
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
        const permissions = doc.data();
        const enabledPermissions = Object.entries(permissions)
            .filter(([, value]) => value === true)
            .map(([key]) => key);

        return {
            id: doc.id,
            permissions: enabledPermissions.sort()
        };
    });

    return roles;
}
