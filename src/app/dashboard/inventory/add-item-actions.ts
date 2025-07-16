
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";

export async function addInventoryItem({
    name,
    description,
    totalQuantity,
    costPerUnit,
    isPerishable
}: {
    name: string;
    description: string;
    totalQuantity: number;
    costPerUnit: number;
    isPerishable: boolean;
}) {
    const newItemRef = doc(collection(db, "inventory_items"));
    
    await setDoc(newItemRef, {
        id: newItemRef.id,
        name,
        description,
        totalQuantity,
        availableQuantity: totalQuantity,
        checkedOutQuantity: 0,
        costPerUnit,
        isPerishable,
        createdAt: serverTimestamp(),
    });
    
    revalidatePath(`/dashboard/inventory`);
}
