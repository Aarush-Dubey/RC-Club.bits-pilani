
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { doc, runTransaction, serverTimestamp, updateDoc, collection, query, where, getDocs, writeBatch, documentId, addDoc, getDoc, arrayUnion } from "firebase/firestore";

export async function requestInventory({ itemId, quantity, userId }: { itemId: string; quantity: number; userId: string; }) {
    if (!userId) {
        throw new Error("User is not authenticated.");
    }

    const batch = writeBatch(db);
    
    // Get item name for denormalization
    const itemRef = doc(db, "inventory_items", itemId);
    const itemSnap = await getDoc(itemRef);
    if (!itemSnap.exists()) {
        throw new Error("Inventory item not found.");
    }
    const itemName = itemSnap.data().name;

    // Create the inventory request
    const requestRef = doc(collection(db, "inventory_requests"));
    batch.set(requestRef, {
        id: requestRef.id,
        projectId: null, // This is a general request, not tied to a project
        requestedById: userId,
        itemId,
        quantity,
        reason: "General Use",
        status: "pending",
        isOverdue: false,
        createdAt: serverTimestamp(),
    });

    // Update the user's checkout_items array
    const userRef = doc(db, "users", userId);
    batch.update(userRef, {
        checkout_items: arrayUnion({
            requestId: requestRef.id,
            itemId: itemId,
            itemName: itemName,
            quantity: quantity,
            status: "pending"
        })
    });

    await batch.commit();

    revalidatePath(`/dashboard/inventory`);
}


export async function approveInventoryRequest(requestId: string, adminId: string) {
    if (!adminId) {
        throw new Error("User is not authenticated.");
    }
    
    try {
        await runTransaction(db, async (transaction) => {
            // --- 1. READ PHASE ---
            const requestRef = doc(db, "inventory_requests", requestId);
            const requestDoc = await transaction.get(requestRef);

            if (!requestDoc.exists() || requestDoc.data().status !== 'pending') {
                throw new Error("Request not found or not pending approval.");
            }
            
            const requestData = requestDoc.data();
            const itemRef = doc(db, "inventory_items", requestData.itemId);
            const itemDoc = await transaction.get(itemRef);

            const userRef = doc(db, "users", requestData.requestedById);
            const userDoc = await transaction.get(userRef);
            
            // --- 2. VALIDATION PHASE ---
            if (!itemDoc.exists()) {
                throw new Error(`Inventory item ${requestData.itemId} not found.`);
            }
            
            const itemData = itemDoc.data();
            if (itemData.availableQuantity < requestData.quantity) {
                throw new Error(`Not enough stock for ${itemData.name}. Available: ${itemData.availableQuantity}, Requested: ${requestData.quantity}.`);
            }
            if (!userDoc.exists()) {
                // This is unlikely but good to handle
                throw new Error(`Requesting user with ID ${requestData.requestedById} not found.`);
            }

            // --- 3. WRITE PHASE ---
            const newAvailableQuantity = itemData.availableQuantity - requestData.quantity;
            const newCheckedOutQuantity = itemData.checkedOutQuantity + requestData.quantity;
            
            // Update inventory item
            transaction.update(itemRef, {
                availableQuantity: newAvailableQuantity,
                checkedOutQuantity: newCheckedOutQuantity,
            });

            // Update inventory request
            transaction.update(requestRef, { 
                status: 'fulfilled',
                fulfilledAt: serverTimestamp(),
                fulfilledById: adminId,
                checkedOutToId: requestData.requestedById,
            });

            // Update user's checkout_items array status
            const userData = userDoc.data();
            const checkoutItems = userData.checkout_items || [];
            const updatedItems = checkoutItems.map((item: any) => 
                item.requestId === requestId ? { ...item, status: 'fulfilled' } : item
            );
            transaction.update(userRef, { checkout_items: updatedItems });
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

    const batch = writeBatch(db);
    const requestRef = doc(db, "inventory_requests", requestId);

    // Get request data to find the user
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) {
        throw new Error("Request not found.");
    }
    const requestData = requestSnap.data();

    // Mark the request as rejected
    batch.update(requestRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedById: adminId
    });

    // Update the user's checkout_items status
    const userRef = doc(db, "users", requestData.requestedById);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const checkoutItems = userSnap.data().checkout_items || [];
        const updatedItems = checkoutItems.map((item: any) => 
            item.requestId === requestId ? { ...item, status: 'rejected' } : item
        );
        batch.update(userRef, { checkout_items: updatedItems });
    }

    await batch.commit();
    revalidatePath(`/dashboard/inventory`);
}


export async function confirmReturn(requestId: string, adminId: string) {
    if (!adminId) {
        throw new Error("User is not authenticated.");
    }

    const batch = writeBatch(db);

    const requestRef = doc(db, "inventory_requests", requestId);
    const requestDocSnap = await getDoc(requestRef);
    
    if (!requestDocSnap.exists()) {
        throw new Error("Return request not found.");
    }
    const requestData = requestDocSnap.data();

    if (requestData.status !== 'pending_return') {
        throw new Error("This item is not pending return.");
    }

    // 1. Update inventory item stock
    const itemRef = doc(db, "inventory_items", requestData.itemId);
    const itemDoc = await getDoc(itemRef);

    if (!itemDoc.exists()) {
        throw new Error("Inventory item not found.");
    }
    const itemData = itemDoc.data();
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
    
    // 3. Update user's checkout_items status
    const checkedOutToId = requestData.checkedOutToId || requestData.requestedById;
    const userRef = doc(db, "users", checkedOutToId);
    const userSnap = await getDoc(userRef);
    if(userSnap.exists()){
        const checkoutItems = userSnap.data().checkout_items || [];
        const updatedItems = checkoutItems.map((item: any) => 
            item.requestId === requestId ? { ...item, status: 'returned' } : item
        );
        batch.update(userRef, { checkout_items: updatedItems });
    }

    // 4. Check if this was the last item for the project
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
