
"use server"

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { doc, runTransaction, collection, getDocs, query, where, arrayUnion, serverTimestamp, updateDoc } from "firebase/firestore";

export async function approveProject(projectId: string) {
    try {
        await runTransaction(db, async (transaction) => {
            const projectRef = doc(db, "projects", projectId);
            
            // --- 1. READ PHASE ---
            // Read the project document first.
            const projectDoc = await transaction.get(projectRef);

            if (!projectDoc.exists() || projectDoc.data().status !== 'pending_approval') {
                throw new Error("Project not found or not pending approval.");
            }
            
            const projectData = projectDoc.data();

            // Find all pending inventory requests for this project.
            const requestsQuery = query(collection(db, "inventory_requests"), where("projectId", "==", projectId), where("status", "==", "pending"));
            const requestsSnapshot = await getDocs(requestsQuery);

            // Collect all item IDs and read the corresponding inventory documents within the transaction.
            const itemRefs: { [key: string]: any } = {};
            const itemDocs: { [key: string]: any } = {};
            
            for (const requestDoc of requestsSnapshot.docs) {
                const requestData = requestDoc.data();
                if (!itemRefs[requestData.itemId]) {
                    itemRefs[requestData.itemId] = doc(db, "inventory_items", requestData.itemId);
                    itemDocs[requestData.itemId] = await transaction.get(itemRefs[requestData.itemId]);
                }
            }

            // --- 2. VALIDATION PHASE ---
            // Check stock availability after all reads are done.
            for (const requestDoc of requestsSnapshot.docs) {
                const requestData = requestDoc.data();
                const itemDoc = itemDocs[requestData.itemId];

                if (!itemDoc.exists()) {
                    throw new Error(`Inventory item ${requestData.itemId} not found.`);
                }
                const itemData = itemDoc.data();
                if (itemData.availableQuantity < requestData.quantity) {
                    throw new Error(`Not enough stock for ${itemData.name}. Available: ${itemData.availableQuantity}, Requested: ${requestData.quantity}.`);
                }
            }

            // --- 3. WRITE PHASE ---
            // Update project status
            const hasInventoryRequests = requestsSnapshot.docs.length > 0;
            transaction.update(projectRef, { 
                status: 'approved',
                approvedAt: serverTimestamp(),
                approvedById: 'system-admin', // In a real app, this would be the current user's ID
                hasPendingReturns: hasInventoryRequests
            });

            // Process inventory requests: update item quantities and request status
            for (const requestDoc of requestsSnapshot.docs) {
                const requestData = requestDoc.data();
                const itemRef = itemRefs[requestData.itemId];
                const itemData = itemDocs[requestData.itemId].data();

                const newAvailableQuantity = itemData.availableQuantity - requestData.quantity;
                const newCheckedOutQuantity = itemData.checkedOutQuantity + requestData.quantity;
                
                transaction.update(itemRef, {
                    availableQuantity: newAvailableQuantity,
                    checkedOutQuantity: newCheckedOutQuantity,
                });

                transaction.update(doc(db, "inventory_requests", requestDoc.id), { 
                    status: 'fulfilled',
                    fulfilledAt: serverTimestamp(),
                    checkedOutToId: projectData.leadId, // Associate with project lead
                });
            }

            // Add project to each member's list of joined projects
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
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/projects');
    revalidatePath('/dashboard/projects/approvals');
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
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/projects');
    revalidatePath('/dashboard/projects/approvals');
}

export async function startProject(projectId: string) {
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
        status: 'active',
        activatedAt: serverTimestamp(),
        // In a real app, this should be the current user's ID
        activatedById: 'system-lead'
    });
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/projects');
}

export async function completeProject(projectId: string) {
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        // In a real app, this should be the current user's ID
        completedById: 'system-lead'
    });
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/projects');
}

export async function closeProject(projectId: string) {
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
        status: 'closed',
        closedAt: serverTimestamp(),
        // In a real app, this should be the current user's ID
        closedById: 'system-admin'
    });
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/projects');
}
