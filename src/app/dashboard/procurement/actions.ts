
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { collection, doc, serverTimestamp, writeBatch, updateDoc, arrayUnion, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";

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
    
    if (status === 'received') {
        const batch = writeBatch(db);
        
        // 1. Get all approved items in the bucket
        const approvedItemsQuery = query(
            collection(db, "new_item_requests"),
            where("linkedBucketId", "==", bucketId),
            where("status", "==", "approved")
        );
        const approvedItemsSnap = await getDocs(approvedItemsQuery);
        
        // Map item names to their requested details
        const itemRequests = new Map();
        approvedItemsSnap.docs.forEach(doc => {
            const req = doc.data();
            if (itemRequests.has(req.itemName.toLowerCase())) {
                itemRequests.get(req.itemName.toLowerCase()).quantity += req.quantity;
            } else {
                itemRequests.set(req.itemName.toLowerCase(), {
                    name: req.itemName,
                    quantity: req.quantity,
                    costPerUnit: req.estimatedCost
                });
            }
        });

        // 2. Get existing inventory items that match the names
        const itemNames = Array.from(itemRequests.keys());
        let existingInventory: Map<string, any>;
        if (itemNames.length > 0) {
            const inventoryQuery = query(collection(db, "inventory_items"), where("name", "in", itemNames.map(name => itemRequests.get(name).name)));
            const inventorySnap = await getDocs(inventoryQuery);
            existingInventory = new Map(inventorySnap.docs.map(doc => [doc.data().name.toLowerCase(), { id: doc.id, ...doc.data() }]));
        } else {
            existingInventory = new Map();
        }

        // 3. Prepare batch writes for new or updated inventory
        for (const [name, request] of itemRequests.entries()) {
            if (existingInventory.has(name)) {
                // Item exists, update quantity
                const existingItem = existingInventory.get(name);
                const itemRef = doc(db, "inventory_items", existingItem.id);
                batch.update(itemRef, {
                    totalQuantity: existingItem.totalQuantity + request.quantity,
                    availableQuantity: existingItem.availableQuantity + request.quantity
                });
            } else {
                // New item, create it
                const newItemRef = doc(collection(db, "inventory_items"));
                batch.set(newItemRef, {
                    id: newItemRef.id,
                    name: request.name,
                    totalQuantity: request.quantity,
                    availableQuantity: request.quantity,
                    checkedOutQuantity: 0,
                    isPerishable: false, // Default value, can be edited later
                    costPerUnit: request.costPerUnit,
                    createdAt: serverTimestamp()
                });
            }
        }
        
        // 4. Update the bucket status
        batch.update(bucketRef, data);
        
        // 5. Commit the batch
        await batch.commit();

    } else {
        await updateDoc(bucketRef, data);
    }

    revalidatePath(`/dashboard/procurement`);
    revalidatePath(`/dashboard/procurement/buckets/${bucketId}`);
    revalidatePath('/dashboard/inventory'); // Revalidate inventory to show new items
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
