
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/firebase"
import { doc, serverTimestamp, updateDoc, addDoc, collection, runTransaction, getDoc, setDoc, writeBatch, query, where, getDocs } from "firebase/firestore"
import { addTransaction } from "../finance/actions"

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
