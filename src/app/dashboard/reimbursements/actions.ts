
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/firebase"
import { doc, serverTimestamp, updateDoc, addDoc, collection, query, orderBy, limit, getDocs, getDoc } from "firebase/firestore"
import { format } from "date-fns"

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
    const reimbursementRef = doc(db, "reimbursements", reimbursementId);
    
    // --- Create Logbook Entry ---
    const reimbursementSnap = await getDoc(reimbursementRef);
    if (!reimbursementSnap.exists()) {
        throw new Error("Reimbursement not found.");
    }
    const reimbursementData = reimbursementSnap.data();

    // Fetch user name for description
    const userRef = doc(db, "users", reimbursementData.submittedById);
    const userSnap = await getDoc(userRef);
    const userName = userSnap.exists() ? userSnap.data().name : "Unknown User";
    
    // Fetch last balance
    const lastLogQuery = query(collection(db, "logbook"), orderBy("date", "desc"), limit(1));
    const lastLogSnap = await getDocs(lastLogQuery);
    const lastBalance = lastLogSnap.empty ? 0 : lastLogSnap.docs[0].data().balance;
    const newBalance = lastBalance - reimbursementData.amount;
    
    const logbookRef = collection(db, "logbook");
    await addDoc(logbookRef, {
        date: format(new Date(), 'yyyy-MM-dd'),
        assetGroup: "Current Liabilities",
        account: "Reimbursements",
        description: `Paid reimbursement to ${userName}`,
        credit: reimbursementData.amount,
        balance: newBalance,
        reimbursementId: reimbursementId, // Link to the reimbursement
    });

    // --- Update Reimbursement Status ---
    await updateDoc(reimbursementRef, {
        status: "paid",
        paidAt: serverTimestamp(),
        paidById: paidById,
    });

    revalidatePath("/dashboard/reimbursements");
    revalidatePath("/dashboard/finance");
}
