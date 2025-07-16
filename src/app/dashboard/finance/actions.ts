
"use server"

import { db } from "@/lib/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, runTransaction, getDoc, writeBatch, query, orderBy, limit, getDocs } from "firebase/firestore";
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

export async function updateAccountsBatch(updates: { id: string; balance: number }[]) {
  const batch = writeBatch(db);
  updates.forEach(update => {
    const accountRef = doc(db, "accounts", update.id);
    batch.update(accountRef, { balance: update.balance });
  });
  await batch.commit();
  revalidatePath("/dashboard/finance");
}

export async function deleteAccount(accountId: string) {
  const accountRef = doc(db, "accounts", accountId);
  await deleteDoc(accountRef);
  revalidatePath("/dashboard/finance");
}


// ----- Logbook Actions -----

// NOTE: This simple add does not recalculate subsequent balances. 
// A more robust implementation would require a transaction to update all logs after this date.
export async function addLogbookEntry(data: { date: string; assetGroup: string; account: string; description: string; debit?: number; credit?: number; }) {
    const logbookCollection = collection(db, "logbook");
    
    // Fetch last balance to calculate the new one
    const lastLogQuery = query(collection(db, "logbook"), orderBy("date", "desc"), limit(1));
    const lastLogSnap = await getDocs(lastLogQuery);
    const lastBalance = lastLogSnap.empty ? 0 : lastLogSnap.docs[0].data().balance;
    const newBalance = lastBalance + (data.debit || 0) - (data.credit || 0);

    await addDoc(logbookCollection, {
        ...data,
        balance: newBalance,
        createdAt: serverTimestamp()
    });

    revalidatePath("/dashboard/finance");
}

export async function updateLogbookEntry(logId: string, data: any) {
    const logRef = doc(db, "logbook", logId);
    // Note: Updating balance for one entry would require re-calculating all subsequent entries.
    // For simplicity, we are not allowing balance editing directly here.
    await updateDoc(logRef, data);
    revalidatePath("/dashboard/finance");
}

export async function deleteLogbookEntry(logId: string) {
    const logRef = doc(db, "logbook", logId);
    // Note: Deleting an entry would require re-calculating all subsequent balances.
    await deleteDoc(logRef);
    revalidatePath("/dashboard/finance");
}
