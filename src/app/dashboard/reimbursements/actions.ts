
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/firebase"
import { doc, serverTimestamp, updateDoc } from "firebase/firestore"

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
    await updateDoc(reimbursementRef, {
        status: "paid",
        paidAt: serverTimestamp(),
        paidById: paidById,
    });
    revalidatePath("/dashboard/reimbursements");
}
