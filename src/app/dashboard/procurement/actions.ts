
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

        const debitAcct = requestData.itemType === 'consumable' ? '5030' : '1210'; // 5030 for Consumables, 1210 for General Equipment (Asset)
        const narration = `Approved procurement for ${requestData.itemName} by ${userName}.`;

        await addTransaction({
            date: new Date().toISOString().split('T')[0],
            narration,
            createdById: approverId,
            lines: [
                { acctCode: debitAcct, debitMinor: requestData.expectedCost * 100, creditMinor: 0 },
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

export async function markAsPurchased(data: {
    procurementRequestId: string;
    purchasedById: string;
    actualCost: number;
    vendor?: string;
    receiptUrl: string;
}) {
    const { procurementRequestId, purchasedById, actualCost, vendor, receiptUrl } = data;

    if (!purchasedById) {
        throw new Error("User must be authenticated.");
    }
    
    await runTransaction(db, async (transaction) => {
        const procurementRequestRef = doc(db, "procurement_requests", procurementRequestId);
        const procurementRequestSnap = await transaction.get(procurementRequestRef);

        if (!procurementRequestSnap.exists()) {
            throw new Error("Associated procurement request not found.");
        }
        const procurementRequestData = procurementRequestSnap.data();
        
        // --- Create Documents ---
        const purchaseRef = doc(collection(db, "purchases"));
        const reimbursementRef = doc(collection(db, "reimbursements"));
        
        // 1. Create the purchase document
        transaction.set(purchaseRef, {
            id: purchaseRef.id,
            itemRequestId: procurementRequestId,
            purchasedById: purchasedById,
            purchasedAt: serverTimestamp(),
            actualCost: actualCost,
            vendor: vendor,
            receiptUrl: receiptUrl,
        });

        // 2. Create the reimbursement document
        transaction.set(reimbursementRef, {
            id: reimbursementRef.id,
            procurementRequestId: procurementRequestId,
            purchaseId: purchaseRef.id,
            submittedById: purchasedById,
            amount: actualCost,
            status: 'pending',
            receiptUrl: receiptUrl,
            vendor: vendor,
            createdAt: serverTimestamp(),
        });
        
        // 3. Update the procurement request status
        transaction.update(procurementRequestRef, {
            status: 'reimbursing', // New status indicating reimbursement is in progress
            purchaseId: purchaseRef.id,
            actualCost: actualCost,
        });
        
        // 4. Adjust the liability if actual cost differs from expected cost
        const expectedCost = procurementRequestData.expectedCost;
        const costDifference = actualCost - expectedCost;

        if (Math.abs(costDifference) > 0.01) { // If there's a meaningful difference
            const userSnap = await getDoc(doc(db, "users", purchasedById));
            const userName = userSnap.exists() ? userSnap.data().name : "Unknown User";
            const expenseAcct = procurementRequestData.itemType === 'consumable' ? '5030' : '1210';
            const narration = `Cost adjustment for ${procurementRequestData.itemName} purchased by ${userName}.`;

            await addTransaction({
                date: new Date().toISOString().split('T')[0],
                narration,
                createdById: purchasedById, // System/User action
                lines: [
                    { acctCode: expenseAcct, debitMinor: costDifference * 100, creditMinor: 0 },
                    { acctCode: '2020', debitMinor: 0, creditMinor: costDifference * 100 }, // Adjust Reimbursements Payable
                ]
            }, transaction);
        }
    });

    revalidatePath("/dashboard/procurement");
    revalidatePath("/dashboard/reimbursements");
    revalidatePath("/dashboard/finance");
}
