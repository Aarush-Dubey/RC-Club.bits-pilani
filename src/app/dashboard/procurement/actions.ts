
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { collection, doc, serverTimestamp, writeBatch, updateDoc, arrayUnion, addDoc } from "firebase/firestore";

export async function createProcurementBucket({ description, createdById }: { description: string; createdById: string }) {
    if (!createdById) {
        throw new Error("User is not authenticated.");
    }

    const bucketRef = doc(collection(db, "procurement_buckets"));
    await addDoc(collection(db, "procurement_buckets"), {
        id: bucketRef.id,
        createdBy: createdById,
        status: "open",
        description,
        createdAt: serverTimestamp(),
        members: [createdById] // The creator is the first member
    });

    revalidatePath("/dashboard/procurement");
}

export async function addRequestToBucket(bucketId: string, { requestedById, itemName, justification, quantity, estimatedCost }: {
    requestedById: string,
    itemName: string,
    justification: string,
    quantity: number,
    estimatedCost: number
}) {
    if (!requestedById) {
        throw new Error("User is not authenticated.");
    }

    const batch = writeBatch(db);

    // 1. Create the new item request, linking it to the bucket
    const requestRef = doc(collection(db, "new_item_requests"));
    batch.set(requestRef, {
        id: requestRef.id,
        requestedById,
        itemName,
        justification,
        quantity,
        estimatedCost,
        status: "pending",
        linkedBucketId: bucketId,
        createdAt: serverTimestamp(),
    });

    // 2. Add the user to the bucket's member list if they aren't already there
    const bucketRef = doc(db, "procurement_buckets", bucketId);
    batch.update(bucketRef, {
        members: arrayUnion(requestedById)
    });

    await batch.commit();
    revalidatePath(`/dashboard/procurement/buckets/${bucketId}`);
}

export async function updateBucketStatus(bucketId: string, status: "open" | "closed" | "ordered" | "received") {
    const bucketRef = doc(db, "procurement_buckets", bucketId);
    const data: { status: string, [key:string]: any } = { status };

    if (status === 'closed') data.closedAt = serverTimestamp();
    if (status === 'ordered') data.orderedAt = serverTimestamp();
    if (status === 'received') data.receivedAt = serverTimestamp();
    
    await updateDoc(bucketRef, data);
    revalidatePath(`/dashboard/procurement/buckets/${bucketId}`);
    revalidatePath(`/dashboard/procurement`);
}
