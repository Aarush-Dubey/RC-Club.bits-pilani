
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
  arrayUnion,
  limit,
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
    // The user document ID from Firestore is the UID in Firebase Auth.
    return { id: doc.id, uid: doc.id, ...serializedData };
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
    
    // Also get users from recent transfers to avoid extra fetches on client
    const recentTransferUserIds = (keyStatusData.recentTransfers || [])
        .flatMap((t: any) => [t.fromId, t.toId])
        .filter(Boolean);

    const allUserIds = [...new Set([...keyHolderIds, ...recentTransferUserIds])];
    
    const users: Record<string, User> = {};
    if (allUserIds.length > 0) {
        const usersQuery = query(collection(db, "users"), where("id", "in", allUserIds));
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
            holderId: value.holderId,
            heldSince: value.heldSince?.toDate ? value.heldSince.toDate().toISOString() : null,
        }));
    
    const recentTransfers = (keyStatusData.recentTransfers || []).map((t: any) => ({
        ...t,
        fromName: users[t.fromId]?.name || 'Unknown',
        toName: users[t.toId]?.name || 'Unknown',
        timestamp: t.timestamp?.toDate ? t.timestamp.toDate().toISOString() : null,
    })).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return JSON.parse(JSON.stringify({ roomStatus, keyStatus, recentTransfers }));
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

export async function getEligibleKeyHolders() {
    // This is not perfectly secure, as a user could have their role changed.
    // The server action `transferKey` does the actual permission check.
    const rolesWithPermissionQuery = query(
        collection(db, 'permissions'),
        where('canHoldKey', '==', true)
    );
    const rolesSnapshot = await getDocs(rolesWithPermissionQuery);
    const eligibleRoles = rolesSnapshot.docs.map(doc => doc.id);

    if (eligibleRoles.length === 0) return [];
    
    const usersQuery = query(collection(db, 'users'), where('role', 'in', eligibleRoles));
    const usersSnapshot = await getDocs(usersQuery);
    
    return usersSnapshot.docs.map(serializeData);
}

export async function transferKey(keyName: string, fromUserId: string, toUserId: string) {
    if (!fromUserId || !toUserId || !keyName) {
        throw new Error("Missing required information for key transfer.");
    }

    const keyStatusRef = doc(db, 'system', 'key_status');
    const toUserRef = doc(db, 'users', toUserId);

    await runTransaction(db, async (transaction) => {
        // --- 1. Read Phase ---
        const toUserDoc = await transaction.get(toUserRef);
        const keyStatusDoc = await transaction.get(keyStatusRef);

        // --- 2. Validation Phase ---
        if (!toUserDoc.exists()) {
            throw new Error("Recipient user not found.");
        }
        
        const toUserData = toUserDoc.data();
        const toUserRole = toUserData.role || 'member';
        const permissionsDoc = await getDoc(doc(db, "permissions", toUserRole));

        if (!permissionsDoc.exists() || !permissionsDoc.data()?.canHoldKey) {
            throw new Error(`User ${toUserData.name} does not have permission to hold keys.`);
        }
        
        if (!keyStatusDoc.exists()) {
            throw new Error("Key status document not found.");
        }
        const keyStatusData = keyStatusDoc.data();
        if (keyStatusData[keyName]?.holderId !== fromUserId) {
            throw new Error("You are not the current holder of this key.");
        }

        // --- 3. Write Phase ---
        const newTransferLog = {
            keyName,
            fromId: fromUserId,
            toId: toUserId,
            timestamp: serverTimestamp()
        };

        transaction.update(keyStatusRef, {
            [`${keyName}.holderId`]: toUserId,
            [`${keyName}.heldSince`]: serverTimestamp(),
            recentTransfers: arrayUnion(newTransferLog)
        });
    });

    revalidatePath("/dashboard");
}
