
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { doc, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";

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
