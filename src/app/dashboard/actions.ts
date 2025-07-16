'use server'

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppUser } from '@/context/auth-context';

const serializeData = (data: any): any => {
  if (!data) return data;
  if (typeof data === 'object' && typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }
  if (Array.isArray(data)) {
    return data.map(serializeData);
  }
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const key in data) {
      result[key] = serializeData(data[key]);
    }
    return result;
  }
  return data;
};

export async function getDashboardData(currentUser: AppUser) {
  try {
    const [
      projectsForApprovalSnap,
      procurementForApprovalSnap,
      reimbursementsForApprovalSnap,
      allProjectsSnap,
      itemsOnLoanSnap,
      roomStatusSnap,
      myBorrowedItemsSnap,
      myReimbursementsSnap,
      recentProjectsSnap,
      recentInventoryRequestsSnap,
      recentProcurementRequestsSnap,
    ] = await Promise.all([
      getDocs(query(collection(db, 'projects'), where('status', '==', 'pending_approval'))),
      getDocs(query(collection(db, 'new_item_requests'), where('status', '==', 'pending'))),
      getDocs(query(collection(db, 'reimbursements'), where('status', '==', 'pending'))),
      getDocs(collection(db, 'projects')),
      getDocs(query(collection(db, 'inventory_requests'), where('status', 'in', ['fulfilled', 'pending_return']))),
      getDoc(doc(db, 'system', 'room_status')),
      getDocs(query(collection(db, 'inventory_requests'), where('checkedOutToId', '==', currentUser.uid), where('status', 'in', ['fulfilled', 'pending_return']))),
      getDocs(query(collection(db, 'reimbursements'), where('submittedById', '==', currentUser.uid), where('status', 'in', ['approved', 'pending']))),
      getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(5))),
      getDocs(query(collection(db, 'inventory_requests'), orderBy('createdAt', 'desc'), limit(10))),
      getDocs(query(collection(db, 'new_item_requests'), orderBy('createdAt', 'desc'), limit(5))),
    ]);

    const approvalQueues = {
      projects: projectsForApprovalSnap.size,
      procurement: procurementForApprovalSnap.size,
      reimbursements: reimbursementsForApprovalSnap.size,
    };

    const allProjects = allProjectsSnap.docs.map((doc) => serializeData(doc.data()));
    const itemsOnLoan = itemsOnLoanSnap.docs.map((doc) => serializeData(doc.data()));
    const roomStatusData = roomStatusSnap.exists() ? serializeData(roomStatusSnap.data()) : { isOpen: false };

    let roomOccupancyUser = 'N/A';
    if (roomStatusData.isOpen && roomStatusData.openedById) {
      try {
        const userDoc = await getDoc(doc(db, 'users', roomStatusData.openedById));
        if (userDoc.exists()) {
          roomOccupancyUser = userDoc.data().name;
        }
      } catch (error) {
        console.error('Failed to fetch room occupancy user:', error);
      }
    }

    const overviewMetrics = {
      activeProjects: allProjects.filter((p) => p.status === 'active').length,
      totalProjects: allProjects.length,
      itemsOnLoan: itemsOnLoan.reduce((sum: number, req: any) => sum + req.quantity, 0),
      overdueItems: itemsOnLoan.filter((req: any) => req.isOverdue).length,
      pendingReimbursements: approvalQueues.reimbursements,
      roomStatus: {
        occupied: roomStatusData.isOpen,
        user: roomOccupancyUser,
        since: roomStatusData.openedAt ? new Date(roomStatusData.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      },
    };

    const actionItems = {
      itemsToReturn: myBorrowedItemsSnap.docs.map((doc) => serializeData(doc.data())),
      reimbursements: myReimbursementsSnap.docs.map((doc) => serializeData(doc.data())),
    };

    const recentProjects = recentProjectsSnap.docs.map((doc) => ({ type: 'project', ...serializeData(doc.data()) }));
    const recentInventory = recentInventoryRequestsSnap.docs.map((doc) => ({ type: 'inventory', ...serializeData(doc.data()) }));
    const recentProcurement = recentProcurementRequestsSnap.docs.map((doc) => ({ type: 'procurement', ...serializeData(doc.data()) }));

    const combinedFeed = [...recentProjects, ...recentInventory, ...recentProcurement];
    combinedFeed.sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());

    const userIds = [...new Set(combinedFeed.flatMap((item: any) => [item.requestedById, item.postedById, item.leadId, item.fulfilledById, item.returnedById, item.rejectedById, item.createdBy].filter(Boolean)))];

    let users: any = {};
    try {
      if (userIds.length > 0) {
        const userChunks = [];
        for (let i = 0; i < userIds.length; i += 30) {
          userChunks.push(userIds.slice(i, i + 30));
        }
        for (const chunk of userChunks) {
          const usersSnap = await getDocs(query(collection(db, 'users'), where('id', 'in', chunk)));
          usersSnap.docs.forEach((doc) => {
            users[doc.id] = serializeData(doc.data());
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch user references for activity feed:', error);
    }

    const inventoryItemIds = [...new Set(recentInventory.map((item: any) => item.itemId).filter(Boolean))];
    let inventoryItems: any = {};
    try {
      if (inventoryItemIds.length > 0) {
        const itemsSnap = await getDocs(query(collection(db, 'inventory_items'), where('id', 'in', inventoryItemIds.slice(0, 30))));
        itemsSnap.docs.forEach((doc) => {
          inventoryItems[doc.id] = serializeData(doc.data());
        });
      }
    } catch (error) {
      console.error('Failed to fetch inventory items for activity feed:', error);
    }

    return JSON.parse(JSON.stringify({
      approvalQueues,
      overviewMetrics,
      actionItems,
      activityFeed: combinedFeed.slice(0, 15),
      users,
      inventoryItems
    }));

  } catch (err) {
    console.error('🔥 getDashboardData failed:', err);
    throw new Error('Failed to load dashboard data');
  }
}