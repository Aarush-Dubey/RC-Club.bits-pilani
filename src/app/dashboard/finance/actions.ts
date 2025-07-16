
"use server"

import { db } from "@/lib/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, runTransaction, getDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// ----- Balance Sheet Actions -----

export async function addAccount(data: { name: string; group: string; balance: number }) {
  const accountsCollection = collection(db, "accounts");
  await addDoc(accountsCollection, {
    ...data,
    createdAt: serverTimestamp(),
  });
  revalidatePath("/dashboard/finance");
}

export async function updateAccount(accountId: string, newBalance: number) {
  const accountRef = doc(db, "accounts", accountId);
  await updateDoc(accountRef, {
    balance: newBalance,
  });
  revalidatePath("/dashboard/finance");
}

export async function deleteAccount(accountId: string) {
  const accountRef = doc(db, "accounts", accountId);
  await deleteDoc(accountRef);
  revalidatePath("/dashboard/finance");
}


// ----- Logbook Actions -----

export async function addLogbookEntry(data: { date: string; assetGroup: string; account: string; description: string; debit?: number; credit?: number; }) {
    await runTransaction(db, async (transaction) => {
        const logbookCollection = collection(db, "logbook");
        
        const newEntryData: any = {
            ...data,
            createdAt: serverTimestamp()
        };

        const newEntryRef = doc(logbookCollection);
        transaction.set(newEntryRef, newEntryData);
    });

    revalidatePath("/dashboard/finance");
}

export async function updateLogbookEntry(logId: string, data: { date: string; assetGroup: string; account: string; description: string; debit?: number; credit?: number; }) {
    const logRef = doc(db, "logbook", logId);
    await updateDoc(logRef, data);
    revalidatePath("/dashboard/finance");
}

export async function deleteLogbookEntry(logId: string) {
    const logRef = doc(db, "logbook", logId);
    await deleteDoc(logRef);
    revalidatePath("/dashboard/finance");
}
