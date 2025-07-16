
'use server'

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AppUser } from '@/context/auth-context'

export async function getDashboardData(currentUser: AppUser) {
  // Queries for Approval Queues (for admins/coordinators)
  const projectsForApprovalQuery = query(
    collection(db, 'projects'),
    where('status', '==', 'pending_approval')
  )
  const procurementForApprovalQuery = query(
    collection(db, 'new_item_requests'),
    where('status', '==', 'pending')
  )
  const reimbursementsForApprovalQuery = query(
    collection(db, 'reimbursements'),
    where('status', '==', 'pending')
  )

  // Queries for Overview Metrics (for all users)
  const allProjectsQuery = query(collection(db, 'projects'))
  const itemsOnLoanQuery = query(
    collection(db, 'inventory_requests'),
    where('status', 'in', ['fulfilled', 'pending_return'])
  )
  const roomStatusQuery = doc(db, 'system', 'room_status')

  // Queries for User-Specific Action Items
  const myBorrowedItemsQuery = query(
    collection(db, 'inventory_requests'),
    where('checkedOutToId', '==', currentUser.uid),
    where('status', 'in', ['fulfilled', 'pending_return'])
  )

  const myReimbursementsQuery = query(
    collection(db, 'reimbursements'),
    where('submittedById', '==', currentUser.uid),
    where('status', 'in', ['approved', 'pending'])
  )

  // Queries for Activity Feed
  const recentProjectUpdatesQuery = query(
    collection(db, 'projects'),
    orderBy('createdAt', 'desc'),
    limit(5)
  )
  const recentInventoryRequestsQuery = query(
    collection(db, 'inventory_requests'),
    orderBy('createdAt', 'desc'),
    limit(10)
  )
  const recentProcurementRequestsQuery = query(
    collection(db, 'new_item_requests'),
    orderBy('createdAt', 'desc'),
    limit(5)
  )

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
    getDocs(projectsForApprovalQuery),
    getDocs(procurementForApprovalQuery),
    getDocs(reimbursementsForApprovalQuery),
    getDocs(allProjectsQuery),
    getDocs(itemsOnLoanQuery),
    getDoc(roomStatusQuery),
    getDocs(myBorrowedItemsQuery),
    getDocs(myReimbursementsQuery),
    getDocs(recentProjectUpdatesQuery),
    getDocs(recentInventoryRequestsQuery),
    getDocs(recentProcurementRequestsQuery),
  ])

  // Process Approval Queues
  const approvalQueues = {
    projects: projectsForApprovalSnap.size,
    procurement: procurementForApprovalSnap.size,
    reimbursements: reimbursementsForApprovalSnap.size,
  }

  // Process Overview Metrics
  const allProjects = allProjectsSnap.docs.map((doc) => doc.data())
  const itemsOnLoan = itemsOnLoanSnap.docs.map((doc) => doc.data())
  const roomStatusData = roomStatusSnap.exists()
    ? roomStatusSnap.data()
    : { isOpen: false }
  let roomOccupancyUser = 'N/A'
  if (roomStatusData.isOpen && roomStatusData.openedById) {
    const userDoc = await getDoc(doc(db, 'users', roomStatusData.openedById))
    if (userDoc.exists()) {
      roomOccupancyUser = userDoc.data().name
    }
  }

  const overviewMetrics = {
    activeProjects: allProjects.filter((p) => p.status === 'active').length,
    totalProjects: allProjects.length,
    itemsOnLoan: itemsOnLoan.reduce((sum, req) => sum + req.quantity, 0),
    overdueItems: itemsOnLoan.filter((req) => req.isOverdue).length,
    pendingReimbursements: approvalQueues.reimbursements, // This is the same as the approval queue item
    roomStatus: {
      occupied: roomStatusData.isOpen,
      user: roomOccupancyUser,
      since: roomStatusData.openedAt
        ? roomStatusData.openedAt
            .toDate()
            .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '',
    },
  }

  // Process User Action Items
  const actionItems = {
    itemsToReturn: myBorrowedItemsSnap.docs.map((doc) => doc.data()),
    reimbursements: myReimbursementsSnap.docs.map((doc) => doc.data()),
  }

  // Process Activity Feed
  const recentProjects = recentProjectsSnap.docs.map((doc) => ({
    type: 'project',
    ...doc.data(),
  }))
  const recentInventory = recentInventoryRequestsSnap.docs.map((doc) => ({
    type: 'inventory',
    ...doc.data(),
  }))
  const recentProcurement = recentProcurementRequestsSnap.docs.map((doc) => ({
    type: 'procurement',
    ...doc.data(),
  }))

  const combinedFeed = [...recentProjects, ...recentInventory, ...recentProcurement]
  combinedFeed.sort((a, b) => {
    const dateA = a.createdAt?.toDate() || 0
    const dateB = b.createdAt?.toDate() || 0
    return dateB - dateA
  })
  
  const userIds = [...new Set(combinedFeed.flatMap((item: any) => [item.requestedById, item.postedById, item.leadId, item.fulfilledById, item.returnedById, item.rejectedById, item.createdBy].filter(Boolean)))]
  
  let users: any = {};
  if (userIds.length > 0) {
    const userChunks = [];
    for (let i = 0; i < userIds.length; i += 30) {
        userChunks.push(userIds.slice(i, i + 30));
    }
    for (const chunk of userChunks) {
        const usersQuery = query(collection(db, "users"), where("id", "in", chunk));
        const usersSnap = await getDocs(usersQuery);
        usersSnap.docs.forEach(doc => {
            users[doc.id] = doc.data();
        });
    }
  }

  const inventoryItemIds = [...new Set(recentInventory.map((item: any) => item.itemId).filter(Boolean))];
  let inventoryItems: any = {};
   if (inventoryItemIds.length > 0) {
    const itemsQuery = query(collection(db, "inventory_items"), where("id", "in", inventoryItemIds.slice(0,30)));
    const itemsSnap = await getDocs(itemsQuery);
    itemsSnap.docs.forEach(doc => {
        inventoryItems[doc.id] = doc.data();
    });
  }


  return JSON.parse(JSON.stringify({
    approvalQueues,
    overviewMetrics,
    actionItems,
    activityFeed: combinedFeed.slice(0, 15),
    users,
    inventoryItems
  }));
}
