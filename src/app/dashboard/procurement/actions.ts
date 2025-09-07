
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { collection, doc, serverTimestamp, writeBatch, updateDoc, setDoc, getDoc, runTransaction } from "firebase/firestore";
import { addTransaction } from "../finance/actions";

interface NewItemRequestData {
    requestedById: string;
    itemName: string;
    justification: string;
    itemType: 'consumable' | 'asset';
    expectedCost: number;
}

export async function createNewItemRequest(data: NewItemRequestData) {
    if (!data.requestedById) {
        throw new Error("User must be authenticated.");
    }
    const requestRef = doc(collection(db, "procurement_requests"));
    
    await setDoc(requestRef, {
        id: requestRef.id,
        ...data,
        status: "pending",
        createdAt: serverTimestamp(),
    });

    revalidatePath("/dashboard/procurement");
}

export async function approveNewItemRequest(requestId: string, approverId: string) {
    if (!approverId) throw new Error("User is not authenticated.");

    await runTransaction(db, async (transaction) => {
        const requestRef = doc(db, "procurement_requests", requestId);
        const requestSnap = await transaction.get(requestRef);

        if (!requestSnap.exists() || requestSnap.data().status !== 'pending') {
            throw new Error("Request not found or not pending approval.");
        }
        const requestData = requestSnap.data();

        // Accounting entry to recognize the expected liability
        const userRef = doc(db, "users", requestData.requestedById);
        const userSnap = await transaction.get(userRef);
        const userName = userSnap.exists() ? userSnap.data().name : "Unknown User";

        const expenseAcct = requestData.itemType === 'consumable' ? '5030' : '5010'; // Consumables vs Equipment Expense
        const narration = `Approved procurement request for ${requestData.itemName} by ${userName}.`;

        await addTransaction({
            date: new Date().toISOString().split('T')[0],
            narration,
            createdById: approverId,
            lines: [
                { acctCode: expenseAcct, debitMinor: requestData.expectedCost * 100, creditMinor: 0 },
                { acctCode: '2020', debitMinor: 0, creditMinor: requestData.expectedCost * 100 }, // Credit Reimbursements Payable
            ]
        }, transaction);

        // Update request status
        transaction.update(requestRef, {
            status: "approved",
            approvedAt: serverTimestamp(),
            approvedById: approverId,
        });
    });

    revalidatePath('/dashboard/procurement/approvals');
    revalidatePath("/dashboard/finance");
}


export async function rejectNewItemRequest(requestId: string, rejectorId: string, reason: string) {
    if (!rejectorId) throw new Error("User is not authenticated.");
    
    const requestRef = doc(db, "procurement_requests", requestId);
    await updateDoc(requestRef, {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        rejectedById: rejectorId,
        rejectionReason: reason,
    });
    
    revalidatePath('/dashboard/procurement/approvals');
}
