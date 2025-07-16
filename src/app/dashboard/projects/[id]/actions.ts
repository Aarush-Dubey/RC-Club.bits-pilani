
"use server"

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { doc, runTransaction, collection, getDocs, query, where, arrayUnion, arrayRemove, serverTimestamp, updateDoc, addDoc, writeBatch, documentId, getDoc } from "firebase/firestore";

export async function approveProject(projectId: string) {
    try {
        await runTransaction(db, async (transaction) => {
            const projectRef = doc(db, "projects", projectId);
            
            // --- 1. READ PHASE ---
            const projectDoc = await transaction.get(projectRef);

            if (!projectDoc.exists() || projectDoc.data().status !== 'pending_approval') {
                throw new Error("Project not found or not pending approval.");
            }
            
            const projectData = projectDoc.data();
            const projectLeadRef = doc(db, "users", projectData.leadId);

            const requestsQuery = query(collection(db, "inventory_requests"), where("projectId", "==", projectId), where("status", "==", "pending"));
            const requestsSnapshot = await getDocs(requestsQuery); // This is outside the transaction but okay for reads before writes begin.

            const itemDocs = new Map<string, any>();
            const itemRefs = new Map<string, any>();
            
            // Batch read all unique item documents needed for validation and updates
            const uniqueItemIds = [...new Set(requestsSnapshot.docs.map(d => d.data().itemId))];
            if (uniqueItemIds.length > 0) {
                 for (const itemId of uniqueItemIds) {
                    const itemRef = doc(db, "inventory_items", itemId);
                    const itemDoc = await transaction.get(itemRef);
                    itemDocs.set(itemId, itemDoc);
                    itemRefs.set(itemId, itemRef);
                }
            }


            // --- 2. VALIDATION PHASE ---
            for (const requestDoc of requestsSnapshot.docs) {
                const requestData = requestDoc.data();
                const itemDoc = itemDocs.get(requestData.itemId);

                if (!itemDoc || !itemDoc.exists()) {
                    throw new Error(`Inventory item ${requestData.itemId} not found.`);
                }
                const itemData = itemDoc.data();
                if (itemData.availableQuantity < requestData.quantity) {
                    throw new Error(`Not enough stock for ${itemData.name}. Available: ${itemData.availableQuantity}, Requested: ${requestData.quantity}.`);
                }
            }

            // --- 3. WRITE PHASE ---
            // Now, we can safely perform all writes
            const hasInventoryRequests = requestsSnapshot.docs.length > 0;
            transaction.update(projectRef, { 
                status: 'approved',
                approvedAt: serverTimestamp(),
                approvedById: 'system-admin', // This should be the current user's ID
                hasPendingReturns: hasInventoryRequests
            });

            for (const requestDoc of requestsSnapshot.docs) {
                const requestData = requestDoc.data();
                const itemRef = itemRefs.get(requestData.itemId);
                const itemData = itemDocs.get(requestData.itemId).data();

                const newAvailableQuantity = itemData.availableQuantity - requestData.quantity;
                const newCheckedOutQuantity = itemData.checkedOutQuantity + requestData.quantity;
                
                transaction.update(itemRef, {
                    availableQuantity: newAvailableQuantity,
                    checkedOutQuantity: newCheckedOutQuantity,
                });

                transaction.update(doc(db, "inventory_requests", requestDoc.id), { 
                    status: 'fulfilled',
                    fulfilledAt: serverTimestamp(),
                    checkedOutToId: projectData.leadId,
                });

                // Update the project lead's checkout_items status
                transaction.update(projectLeadRef, {
                    checkout_items: arrayUnion({
                        requestId: requestDoc.id,
                        itemId: requestData.itemId,
                        itemName: itemData.name,
                        quantity: requestData.quantity,
                        status: 'fulfilled',
                        projectId: projectId
                    })
                });
            }

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
    revalidatePath('/dashboard');
}


export async function rejectProject(projectId: string) {
    const projectRef = doc(db, "projects", projectId);
     try {
        await runTransaction(db, async (transaction) => {
             const projectDoc = await transaction.get(projectRef);
             if (!projectDoc.exists() || projectDoc.data().status !== 'pending_approval') {
                throw new Error("Project not found or not pending approval.");
            }

            const projectData = projectDoc.data();
            const requestsQuery = query(collection(db, "inventory_requests"), where("projectId", "==", projectId));
            const requestsSnapshot = await getDocs(requestsQuery);

            const userRefsToUpdate: { [key: string]: any } = {};

            // Read all user docs that might need updates
            for (const requestDoc of requestsSnapshot.docs) {
                const requestData = requestDoc.data();
                if (!userRefsToUpdate[requestData.requestedById]) {
                    const userRef = doc(db, "users", requestData.requestedById);
                    userRefsToUpdate[requestData.requestedById] = await transaction.get(userRef);
                }
            }
            
            // Now perform all writes
            transaction.update(projectRef, { status: 'rejected' });

            for(const requestDoc of requestsSnapshot.docs) {
                 transaction.update(doc(db, "inventory_requests", requestDoc.id), { status: 'rejected' });
                 
                 const requestData = requestDoc.data();
                 const userDoc = userRefsToUpdate[requestData.requestedById];
                 if (userDoc && userDoc.exists()) {
                     const userData = userDoc.data();
                     const checkoutItems = userData.checkout_items || [];
                     const updatedItems = checkoutItems.map((item: any) => 
                         item.requestId === requestDoc.id ? { ...item, status: 'rejected' } : item
                     );
                     transaction.update(doc(db, "users", requestData.requestedById), { checkout_items: updatedItems });
                 }
            }
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw new Error(`Failed to reject project: ${(e as Error).message}`);
    }
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/projects');
    revalidatePath('/dashboard');
}

export async function startProject(projectId: string) {
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
        status: 'active',
        activatedAt: serverTimestamp(),
        activatedById: 'system-lead'
    });
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/projects');
}

export async function initiateProjectCompletion(projectId: string) {
    const projectRef = doc(db, "projects", projectId);
    const batch = writeBatch(db);

    const fulfilledRequestsQuery = query(
        collection(db, "inventory_requests"),
        where("projectId", "==", projectId),
        where("status", "==", "fulfilled")
    );
    const fulfilledRequestsSnap = await getDocs(fulfilledRequestsQuery);

    if (fulfilledRequestsSnap.empty) {
        // No items were ever checked out, so just complete the project
        batch.update(projectRef, { 
            status: "completed",
            hasPendingReturns: false,
            completedAt: serverTimestamp(),
            completedById: 'system-lead'
        });
        await batch.commit();
        revalidatePath(`/dashboard/projects/${projectId}`);
        revalidatePath('/dashboard/projects');
        return;
    }

    const itemIds = [...new Set(fulfilledRequestsSnap.docs.map(doc => doc.data().itemId))];
    const itemDocs = new Map();
    if (itemIds.length > 0) {
        const itemsQuery = query(collection(db, "inventory_items"), where(documentId(), "in", itemIds));
        const itemsSnap = await getDocs(itemsQuery);
        itemsSnap.forEach(doc => itemDocs.set(doc.id, doc.data()));
    }
    
    let hasPendingReturns = false;
    for (const reqDoc of fulfilledRequestsSnap.docs) {
        const item = itemDocs.get(reqDoc.data().itemId);
        if (item && !item.isPerishable) {
            batch.update(reqDoc.ref, { status: "pending_return" });

            // Update user's checkout_items status
            const reqData = reqDoc.data();
            const userRef = doc(db, "users", reqData.checkedOutToId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const checkoutItems = userSnap.data().checkout_items || [];
                const updatedItems = checkoutItems.map((ci: any) => 
                    ci.requestId === reqDoc.id ? { ...ci, status: 'pending_return' } : ci
                );
                batch.update(userRef, { checkout_items: updatedItems });
            }

            hasPendingReturns = true;
        }
    }

    if (hasPendingReturns) {
        batch.update(projectRef, { status: "pending_return", hasPendingReturns: true });
    } else {
        batch.update(projectRef, { 
            status: "completed",
            hasPendingReturns: false,
            completedAt: serverTimestamp(),
            completedById: 'system-lead' // Should be current user
        });
    }

    await batch.commit();

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/projects');
    revalidatePath('/dashboard/inventory');
}

export async function closeProject(projectId: string) {
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
        status: 'closed',
        closedAt: serverTimestamp(),
        closedById: 'system-admin'
    });
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/projects');
}

export async function joinProject(projectId: string, userId: string) {
    if (!userId) {
        throw new Error("User is not authenticated.");
    }
    try {
        const projectRef = doc(db, "projects", projectId);
        const userRef = doc(db, "users", userId);

        await runTransaction(db, async (transaction) => {
            const projectDoc = await transaction.get(projectRef);
            if (!projectDoc.exists()) {
                throw new Error("Project not found.");
            }
            // Add user to project's members
            transaction.update(projectRef, {
                memberIds: arrayUnion(userId)
            });
            // Add project to user's joined projects
            transaction.update(userRef, {
                joinedProjects: arrayUnion(projectId)
            });
        });
    } catch (error) {
        console.error("Failed to join project:", error);
        throw new Error(`Failed to join project: ${(error as Error).message}`);
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/projects');
}

export async function leaveProject(projectId: string, userId: string) {
    if (!userId) {
        throw new Error("User is not authenticated.");
    }

    try {
        const projectRef = doc(db, "projects", projectId);
        const userRef = doc(db, "users", userId);

        await runTransaction(db, async (transaction) => {
            const projectDoc = await transaction.get(projectRef);
            if (!projectDoc.exists()) {
                throw new Error("Project not found.");
            }

            const projectData = projectDoc.data();
            if (projectData.leadId === userId) {
                throw new Error("Project lead cannot leave the project.");
            }

            // Remove user from project's members
            transaction.update(projectRef, {
                memberIds: arrayRemove(userId)
            });
            // Remove project from user's joined projects
            transaction.update(userRef, {
                joinedProjects: arrayRemove(projectId)
            });
        });

    } catch (error) {
        console.error("Failed to leave project:", error);
        throw new Error(`Failed to leave project: ${(error as Error).message}`);
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/projects');
}

export async function addProjectUpdate({ projectId, text, imageUrls, userId }: { projectId: string, text: string, imageUrls: string[] | null, userId: string }) {
    if (!userId) {
        throw new Error("User is not authenticated.");
    }
    if (!text && (!imageUrls || imageUrls.length === 0)) {
        throw new Error("Update must contain text or an image.");
    }

    try {
        const updatesCollectionRef = collection(db, "projects", projectId, "updates");
        await addDoc(updatesCollectionRef, {
            text: text || "",
            imageUrls: imageUrls || null,
            postedById: userId,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Failed to add project update:", error);
        throw new Error(`Failed to post update: ${(error as Error).message}`);
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function addInventoryRequest({
  projectId,
  projectTitle,
  userId,
  requests,
}: {
  projectId: string;
  projectTitle: string;
  userId: string;
  requests: { itemId: string; quantity: number }[];
}) {
  if (!userId) {
    throw new Error("User is not authenticated.");
  }
  if (requests.length === 0) {
    throw new Error("No inventory items were requested.");
  }

  try {
    const batch = writeBatch(db);
    const reason = `Additional request for project: ${projectTitle}`;
    const userRef = doc(db, "users", userId);

    for (const req of requests) {
      const requestRef = doc(collection(db, "inventory_requests"));
      
       // Get item name for denormalization
        const itemRef = doc(db, "inventory_items", req.itemId);
        const itemSnap = await getDoc(itemRef);
        if (!itemSnap.exists()) {
            throw new Error(`Inventory item ${req.itemId} not found.`);
        }
        const itemName = itemSnap.data().name;

      batch.set(requestRef, {
        id: requestRef.id,
        projectId: projectId,
        requestedById: userId,
        itemId: req.itemId,
        quantity: req.quantity,
        reason,
        status: "pending",
        isOverdue: false,
        createdAt: serverTimestamp(),
      });

      // Update the user's checkout_items array
        batch.update(userRef, {
            checkout_items: arrayUnion({
                requestId: requestRef.id,
                itemId: req.itemId,
                itemName: itemName,
                quantity: req.quantity,
                status: "pending",
                projectId: projectId,
            })
        });
    }

    await batch.commit();
  } catch (error) {
    console.error("Failed to create inventory request:", error);
    throw new Error(`Failed to submit request: ${(error as Error).message}`);
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/inventory");
}
