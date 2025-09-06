

import { db } from './firebase';
import { collection, doc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';

const users: any[] = [
  // { 
  //   id: 'user-1', 
  //   name: 'Alex Doe', 
  //   email: 'alex.doe@example.com', 
  //   role: 'admin', 
  //   joinedProjects: ['proj-1', 'proj-3'],
  //   checkout_items: [],
  //   reimbursement: [],
  //   procurement: []
  // },
];

const projects: any[] = [
  // {
  //   id: 'proj-1',
  //   title: 'Project Phoenix - FPV Drone',
  //   description: 'Building a high-speed FPV racing drone from scratch.',
  //   type: 'drone',
  //   createdById: 'user-4',
  //   status: 'pending_approval',
  //   leadId: 'user-4',
  //   memberIds: ['user-4', 'user-5'],
  //   newItemRequestIds: ['new-req-1'],
  //   inventoryUsedIds: ['req-1'],
  //   hasPendingReturns: true,
  // },
];

const projectUpdates: any[] = [
    // { id: 'update-1', projectId: 'proj-1', text: 'Initial framework assembled. Waiting on motors.', postedById: 'user-4', createdAt: Timestamp.fromDate(new Date('2024-07-18'))},
]

const inventoryItems: any[] = [
  // { id: 'inv-1', name: 'Taranis Q X7 Transmitter', totalQuantity: 2, availableQuantity: 1, checkedOutQuantity: 1, isPerishable: false, costPerUnit: 150 },
];

const inventoryRequests: any[] = [
    // { id: 'req-1', projectId: 'proj-1', requestedById: 'user-4', itemId: 'inv-2', quantity: 2, reason: 'Need for motor testing.', status: 'pending', isOverdue: false },
];

const newItemRequests: any[] = [
    // { id: 'new-req-1', projectId: 'proj-1', requestedById: 'user-4', itemName: '3D Printer Filament (PLA, 1kg)', description: 'For printing custom drone parts.', justification: 'Essential for custom frame.', status: 'ordered', estimatedCost: 25, actualCost: 23.50, reimbursementStatus: 'none', linkedBucketId: null },
];

const reimbursements: any[] = [
    // { 
    //     id: 'reimb-1', 
    //     submittedById: 'user-4', 
    //     newItemRequestId: 'new-req-1', 
    //     amount: 23.50, 
    //     status: 'pending', 
    //     createdAt: serverTimestamp(),
    //     proofImageUrls: []
    // },
];

const procurementBuckets: any[] = [
    // {
    //     id: 'bucket-1',
    //     createdBy: 'user-3',
    //     status: 'open',
    //     description: 'Q3 General Parts Order (HobbyKing)',
    //     createdAt: Timestamp.fromDate(new Date('2024-07-28')),
    //     members: ['user-3', 'user-4']
    // },
];

const accounts: any[] = [
    // { id: 'acc-1', name: "Cash", group: "currentAssets", balance: 635706.56 },
];

const transactionsData: any[] = [
  // { id: 'log-1', type: 'income', category: "Owner's Equity", payee: "Stockholders' Equity", description: 'Opening Balance', amount: 121517.38, balance: 121517.38, date: '2024-06-23' },
].map(t => ({ ...t, isReversed: false, isReversal: false, createdAt: serverTimestamp() }));



const permissionsByRole = {
  admin: {
    canHoldKey: true,
    canManageUsers: true,
    canViewAllUsers: true,
    canCreateProjects: true,
    canApproveProjects: true,
    canCloseProjects: true,
    canViewAllProjects: true,
    canRequestInventory: true,
    canApproveInventory: true,
    canManageInventoryStock: true,
    canViewInventoryLogs: true,
    canRequestNewItem: true,
    canApproveNewItemRequest: true,
    canMarkNewItemOrdered: true,
    canSubmitReimbursements: true,
    canApproveReimbursements: true,
    canViewFinanceSummary: true,
    canExportFinanceLogs: true,
    canViewDashboardMetrics: true,
    canAccessAdminPanel: true,
    canCreateBuckets: true,
  },
  coordinator: {
    canHoldKey: true,
    canManageUsers: true,
    canViewAllUsers: true,
    canCreateProjects: true,
    canApproveProjects: true,
    canCloseProjects: true,
    canViewAllProjects: true,
    canRequestInventory: true,
    canApproveInventory: true,
    canManageInventoryStock: false,
    canViewInventoryLogs: true,
    canRequestNewItem: true,
    canApproveNewItemRequest: true,
    canMarkNewItemOrdered: true,
    canSubmitReimbursements: true,
    canApproveReimbursements: true,
    canViewFinanceSummary: true,
    canExportFinanceLogs: false,
    canViewDashboardMetrics: true,
    canAccessAdminPanel: false,
    canCreateBuckets: true,
  },
  treasurer: {
    canHoldKey: true,
    canManageUsers: false,
    canViewAllUsers: true,
    canCreateProjects: true,
    canApproveProjects: false,
    canCloseProjects: false,
    canViewAllProjects: true,
    canRequestInventory: true,
    canApproveInventory: true,
    canManageInventoryStock: true,
    canViewInventoryLogs: true,
    canRequestNewItem: true,
    canApproveNewItemRequest: true,
    canMarkNewItemOrdered: true,
    canSubmitReimbursements: true,
    canApproveReimbursements: true,
    canViewFinanceSummary: true,
    canExportFinanceLogs: true,
    canViewDashboardMetrics: true,
    canAccessAdminPanel: false,
    canCreateBuckets: true,
  },
  inventory_manager: {
    canHoldKey: true,
    canManageUsers: false,
    canViewAllUsers: false,
    canCreateProjects: true,
    canApproveProjects: false,
    canCloseProjects: false,
    canViewAllProjects: true,
    canRequestInventory: true,
    canApproveInventory: true,
    canManageInventoryStock: true,
    canViewInventoryLogs: true,
    canRequestNewItem: true,
    canApproveNewItemRequest: true,
    canMarkNewItemOrdered: true,
    canSubmitReimbursements: true,
    canApproveReimbursements: false,
    canViewFinanceSummary: false,
    canExportFinanceLogs: false,
    canViewDashboardMetrics: true,
    canAccessAdminPanel: false,
    canCreateBuckets: true,
  },
  drone_lead: {
    canHoldKey: true,
    canManageUsers: false,
    canViewAllUsers: false,
    canCreateProjects: true,
    canApproveProjects: true, // Specific to drone projects
    canCloseProjects: true,
    canViewAllProjects: false,
    canRequestInventory: true,
    canApproveInventory: false,
    canManageInventoryStock: false,
    canViewInventoryLogs: false,
    canRequestNewItem: true,
    canApproveNewItemRequest: false,
    canMarkNewItemOrdered: false,
    canSubmitReimbursements: true,
    canApproveReimbursements: false,
    canViewFinanceSummary: false,
    canExportFinanceLogs: false,
    canViewDashboardMetrics: true,
    canAccessAdminPanel: false,
    canCreateBuckets: true,
  },
  plane_lead: {
    canHoldKey: true,
    canManageUsers: false,
    canViewAllUsers: false,
    canCreateProjects: true,
    canApproveProjects: true, // Specific to plane projects
    canCloseProjects: true,
    canViewAllProjects: false,
    canRequestInventory: true,
    canApproveInventory: false,
    canManageInventoryStock: false,
    canViewInventoryLogs: false,
    canRequestNewItem: true,
    canApproveNewItemRequest: false,
    canMarkNewItemOrdered: false,
    canSubmitReimbursements: true,
    canApproveReimbursements: false,
    canViewFinanceSummary: false,
    canExportFinanceLogs: false,
    canViewDashboardMetrics: true,
    canAccessAdminPanel: false,
    canCreateBuckets: true,
  },
  member: {
    canHoldKey: false,
    canManageUsers: false,
    canViewAllUsers: false,
    canCreateProjects: true,
    canApproveProjects: false,
    canCloseProjects: false,
    canViewAllProjects: false,
    canRequestInventory: true,
    canApproveInventory: false,
    canManageInventoryStock: false,
    canViewInventoryLogs: false,
    canRequestNewItem: true,
    canApproveNewItemRequest: false,
    canMarkNewItemOrdered: false,
    canSubmitReimbursements: true,
    canApproveReimbursements: false,
    canViewFinanceSummary: false,
    canExportFinanceLogs: false,
    canViewDashboardMetrics: false,
    canAccessAdminPanel: false,
    canCreateBuckets: true,
  },
  probationary: {
    canHoldKey: false,
    canManageUsers: false,
    canViewAllUsers: false,
    canCreateProjects: false, // Restricted
    canApproveProjects: false,
    canCloseProjects: false,
    canViewAllProjects: false,
    canRequestInventory: true,
    canApproveInventory: false,
    canManageInventoryStock: false,
    canViewInventoryLogs: false,
    canRequestNewItem: true,
    canApproveNewItemRequest: false,
    canMarkNewItemOrdered: false,
    canSubmitReimbursements: true,
    canApproveReimbursements: false,
    canViewFinanceSummary: false,
    canExportFinanceLogs: false,
    canViewDashboardMetrics: false,
    canAccessAdminPanel: false,
    canCreateBuckets: false, // Restricted
  },
};


const seedCollection = async (collectionName: string, data: any[], subcollection?: { name: string, data: any[], foreignKey: string }) => {
  if (data.length === 0) {
    console.log(`Skipping seeding for ${collectionName} as no data is provided.`);
    return;
  }
  console.log(`Seeding ${collectionName}...`);
  const promises = data.map(async (item) => {
    const docId = item.id || item.name; // Use id or name for doc reference
    const docRef = doc(db, collectionName, docId);
    
    // Check if item has createdAt, if not use serverTimestamp but only if it's not already a server timestamp object
    const dataWithTimestamp = { ...item };
    if (!item.createdAt) {
        dataWithTimestamp.createdAt = serverTimestamp();
    }
    
    await setDoc(docRef, dataWithTimestamp);

    if (subcollection) {
        const subData = subcollection.data.filter(subItem => subItem[subcollection.foreignKey] === item.id);
        const subPromises = subData.map(subItem => {
            const subDocRef = doc(db, `${collectionName}/${item.id}/${subcollection.name}`, subItem.id);
            return setDoc(subDocRef, subItem);
        });
        await Promise.all(subPromises);
    }
  });
  await Promise.all(promises);
  console.log(`${collectionName} seeded successfully.`);
};

const seedPermissions = async () => {
    console.log('Seeding permissions...');
    const promises = Object.entries(permissionsByRole).map(([role, permissions]) => {
        const docRef = doc(db, 'permissions', role);
        return setDoc(docRef, permissions);
    });
    await Promise.all(promises);
    console.log('Permissions seeded successfully.');
};


const seedSystemDocs = async () => {
    console.log('Seeding system documents...');
    const now = serverTimestamp();
    const keyStatusRef = doc(db, 'system', 'key_status');
    await setDoc(keyStatusRef, {
        keyA: { holderId: null, heldSince: null },
        keyB: { holderId: null, heldSince: null },
        recentTransfers: []
    });

    const roomStatusRef = doc(db, 'system', 'room_status');
    await setDoc(roomStatusRef, {
        isOpen: false,
    });
    console.log('System documents seeded successfully.');
}

const seedDatabase = async () => {
  try {
    await seedCollection('users', users);
    await seedCollection('projects', projects, { name: 'updates', data: projectUpdates, foreignKey: 'projectId' });
    await seedCollection('inventory_items', inventoryItems);
    await seedCollection('inventory_requests', inventoryRequests);
    await seedCollection('new_item_requests', newItemRequests);
    await seedCollection('procurement_buckets', procurementBuckets);
    await seedCollection('reimbursements', reimbursements);
    await seedCollection('accounts', accounts);
    await seedCollection('transactions', transactionsData);
    await seedPermissions();
    await seedSystemDocs();
    
    console.log('\n✅ Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

seedDatabase().then(() => {
    // exit process if running in node
    if (typeof process !== 'undefined') {
        process.exit(0);
    }
});
