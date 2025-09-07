
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/firebase"
import { doc, serverTimestamp, updateDoc, addDoc, collection, runTransaction, getDoc, setDoc, writeBatch, query, where, getDocs } from "firebase/firestore"

export async function rejectReimbursement(reimbursementId: string, reviewedById: string) {
    if (!reviewedById)  throw new Error("User is not authenticated.");
    
    const reimbursementRef = doc(db, "reimbursements", reimbursementId);
    await updateDoc(reimbursementRef, {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        rejectedById: reviewedById,
    });
    revalidatePath("/dashboard/reimbursements");
}

export async function markAsPaid(reimbursementId: string, paidById: string) {
    if (!paidById) throw new Error("User is not authenticated.");
    
    await runTransaction(db, async (transaction) => {
        const reimbursementRef = doc(db, "reimbursements", reimbursementId);
        
        // --- 1. READ PHASE ---
        const reimbursementSnap = await transaction.get(reimbursementRef);
        if (!reimbursementSnap.exists() || reimbursementSnap.data().status !== 'pending') {
            throw new Error("Reimbursement must be in a pending state to be paid.");
        }
        const reimbursementData = reimbursementSnap.data();

        const procurementRequestRef = doc(db, "procurement_requests", reimbursementData.procurementRequestId);
        const procurementRequestSnap = await transaction.get(procurementRequestRef);
        if (!procurementRequestSnap.exists()) {
            throw new Error("Associated procurement request not found.");
        }
        const procurementData = procurementRequestSnap.data();

        // --- 2. WRITE PHASE ---
        
        // Mark reimbursement as paid
        transaction.update(reimbursementRef, {
            status: "paid",
            paidAt: serverTimestamp(),
            paidById: paidById,
        });
        
        // Update procurement request status
        transaction.update(procurementRequestRef, { status: "reimbursed" });

        // If the item was an asset, add it to the inventory
        if (procurementData.itemType === 'asset') {
            const newItemRef = doc(collection(db, "inventory_items"));
            transaction.set(newItemRef, {
                id: newItemRef.id,
                name: procurementData.itemName,
                description: `Procured on ${new Date().toLocaleDateString()}. Request: ${procurementData.id}`,
                totalQuantity: 1, // Procured items are typically single assets
                availableQuantity: 1,
                checkedOutQuantity: 0,
                isPerishable: false,
                location: 'To be assigned',
                createdAt: serverTimestamp(),
            });
        }
    });

    revalidatePath("/dashboard/reimbursements");
    revalidatePath("/dashboard/procurement");
    revalidatePath("/dashboard/inventory");
}


export async function getPayableSummary() {
    const q = query(
        collection(db, 'reimbursements'),
        where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return [];
    }
    
    const userIds = [...new Set(snapshot.docs.map(doc => doc.data().submittedById))];
    const users: Record<string, any> = {};
    if (userIds.length > 0) {
        const usersQuery = query(collection(db, "users"), where("id", "in", userIds));
        const usersSnap = await getDocs(usersQuery);
        usersSnap.forEach(doc => {
            users[doc.id] = doc.data();
        });
    }

    const summary: Record<string, { total: number; name: string }> = {};

    snapshot.docs.forEach(doc => {
        const reimbursement = doc.data();
        const userId = reimbursement.submittedById;
        if (!summary[userId]) {
            summary[userId] = { total: 0, name: users[userId]?.name || 'Unknown User' };
        }
        summary[userId].total += reimbursement.amount;
    });

    return Object.entries(summary).map(([userId, data]) => ({
        userId,
        name: data.name,
        totalOwed: data.total,
    }));
}
