
"use server"

import { db } from "@/lib/firebase";
import { collection, doc, getDocs, updateDoc, writeBatch, deleteDoc, orderBy, query, setDoc, getDoc } from "firebase/firestore";
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
    
    // Fetch roles dynamically from the permissions collection
    const permissionsSnapshot = await getDocs(query(collection(db, "permissions"), orderBy("__name__")));
    const roles = permissionsSnapshot.docs.map(doc => doc.id);
    
    return { users, roles };
}

export async function updateUserRole(userId: string, newRole: string) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
        role: newRole
    });
    revalidatePath("/dashboard/manage-club/users");
}

export async function getWhitelistedEmails() {
    const emailsQuery = query(collection(db, 'allowed_emails'), orderBy('email'));
    const snapshot = await getDocs(emailsQuery);
    return snapshot.docs.map(doc => doc.data().email as string);
}

export async function deleteWhitelistedEmail(email: string) {
    const emailRef = doc(db, 'allowed_emails', email);
    await deleteDoc(emailRef);
    revalidatePath("/dashboard/manage-club/users");
}

export async function addEmailToWhitelist(email: string) {
    if (!email || !email.includes('@')) {
        throw new Error("Invalid email address provided.");
    }
    const emailRef = doc(db, 'allowed_emails', email.toLowerCase().trim());
    await setDoc(emailRef, { email: email.toLowerCase().trim() });
    revalidatePath("/dashboard/manage-club/users");
}

export async function updateEmailWhitelist(emails: string[]) {
    const batch = writeBatch(db);
    const emailsCollection = collection(db, 'allowed_emails');
    
    // Add all new emails from the uploaded file
    const uniqueEmails = [...new Set(emails.map(email => email.toLowerCase().trim()))];
    uniqueEmails.forEach(email => {
        if (email) { // Ensure email is not an empty string
            const docRef = doc(emailsCollection, email);
            batch.set(docRef, { email });
        }
    });

    await batch.commit();
    revalidatePath("/dashboard/manage-club/users");
}
