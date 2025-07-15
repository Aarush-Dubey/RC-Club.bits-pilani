
"use server"

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";

export async function updateItemQuantity({
    itemId,
    newTotalQuantity,
    oldTotalQuantity,
    checkedOutQuantity
}: {
    itemId: string;
    newTotalQuantity: number;
    oldTotalQuantity: number;
    checkedOutQuantity: number;
}) {
    if (newTotalQuantity < checkedOutQuantity) {
        throw new Error("Total quantity cannot be less than the quantity currently checked out.");
    }
    
    const newAvailableQuantity = newTotalQuantity - checkedOutQuantity;

    const itemRef = doc(db, "inventory_items", itemId);
    await updateDoc(itemRef, {
        totalQuantity: newTotalQuantity,
        availableQuantity: newAvailableQuantity,
    });
    
    revalidatePath(`/dashboard/inventory`);
}

export async function deleteInventoryItem(itemId: string) {
    const itemRef = doc(db, "inventory_items", itemId);
    // In a real app, you'd check for dependencies (e.g., active requests) before deleting.
    // For now, we'll allow deletion.
    await deleteDoc(itemRef);

    revalidatePath(`/dashboard/inventory`);
}
