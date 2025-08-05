
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { collection, doc, serverTimestamp, writeBatch, updateDoc, arrayUnion, setDoc, getDoc, query, where, getDocs, runTransaction } from "firebase/firestore";

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
        estimatedCost: number,
        isPerishable: boolean
    }[]
}) {
    if (!requestedById) {
        throw new Error("User is not authenticated.");
    }

    const userRef = doc(db, "users", requestedById);

    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw new Error("User not found.");
        }

        const existingProcurement = userDoc.data().procurement || [];
        const newProcurementEntries = [];

        for (const request of requests) {
            const requestRef = doc(collection(db, "new_item_requests"));
            const requestData: any = {
                id: requestRef.id,
                requestedById,
                itemName: request.itemName,
                justification: request.justification,
                quantity: request.quantity,
                estimatedCost: request.estimatedCost,
                isPerishable: request.isPerishable,
                status: "pending",
                createdAt: serverTimestamp(),
                linkedBucketId: bucketId,
            };

            transaction.set(requestRef, requestData);
            
            newProcurementEntries.push({
                itemName: request.itemName,
                status: "pending",
                bucketId: bucketId || null
            });
        }
        
        transaction.update(userRef, {
            procurement: [...existingProcurement, ...newProcurementEntries]
        });

        if (bucketId) {
            const bucketRef = doc(db, "procurement_buckets", bucketId);
            transaction.update(bucketRef, {
                members: arrayUnion(requestedById)
            });
        }
    });
    
    if (!bucketId) {
        revalidatePath(`/dashboard/procurement/approvals`);
    }

}

export async function updateBucketStatus(bucketId: string, status: "open" | "closed" | "ordered" | "received") {
    const bucketRef = doc(db, "procurement_buckets", bucketId);
    const data: { status: string, [key:string]: any } = { status };

    if (status === 'closed') data.closedAt = serverTimestamp();
    if (status === 'ordered') data.orderedAt = serverTimestamp();
    if (status === 'received') data.receivedAt = serverTimestamp();
    
    if (status === 'received') {
        const batch = writeBatch(db);
        
        const approvedItemsQuery = query(
            collection(db, "new_item_requests"),
            where("linkedBucketId", "==", bucketId),
            where("status", "==", "approved")
        );
        const approvedItemsSnap = await getDocs(approvedItemsQuery);
        
        const itemRequests = new Map();
        approvedItemsSnap.docs.forEach(doc => {
            const req = doc.data();
            const lowerCaseName = req.itemName.toLowerCase();
            if (itemRequests.has(lowerCaseName)) {
                itemRequests.get(lowerCaseName).quantity += req.quantity;
            } else {
                itemRequests.set(lowerCaseName, {
                    name: req.itemName,
                    quantity: req.quantity,
                    costPerUnit: req.estimatedCost,
                    isPerishable: req.isPerishable
                });
            }
        });

        const itemNames = Array.from(itemRequests.keys());
        let existingInventory: Map<string, any>;
        if (itemNames.length > 0) {
            const inventoryQuery = query(collection(db, "inventory_items"), where("name", "in", Array.from(itemRequests.values()).map(item => item.name)));
            const inventorySnap = await getDocs(inventoryQuery);
            existingInventory = new Map(inventorySnap.docs.map(doc => [doc.data().name.toLowerCase(), { id: doc.id, ...doc.data() }]));
        } else {
            existingInventory = new Map();
        }

        for (const [name, request] of itemRequests.entries()) {
            if (existingInventory.has(name)) {
                const existingItem = existingInventory.get(name);
                const itemRef = doc(db, "inventory_items", existingItem.id);
                batch.update(itemRef, {
                    totalQuantity: existingItem.totalQuantity + request.quantity,
                    availableQuantity: existingItem.availableQuantity + request.quantity
                });
            } else {
                const newItemRef = doc(collection(db, "inventory_items"));
                batch.set(newItemRef, {
                    id: newItemRef.id,
                    name: request.name,
                    totalQuantity: request.quantity,
                    availableQuantity: request.quantity,
                    checkedOutQuantity: 0,
                    isPerishable: request.isPerishable,
                    costPerUnit: request.costPerUnit,
                    createdAt: serverTimestamp()
                });
            }
        }
        
        batch.update(bucketRef, data);
        
        await batch.commit();

    } else {
        await updateDoc(bucketRef, data);
    }

    revalidatePath(`/dashboard/procurement`);
    revalidatePath(`/dashboard/procurement/buckets/${bucketId}`);
    revalidatePath('/dashboard/inventory');
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
