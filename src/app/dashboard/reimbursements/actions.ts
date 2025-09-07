
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/firebase"
import { doc, serverTimestamp, updateDoc, addDoc, collection, runTransaction, getDoc, setDoc, writeBatch, query, where, getDocs } from "firebase/firestore"
import { addTransaction } from "../finance/actions"

interface ReimbursementRequestData {
    procurementRequestId: string;
    submittedById: string;
    actualCost: number;
    vendor?: string;
    receiptUrl: string;
}

export async function createReimbursementRequest(data: ReimbursementRequestData) {
    const batch = writeBatch(db);

    const procurementRequestRef = doc(db, "procurement_requests", data.procurementRequestId);
    const reimbursementRef = doc(collection(db, "reimbursements"));

    const procurementRequestSnap = await getDoc(procurementRequestRef);
    if (!procurementRequestSnap.exists()) {
        throw new Error("Associated procurement request not found.");
    }
    const procurementRequestData = procurementRequestSnap.data();

    // 1. Create the reimbursement document
    batch.set(reimbursementRef, {
        id: reimbursementRef.id,
        procurementRequestId: data.procurementRequestId,
        submittedById: data.submittedById,
        amount: data.actualCost,
        status: 'pending',
        receiptUrl: data.receiptUrl,
        vendor: data.vendor,
        createdAt: serverTimestamp(),
    });

    // 2. Create the purchase document
    const purchaseRef = doc(collection(db, "purchases"));
    batch.set(purchaseRef, {
        id: purchaseRef.id,
        itemRequestId: data.procurementRequestId,
        purchasedById: data.submittedById,
        purchasedAt: serverTimestamp(),
        actualCost: data.actualCost,
        vendor: data.vendor,
        receiptUrl: data.receiptUrl,
    });
    
    // 3. Update the procurement request status
    batch.update(procurementRequestRef, {
        status: 'reimbursing',
        purchaseId: purchaseRef.id,
        actualCost: data.actualCost,
    });
    
    // 4. Adjust the liability if actual cost differs from expected cost
    const expectedCost = procurementRequestData.expectedCost;
    const actualCost = data.actualCost;
    const costDifference = actualCost - expectedCost;

    if (Math.abs(costDifference) > 0.01) { // If there's a meaningful difference
        const userSnap = await getDoc(doc(db, "users", data.submittedById));
        const userName = userSnap.exists() ? userSnap.data().name : "Unknown User";
        const expenseAcct = procurementRequestData.itemType === 'consumable' ? '5030' : '1210';
        const narration = `Cost adjustment for ${procurementRequestData.itemName} purchased by ${userName}.`;

        const adjustmentTransaction = {
            date: new Date().toISOString().split('T')[0],
            narration,
            createdById: data.submittedById, // System/User action
            lines: [
                { acctCode: expenseAcct, debitMinor: costDifference * 100, creditMinor: 0 },
                { acctCode: '2020', debitMinor: 0, creditMinor: costDifference * 100 }, // Adjust Reimbursements Payable
            ]
        };
        // This should be wrapped in the transaction, but we'll call it separately for now.
        // In a real app, you'd pass the batch or transaction object to addTransaction.
        // For simplicity here, we assume it runs.
        const txRef = doc(collection(db, "transactions"));
        batch.set(txRef, { ...adjustmentTransaction, entryNumber: 0, isReversed: false, createdAt: serverTimestamp()});
        const linesCollection = collection(db, "transaction_lines");
        adjustmentTransaction.lines.forEach(line => {
             const lineRef = doc(linesCollection);
             batch.set(lineRef, { ...line, transactionId: txRef.id });
        });
    }

    await batch.commit();

    revalidatePath("/dashboard/reimbursements");
    revalidatePath("/dashboard/procurement");
    revalidatePath("/dashboard/finance");
}


export async function approveReimbursement(reimbursementId: string, reviewedById: string) {
    if (!reviewedById) throw new Error("User is not authenticated.");
    
    const reimbursementRef = doc(db, "reimbursements", reimbursementId);
    await updateDoc(reimbursementRef, {
        status: "approved",
        approvedAt: serverTimestamp(),
        approvedById: reviewedById,
    });

    revalidatePath("/dashboard/reimbursements");
}

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
        const reimbursementSnap = await transaction.get(reimbursementRef);
        if (!reimbursementSnap.exists() || reimbursementSnap.data().status !== 'approved') {
            throw new Error("Reimbursement must be approved before it can be paid.");
        }
        const reimbursementData = reimbursementSnap.data();

        const userRef = doc(db, "users", reimbursementData.submittedById);
        const userSnap = await transaction.get(userRef);
        const userName = userSnap.exists() ? userSnap.data().name : "Unknown User";
        
        await addTransaction({
            date: new Date().toISOString().split('T')[0],
            narration: `Paid reimbursement to ${userName} for request ID ${reimbursementId.substring(0,5)}`,
            createdById: paidById,
            lines: [
                { acctCode: '2020', debitMinor: reimbursementData.amount * 100, creditMinor: 0 },
                { acctCode: '1010', debitMinor: 0, creditMinor: reimbursementData.amount * 100 },
            ]
        }, transaction);

        transaction.update(reimbursementRef, {
            status: "paid",
            paidAt: serverTimestamp(),
            paidById: paidById,
        });

        const procurementRequestRef = doc(db, "procurement_requests", reimbursementData.procurementRequestId);
        transaction.update(procurementRequestRef, { status: "reimbursed" });
    });

    revalidatePath("/dashboard/reimbursements");
    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard/procurement");
}


export async function getPayableSummary() {
    const q = query(
        collection(db, 'reimbursements'),
        where('status', '==', 'approved')
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
