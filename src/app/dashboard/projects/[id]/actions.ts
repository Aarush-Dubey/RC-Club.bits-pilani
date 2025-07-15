
"use server"

import { db } from "@/lib/firebase";
import { doc, runTransaction, collection, getDocs, query, where, arrayUnion } from "firebase/firestore";

export async function approveProject(projectId: string) {
    try {
        await runTransaction(db, async (transaction) => {
            const projectRef = doc(db, "projects", projectId);
            const projectDoc = await transaction.get(projectRef);

            if (!projectDoc.exists() || projectDoc.data().status !== 'pending_approval') {
                throw new Error("Project not found or not pending approval.");
            }
            
            const projectData = projectDoc.data();

            // 1. Update project status
            transaction.update(projectRef, { 
                status: 'approved',
                approvedAt: new Date(),
                // In a real app, this would be the current user's ID
                approvedById: 'system-admin' 
            });

            // 2. Process inventory requests
            const requestsQuery = query(collection(db, "inventory_requests"), where("projectId", "==", projectId), where("status", "==", "pending"));
            const requestsSnapshot = await getDocs(requestsQuery);

            for (const requestDoc of requestsSnapshot.docs) {
                const requestRef = doc(db, "inventory_requests", requestDoc.id);
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

                // Update inventory item quantities
                const newAvailableQuantity = itemData.availableQuantity - requestData.quantity;
                const newCheckedOutQuantity = itemData.checkedOutQuantity + requestData.quantity;
                
                transaction.update(itemRef, {
                    availableQuantity: newAvailableQuantity,
                    checkedOutQuantity: newCheckedOutQuantity,
                });

                // Update inventory request status
                transaction.update(requestRef, { 
                    status: 'fulfilled',
                    fulfilledAt: new Date(),
                    // Associate with project lead
                    checkedOutToId: projectData.leadId,
                });
            }

            // 3. Add project to each member's list of joined projects
            for (const memberId of projectData.memberIds) {
                const userRef = doc(db, "users", memberId);
                transaction.update(userRef, {
                    joinedProjects: arrayUnion(projectId)
                });
            }
        });
    } catch (error) {
        console.error("Transaction failed: ", error);
        throw new Error(`Failed to approve project: ${(error as Error).message}`);
    }
}


export async function rejectProject(projectId: string) {
    const projectRef = doc(db, "projects", projectId);
     try {
        await runTransaction(db, async (transaction) => {
             const projectDoc = await transaction.get(projectRef);
             if (!projectDoc.exists() || projectDoc.data().status !== 'pending_approval') {
                throw new Error("Project not found or not pending approval.");
            }
            transaction.update(projectRef, { status: 'rejected' });

            const requestsQuery = query(collection(db, "inventory_requests"), where("projectId", "==", projectId));
            const requestsSnapshot = await getDocs(requestsQuery);

            for(const requestDoc of requestsSnapshot.docs) {
                 transaction.update(doc(db, "inventory_requests", requestDoc.id), { status: 'rejected' });
            }
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw new Error(`Failed to reject project: ${(e as Error).message}`);
    }
}
