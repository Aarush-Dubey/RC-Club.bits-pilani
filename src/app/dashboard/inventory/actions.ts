
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { doc, runTransaction, serverTimestamp, updateDoc, collection, query, where, getDocs, writeBatch, documentId, addDoc } from "firebase/firestore";

export async function requestInventory({ itemId, quantity, userId, reason }: { itemId: string; quantity: number; userId: string; reason: string }) {
    if (!userId) {
        throw new Error("User is not authenticated.");
    }
    const requestRef = collection(db, "inventory_requests");
    await addDoc(requestRef, {
        projectId: null, // This is a general request, not tied to a project
        requestedById: userId,
        itemId,
        quantity,
        reason,
        status: "pending",
        isOverdue: false,
        createdAt: serverTimestamp(),
    });

    revalidatePath(`/dashboard/inventory`);
}


export async function approveInventoryRequest(requestId: string, adminId: string) {
    if (!adminId) {
        throw new Error("User is not authenticated.");
    }
    
    try {
        await runTransaction(db, async (transaction) => {
            const requestRef = doc(db, "inventory_requests", requestId);
            const requestDoc = await transaction.get(requestRef);

            if (!requestDoc.exists() || requestDoc.data().status !== 'pending') {
                throw new Error("Request not found or not pending approval.");
            }
            
            const requestData = requestDoc.data();
            const itemRef = doc(db, "inventory_items", requestData.itemId);
            const itemDoc = await transaction.get(itemRef);

            if (!itemDoc.exists()) {
                throw new Error(`Inventory item ${requestData.itemId} not found.`);
            }
            
            const itemData = itemDoc.data();
            if (itemData.availableQuantity < requestData.quantity) {
                throw new Error(`Not enough stock for ${itemData.name}. Available: ${itemData.availableQuantity}, Requested: ${requestData.quantity}.`);
            }

            const newAvailableQuantity = itemData.availableQuantity - requestData.quantity;
            const newCheckedOutQuantity = itemData.checkedOutQuantity + requestData.quantity;
            
            transaction.update(itemRef, {
                availableQuantity: newAvailableQuantity,
                checkedOutQuantity: newCheckedOutQuantity,
            });

            transaction.update(requestRef, { 
                status: 'fulfilled',
                fulfilledAt: serverTimestamp(),
                fulfilledById: adminId,
            });
        });
    } catch (error) {
        console.error("Transaction failed: ", error);
        throw new Error(`Failed to approve request: ${(error as Error).message}`);
    }

    revalidatePath(`/dashboard/inventory`);
}

export async function rejectInventoryRequest(requestId: string, adminId: string) {
    if (!adminId) {
        throw new Error("User is not authenticated.");
    }
    const requestRef = doc(db, "inventory_requests", requestId);
    await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedById: adminId
    });
    revalidatePath(`/dashboard/inventory`);
}


export async function confirmReturn(requestId: string, adminId: string) {
    if (!adminId) {
        throw new Error("User is not authenticated.");
    }

    const batch = writeBatch(db);

    const requestRef = doc(db, "inventory_requests", requestId);
    const requestDoc = await getDocs(query(collection(db, "inventory_requests"), where(documentId(), "==", requestId)));
    
    if (requestDoc.empty) {
        throw new Error("Return request not found.");
    }
    const requestData = requestDoc.docs[0].data();

    if (requestData.status !== 'pending_return') {
        throw new Error("This item is not pending return.");
    }

    // 1. Update inventory item stock
    const itemRef = doc(db, "inventory_items", requestData.itemId);
    const itemDoc = await getDocs(query(collection(db, "inventory_items"), where(documentId(), "==", requestData.itemId)));
    if (itemDoc.empty) {
        throw new Error("Inventory item not found.");
    }
    const itemData = itemDoc.docs[0].data();
    const newAvailableQuantity = itemData.availableQuantity + requestData.quantity;
    const newCheckedOutQuantity = itemData.checkedOutQuantity - requestData.quantity;
    
    batch.update(itemRef, {
        availableQuantity: newAvailableQuantity,
        checkedOutQuantity: newCheckedOutQuantity,
    });

    // 2. Mark the request as 'returned'
    batch.update(requestRef, { 
        status: 'returned',
        returnedAt: serverTimestamp(),
        returnedById: adminId,
    });
    
    // 3. Check if this was the last item for the project
    if (requestData.projectId) {
        const otherPendingReturnsQuery = query(
            collection(db, "inventory_requests"),
            where("projectId", "==", requestData.projectId),
            where("status", "==", "pending_return"),
            where(documentId(), "!=", requestId)
        );
        const otherPendingReturnsSnap = await getDocs(otherPendingReturnsQuery);

        if (otherPendingReturnsSnap.empty) {
            // This is the last item, so complete the project
            const projectRef = doc(db, "projects", requestData.projectId);
            batch.update(projectRef, {
                status: 'completed',
                hasPendingReturns: false,
                completedAt: serverTimestamp(),
                completedById: adminId
            });
        }
    }


    await batch.commit();

    revalidatePath(`/dashboard/inventory`);
    if(requestData.projectId) {
        revalidatePath(`/dashboard/projects/${requestData.projectId}`);
    }
}
