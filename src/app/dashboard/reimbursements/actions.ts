
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/firebase"
import { doc, serverTimestamp, updateDoc, addDoc, collection, runTransaction, getDoc } from "firebase/firestore"
import { addTransaction } from "../finance/actions"

export async function approveReimbursement(reimbursementId: string, reviewedById: string) {
    if (!reviewedById) {
        throw new Error("User is not authenticated.");
    }
    const reimbursementRef = doc(db, "reimbursements", reimbursementId);
    await updateDoc(reimbursementRef, {
        status: "approved",
        reviewedAt: serverTimestamp(),
        reviewedById: reviewedById,
    });
    revalidatePath("/dashboard/reimbursements");
}

export async function rejectReimbursement(reimbursementId: string, reviewedById: string) {
    if (!reviewedById) {
        throw new Error("User is not authenticated.");
    }
    const reimbursementRef = doc(db, "reimbursements", reimbursementId);
    await updateDoc(reimbursementRef, {
        status: "rejected",
        reviewedAt: serverTimestamp(),
        reviewedById: reviewedById,
    });
    revalidatePath("/dashboard/reimbursements");
}

export async function markAsPaid(reimbursementId: string, paidById: string) {
    if (!paidById) {
        throw new Error("User is not authenticated.");
    }
    
    await runTransaction(db, async (transaction) => {
        const reimbursementRef = doc(db, "reimbursements", reimbursementId);
        const reimbursementSnap = await transaction.get(reimbursementRef);
        if (!reimbursementSnap.exists()) {
            throw new Error("Reimbursement not found.");
        }
        const reimbursementData = reimbursementSnap.data();

        // Fetch user name for description
        const userRef = doc(db, "users", reimbursementData.submittedById);
        const userSnap = await transaction.get(userRef);
        const userName = userSnap.exists() ? userSnap.data().name : "Unknown User";
        
        // --- Create Transaction Entry ---
        await addTransaction({
            type: 'expense',
            category: "Reimbursements",
            description: `Paid reimbursement to ${userName}`,
            amount: reimbursementData.amount,
            date: new Date().toISOString().split('T')[0],
            reimbursementId: reimbursementId, // Link to the reimbursement
        });

        // --- Update Reimbursement Status ---
        transaction.update(reimbursementRef, {
            status: "paid",
            paidAt: serverTimestamp(),
            paidById: paidById,
        });
    });

    revalidatePath("/dashboard/reimbursements");
    revalidatePath("/dashboard/finance");
}
