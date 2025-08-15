
"use server"

import { db } from "@/lib/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, runTransaction, getDoc, writeBatch, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// Helper to convert Firestore Timestamps to JSON-serializable strings
const serializeData = (data: any): any => {
    if (!data) return null;

    const serializedData: { [key: string]: any } = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            if (data[key] && typeof data[key].toDate === 'function') {
                serializedData[key] = data[key].toDate().toISOString();
            } else {
                serializedData[key] = data[key];
            }
        }
    }
    return serializedData;
};


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

// ----- Enhanced Transaction Actions -----

export async function addTransaction(data: {
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  payee?: string;
  proofUrl?: string;
  notes?: string;
  reimbursementId?: string;
  createdBy: string;
}) {
  return await runTransaction(db, async (transaction) => {
    // Get the last transaction to calculate new balance
    const lastTransactionQuery = query(
      collection(db, "transactions"), 
      orderBy("date", "desc"), 
      limit(1)
    );
    const lastTransactionSnap = await getDocs(lastTransactionQuery);
    const lastBalance = lastTransactionSnap.empty ? 0 : lastTransactionSnap.docs[0].data().balance;
    
    // Calculate new balance
    const balanceChange = data.type === 'income' ? data.amount : -data.amount;
    const newBalance = lastBalance + balanceChange;

    // Create transaction record
    const transactionRef = doc(collection(db, "transactions"));
    transaction.set(transactionRef, {
      ...data,
      balance: newBalance,
      isReversed: false,
      createdAt: serverTimestamp(),
    });

    return transactionRef.id;
  });
}

export async function reverseTransaction(originalTransactionId: string, reason: string) {
  return await runTransaction(db, async (transaction) => {
    // Get original transaction
    const originalRef = doc(db, "transactions", originalTransactionId);
    const originalSnap = await transaction.get(originalRef);
    
    if (!originalSnap.exists()) {
      throw new Error("Original transaction not found");
    }
    
    const originalData = originalSnap.data();
    
    if (originalData.isReversed) {
      throw new Error("Transaction already reversed");
    }

    // Mark original as reversed
    transaction.update(originalRef, { 
      isReversed: true,
      reversedAt: serverTimestamp(),
      reversalReason: reason
    });

    // Get current balance
    const lastTransactionQuery = query(
      collection(db, "transactions"), 
      orderBy("date", "desc"), 
      limit(1)
    );
    const lastTransactionSnap = await getDocs(lastTransactionQuery);
    const currentBalance = lastTransactionSnap.empty ? 0 : lastTransactionSnap.docs[0].data().balance;

    // Create reversing entry
    const reversingRef = doc(collection(db, "transactions"));
    const balanceChange = originalData.type === 'income' ? -originalData.amount : originalData.amount;
    
    transaction.set(reversingRef, {
      type: originalData.type === 'income' ? 'expense' : 'income',
      category: originalData.category,
      description: `REVERSAL: ${originalData.description}`,
      amount: originalData.amount,
      date: new Date().toISOString().split('T')[0],
      payee: originalData.payee,
      notes: `Reversing transaction: ${reason}`,
      balance: currentBalance + balanceChange,
      isReversed: false,
      isReversal: true,
      originalTransactionId: originalTransactionId,
      createdAt: serverTimestamp(),
      createdBy: originalData.createdBy // The original creator
    });
  });
}

// ----- Legacy Logbook Actions (for backward compatibility) -----

export async function addLogbookEntry(data: { date: string; assetGroup: string; account: string; description: string; debit?: number; credit?: number; reimbursementId?: string; createdBy: string }) {
  // Convert to new transaction format
  const transactionData = {
    type: data.debit ? 'income' as const : 'expense' as const,
    category: data.assetGroup,
    description: data.description,
    amount: data.debit || data.credit || 0,
    date: data.date,
    payee: data.account,
    notes: `Legacy entry from ${data.assetGroup}/${data.account}`,
    reimbursementId: data.reimbursementId,
    createdBy: data.createdBy
  };
  
  await addTransaction(transactionData);
  revalidatePath("/dashboard/finance");
}

export async function updateLogbookEntry(logId: string, data: any) {
  // For legacy compatibility, we'll allow updates but note they should use reversal
  const logRef = doc(db, "transactions", logId);
  await updateDoc(logRef, {
    ...data,
    updatedAt: serverTimestamp(),
    isLegacyUpdate: true
  });
  revalidatePath("/dashboard/finance");
}

export async function deleteLogbookEntry(logId: string) {
  // For legacy compatibility, mark as deleted instead of actually deleting
  const logRef = doc(db, "transactions", logId);
  await updateDoc(logRef, {
    isDeleted: true,
    deletedAt: serverTimestamp()
  });
  revalidatePath("/dashboard/finance");
}

// ----- Export Actions -----

export async function getTransactionsForExport(startDate: string, endDate: string) {
  const transactionsQuery = query(
    collection(db, "transactions"),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "desc")
  );
  
  const snapshot = await getDocs(transactionsQuery);
  // Filter for 'isDeleted' on the client-side to avoid needing a composite index
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...serializeData(doc.data())
  })).filter((t: any) => t.isDeleted !== true);
}
