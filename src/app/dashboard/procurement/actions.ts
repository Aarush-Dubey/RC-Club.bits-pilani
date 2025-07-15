
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { collection, doc, serverTimestamp, writeBatch, updateDoc, arrayUnion, setDoc, getDoc } from "firebase/firestore";

export async function createProcurementBucket({ description, createdById }: { description: string; createdById: string }) {
    if (!createdById) {
        throw new Error("User is not authenticated.");
    }

    // First, create a reference to a new document to get a unique ID
    const bucketRef = doc(collection(db, "procurement_buckets"));
    
    // Now, use setDoc to create the document with the generated ID included in its data
    await setDoc(bucketRef, {
        id: bucketRef.id,
        createdBy: createdById,
        status: "open",
        description,
        createdAt: serverTimestamp(),
        members: [createdById] // The creator is the first member
    });

    revalidatePath("/dashboard/procurement");
    revalidatePath("/dashboard/procurement/new");
}

export async function addRequestToBucket(bucketId: string | null, { requestedById, requests }: {
    requestedById: string,
    requests: {
        itemName: string,
        justification: string,
        quantity: number,
        estimatedCost: number
    }[]
}) {
    if (!requestedById) {
        throw new Error("User is not authenticated.");
    }

    const batch = writeBatch(db);

    for (const request of requests) {
        const requestRef = doc(collection(db, "new_item_requests"));
        const requestData: any = {
            id: requestRef.id,
            requestedById,
            itemName: request.itemName,
            justification: request.justification,
            quantity: request.quantity,
            estimatedCost: request.estimatedCost, // This is now cost per piece
            status: "pending",
            createdAt: serverTimestamp(),
        };

        if (bucketId) {
            requestData.linkedBucketId = bucketId;
        }

        batch.set(requestRef, requestData);
    }
    
    // If it's for a bucket, add the user to the bucket's member list
    if (bucketId) {
        const bucketRef = doc(db, "procurement_buckets", bucketId);
        batch.update(bucketRef, {
            members: arrayUnion(requestedById)
        });
        // No need for revalidatePath here, as onSnapshot will handle UI updates
    } else {
        revalidatePath(`/dashboard/procurement/approvals`);
    }

    await batch.commit();
}

export async function updateBucketStatus(bucketId: string, status: "open" | "closed" | "ordered" | "received") {
    const bucketRef = doc(db, "procurement_buckets", bucketId);
    const data: { status: string, [key:string]: any } = { status };

    if (status === 'closed') data.closedAt = serverTimestamp();
    if (status === 'ordered') data.orderedAt = serverTimestamp();
    if (status === 'received') data.receivedAt = serverTimestamp();
    
    await updateDoc(bucketRef, data);
    revalidatePath(`/dashboard/procurement`);
    revalidatePath(`/dashboard/procurement/approvals`);
}

export async function approveNewItemRequest(requestId: string, approverId: string) {
    if (!approverId) throw new Error("User is not authenticated.");

    const requestRef = doc(db, "new_item_requests", requestId);
    await updateDoc(requestRef, {
        status: "approved",
        approvedAt: serverTimestamp(),
        approvedById: approverId,
    });

    const requestDoc = await getDoc(requestRef);
    const bucketId = requestDoc.data()?.linkedBucketId;
    
    // Revalidate paths if not part of a bucket or if the bucket itself needs updating
    if (bucketId) {
        revalidatePath(`/dashboard/procurement/buckets/${bucketId}`);
    } else {
        revalidatePath('/dashboard/procurement/approvals');
    }
}

export async function rejectNewItemRequest(requestId: string, rejectorId: string, reason: string) {
    if (!rejectorId) throw new Error("User is not authenticated.");
    
    const requestRef = doc(db, "new_item_requests", requestId);
    await updateDoc(requestRef, {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        rejectedById: rejectorId,
        rejectionReason: reason,
    });
    
    const requestDoc = await getDoc(requestRef);
    const bucketId = requestDoc.data()?.linkedBucketId;

    if (bucketId) {
        revalidatePath(`/dashboard/procurement/buckets/${bucketId}`);
    } else {
        revalidatePath('/dashboard/procurement/approvals');
    }
}
