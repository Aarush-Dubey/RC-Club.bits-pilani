
'use server'

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Project, User } from './projects/project-card'
import { revalidatePath } from 'next/cache'


// Helper to convert Firestore Timestamps to JSON-serializable strings
const serializeData = (doc: any): any => {
    const data = doc.data();
    if (!data) return null;

    const serializedData: { [key: string]: any } = {};

    // Convert all Timestamp fields to ISO strings
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            if (data[key]?.toDate) {
                serializedData[key] = data[key].toDate().toISOString();
            } else {
                serializedData[key] = data[key];
            }
        }
    }
    return { id: doc.id, ...serializedData };
};


export async function getPendingProjectApprovals(currentUserId: string) {
  // Fetch pending project approvals
  const approvalRequestsQuery = query(
    collection(db, "projects"),
    where("status", "==", "pending_approval")
  );
  const approvalRequestsSnapshot = await getDocs(approvalRequestsQuery);
  const approvalRequests = approvalRequestsSnapshot.docs.map(serializeData) as Project[];

  const userIds = [...new Set(approvalRequests.flatMap(p => [p.leadId, ...p.memberIds].filter(Boolean)))];
  const users: Record<string, User> = {};

  if (userIds.length > 0) {
    const userChunks = [];
    for (let i = 0; i < userIds.length; i += 30) {
        userChunks.push(userIds.slice(i, i + 30));
    }
    
    for (const chunk of userChunks) {
        const usersQuery = query(collection(db, "users"), where("id", "in", chunk));
        const usersSnap = await getDocs(usersQuery);
        usersSnap.docs.forEach(doc => {
            users[doc.id] = serializeData(doc) as User;
        });
    }
  }

  // Fetch current user's data for action items
  const currentUserDoc = await getDoc(doc(db, "users", currentUserId));
  const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : { checkout_items: [], reimbursement: [] };

  // Get items that are currently checked out to the user ('fulfilled') or are pending return
  const itemsOnLoan = currentUserData.checkout_items?.filter((item: any) => ['fulfilled', 'pending_return'].includes(item.status)) || [];
  
  // Get reimbursement requests for the user that are 'pending' or 'approved'
  const reimbursementsQuery = query(
    collection(db, 'reimbursements'), 
    where('submittedById', '==', currentUserId),
    where('status', 'in', ['pending', 'approved'])
  );
  const reimbursementsSnapshot = await getDocs(reimbursementsQuery);
  const pendingReimbursements = reimbursementsSnapshot.docs.map(serializeData);


  // Get the full inventory item details for the items on loan
  const inventoryItemIds = [...new Set(itemsOnLoan.map((item: any) => item.itemId).filter(Boolean))];
  const inventoryItems: Record<string, any> = {};
  if (inventoryItemIds.length > 0) {
      const itemsQuery = query(collection(db, "inventory_items"), where("id", "in", inventoryItemIds));
      const itemsSnap = await getDocs(itemsQuery);
      itemsSnap.docs.forEach(doc => {
          inventoryItems[doc.id] = serializeData(doc);
      });
  }

  return JSON.parse(JSON.stringify({
    approvalRequests, 
    users, 
    actionItems: {
        itemsOnLoan: itemsOnLoan,
        reimbursements: pendingReimbursements,
    },
    inventoryItems: inventoryItems,
  }));
}

export async function getSystemStatus() {
    // --- Room Status ---
    const roomStatusRef = doc(db, 'system', 'room_status');
    const roomStatusSnap = await getDoc(roomStatusRef);
    const roomStatusData = roomStatusSnap.exists() ? roomStatusSnap.data() : { isOpen: false, updatedById: null, updatedAt: null };

    let updatedByUser = null;
    if (roomStatusData.updatedById) {
        const userSnap = await getDoc(doc(db, "users", roomStatusData.updatedById));
        if (userSnap.exists()) {
            updatedByUser = userSnap.data().name;
        }
    }
    const roomStatus = {
        isOpen: roomStatusData.isOpen,
        updatedBy: updatedByUser,
        updatedAt: roomStatusData.updatedAt?.toDate ? roomStatusData.updatedAt.toDate().toISOString() : null,
    };

    // --- Key Status ---
    const keyStatusRef = doc(db, 'system', 'key_status');
    const keyStatusSnap = await getDoc(keyStatusRef);
    const keyStatusData = keyStatusSnap.exists() ? keyStatusSnap.data() : {};

    const keyHolderIds = Object.values(keyStatusData)
        .map((key: any) => key.holderId)
        .filter(Boolean);

    const users: Record<string, User> = {};
    if (keyHolderIds.length > 0) {
        const usersQuery = query(collection(db, "users"), where("id", "in", keyHolderIds));
        const usersSnap = await getDocs(usersQuery);
        usersSnap.docs.forEach(doc => {
            users[doc.id] = serializeData(doc) as User;
        });
    }
    
    const keyStatus = Object.entries(keyStatusData)
        .filter(([key]) => key !== 'recentTransfers')
        .map(([key, value]: [string, any]) => ({
            keyName: key,
            holder: users[value.holderId]?.name || 'Unknown',
            heldSince: value.heldSince?.toDate ? value.heldSince.toDate().toISOString() : null,
        }));
    
    return JSON.parse(JSON.stringify({ roomStatus, keyStatus }));
}

export async function toggleRoomStatus(userId: string) {
    if (!userId) {
        throw new Error("User must be logged in to change room status.");
    }
    const roomStatusRef = doc(db, 'system', 'room_status');

    await runTransaction(db, async (transaction) => {
        const roomStatusDoc = await transaction.get(roomStatusRef);
        const currentStatus = roomStatusDoc.exists() ? roomStatusDoc.data().isOpen : false;
        
        transaction.set(roomStatusRef, {
            isOpen: !currentStatus,
            updatedById: userId,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    });

    revalidatePath('/dashboard');
}
