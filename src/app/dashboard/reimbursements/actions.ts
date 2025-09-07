
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/firebase"
import { doc, serverTimestamp, updateDoc, addDoc, collection, runTransaction, getDoc } from "firebase/firestore"
import { addTransaction } from "../finance/actions"

export async function approveReimbursement(reimbursementId: string, reviewedById: string) {
    if (!reviewedById) {
        throw new Error("User is not authenticated.");
    }
    
    await runTransaction(db, async (transaction) => {
        const reimbursementRef = doc(db, "reimbursements", reimbursementId);
        const reimbursementSnap = await transaction.get(reimbursementRef);

        if (!reimbursementSnap.exists() || reimbursementSnap.data().status !== 'pending') {
            throw new Error("Reimbursement not found or not pending approval.");
        }
        const reimbursementData = reimbursementSnap.data();

        // Fetch user name for description
        const userRef = doc(db, "users", reimbursementData.submittedById);
        const userSnap = await transaction.get(userRef);
        const userName = userSnap.exists() ? userSnap.data().name : "Unknown User";

        // Create transaction to recognize the liability
        // This is an internal function call that participates in the parent transaction
        await addTransaction({
            date: new Date().toISOString().split('T')[0],
            narration: `Approved reimbursement for ${userName} for "${reimbursementData.notes}"`,
            createdById: reviewedById,
            lines: [
                { acctCode: '5030', debitMinor: reimbursementData.amount * 100, creditMinor: 0 }, // Debit Consumables & Parts Expense
                { acctCode: '2020', debitMinor: 0, creditMinor: reimbursementData.amount * 100 }, // Credit Reimbursements Payable
            ]
        }, transaction); // Pass the transaction object

        // Update reimbursement status
        transaction.update(reimbursementRef, {
            status: "approved",
            reviewedAt: serverTimestamp(),
            reviewedById: reviewedById,
        });
    });

    revalidatePath("/dashboard/reimbursements");
    revalidatePath("/dashboard/finance");
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
        if (reimbursementSnap.data().status !== 'approved') {
            throw new Error("Reimbursement must be approved before it can be paid.");
        }
        const reimbursementData = reimbursementSnap.data();

        // Fetch user name for description
        const userRef = doc(db, "users", reimbursementData.submittedById);
        const userSnap = await transaction.get(userRef);
        const userName = userSnap.exists() ? userSnap.data().name : "Unknown User";
        
        // Create transaction to clear liability and reduce cash
        await addTransaction({
            date: new Date().toISOString().split('T')[0],
            narration: `Paid reimbursement to ${userName} for "${reimbursementData.notes}"`,
            createdById: paidById,
            lines: [
                { acctCode: '2020', debitMinor: reimbursementData.amount * 100, creditMinor: 0 }, // Debit Reimbursements Payable
                { acctCode: '1010', debitMinor: 0, creditMinor: reimbursementData.amount * 100 }, // Credit Cash/Bank
            ]
        }, transaction); // Pass the transaction object

        // Update Reimbursement Status
        transaction.update(reimbursementRef, {
            status: "paid",
            paidAt: serverTimestamp(),
            paidById: paidById,
        });
    });

    revalidatePath("/dashboard/reimbursements");
    revalidatePath("/dashboard/finance");
}
