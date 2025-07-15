
import { db } from './firebase';
import { collection, doc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';

const users = [
  { id: 'user-1', name: 'Alex Doe', email: 'alex.doe@example.com', role: 'admin', joinedProjects: ['proj-1', 'proj-3'] },
  { id: 'user-2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'coordinator', joinedProjects: ['proj-2', 'proj-4'] },
  { id: 'user-3', name: 'Sam Wilson', email: 'sam.wilson@example.com', role: 'inventory_manager', joinedProjects: ['proj-2'] },
  { id: 'user-4', name: 'Peter Jones', email: 'peter.jones@example.com', role: 'drone_lead', joinedProjects: ['proj-1', 'proj-4'] },
  { id: 'user-5', name: 'Mary Jane', email: 'mary.jane@example.com', role: 'plane_lead', joinedProjects: ['proj-1', 'proj-3'] },
  { id: 'user-6', name: 'Member Fresh', email: 'member.fresh@example.com', role: 'member', joinedProjects: [] },

];

const projects = [
  {
    id: 'proj-1',
    title: 'Project Phoenix - FPV Drone',
    description: 'Building a high-speed FPV racing drone from scratch.',
    type: 'drone',
    createdById: 'user-4',
    status: 'pending_approval',
    leadId: 'user-4',
    memberIds: ['user-4', 'user-5'],
    newItemRequestIds: ['new-req-1'],
    inventoryUsedIds: ['req-1'],
    hasPendingReturns: true,
  },
  {
    id: 'proj-2',
    title: 'The Crawler King - RC Rock Crawler',
    description: 'A custom-built RC rock crawler for extreme terrain.',
    type: 'other',
    createdById: 'user-3',
    status: 'completed',
    approvedAt: Timestamp.fromDate(new Date('2024-05-01')),
    approvedById: 'user-2',
    activatedAt: Timestamp.fromDate(new Date('2024-05-05')),
    activatedById: 'user-3',
    completedAt: Timestamp.fromDate(new Date('2024-07-20')),
    completedById: 'user-3',
    leadId: 'user-3',
    memberIds: ['user-3', 'user-2'],
    newItemRequestIds: [],
    inventoryUsedIds: [],
    hasPendingReturns: false,
  },
  {
    id: 'proj-3',
    title: 'Stealth Wing - Glider Project',
    description: 'Designing a fast and agile RC plane for lake races.',
    type: 'plane',
    createdById: 'user-5',
    status: 'pending_approval',
    leadId: 'user-5',
    memberIds: ['user-1', 'user-5'],
    newItemRequestIds: [],
    inventoryUsedIds: ['req-2'],
    hasPendingReturns: false,
  },
  {
    id: 'proj-4',
    title: 'Sea Serpent - RC Boat',
    description: 'A new project waiting for the green light.',
    type: 'other',
    createdById: 'user-1',
    status: 'approved',
    approvedAt: Timestamp.fromDate(new Date('2024-07-25')),
    approvedById: 'user-2',
    leadId: 'user-1',
    memberIds: ['user-1', 'user-2'],
    newItemRequestIds: [],
    inventoryUsedIds: [],
    hasPendingReturns: false,
  }
];

const projectUpdates = [
    { id: 'update-1', projectId: 'proj-1', text: 'Initial framework assembled. Waiting on motors.', postedById: 'user-4', createdAt: Timestamp.fromDate(new Date('2024-07-18'))},
    { id: 'update-2', projectId: 'proj-2', text: 'Chassis and suspension complete. Final testing passed.', postedById: 'user-3', createdAt: Timestamp.fromDate(new Date('2024-07-19'))},
]

const inventoryItems = [
  { id: 'inv-1', name: 'Taranis Q X7 Transmitter', totalQuantity: 2, availableQuantity: 1, checkedOutQuantity: 1, isPerishable: false, costPerUnit: 150 },
  { id: 'inv-2', name: 'Lipo Battery 4S 1500mAh', totalQuantity: 10, availableQuantity: 5, checkedOutQuantity: 5, isPerishable: true, costPerUnit: 25 },
  { id: 'inv-3', name: 'iMAX B6 Charger', totalQuantity: 3, availableQuantity: 3, checkedOutQuantity: 0, isPerishable: false, costPerUnit: 50 },
  { id: 'inv-4', name: 'FPV Goggles Eachine EV800D', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false, costPerUnit: 120 },
];

const inventoryRequests = [
    { id: 'req-1', projectId: 'proj-1', requestedById: 'user-4', itemId: 'inv-2', quantity: 2, reason: 'Need for motor testing.', status: 'pending', isOverdue: false },
    { id: 'req-2', projectId: 'proj-3', requestedById: 'user-5', itemId: 'inv-4', quantity: 1, reason: 'For initial boat camera setup.', status: 'pending', isOverdue: false },
];

const newItemRequests = [
    { id: 'new-req-1', projectId: 'proj-1', requestedById: 'user-4', itemName: '3D Printer Filament (PLA, 1kg)', description: 'For printing custom drone parts.', justification: 'Essential for custom frame.', status: 'ordered', estimatedCost: 25, actualCost: 23.50, reimbursementStatus: 'none', linkedBucketId: null },
];

const reimbursements = [
    { 
        id: 'reimb-1', 
        submittedById: 'user-4', 
        newItemRequestId: 'new-req-1', 
        amount: 23.50, 
        status: 'pending', 
        createdAt: serverTimestamp(),
        proofImageUrls: []
    },
    { 
        id: 'reimb-2', 
        submittedById: 'user-5', 
        amount: 15.00, 
        status: 'approved', 
        createdAt: Timestamp.fromDate(new Date('2024-07-26')),
        reviewedAt: Timestamp.fromDate(new Date('2024-07-27')),
        reviewedById: 'user-2',
        notes: 'Travel for parts pickup',
        proofImageUrls: []
    }
];

const procurementBuckets = [
    {
        id: 'bucket-1',
        createdBy: 'user-3',
        status: 'open',
        description: 'Q3 General Parts Order (HobbyKing)',
        createdAt: Timestamp.fromDate(new Date('2024-07-28')),
        members: ['user-3', 'user-4']
    },
    {
        id: 'bucket-2',
        createdBy: 'user-2',
        status: 'closed',
        description: 'Bulk order for Plane components',
        createdAt: Timestamp.fromDate(new Date('2024-07-20')),
        closedAt: Timestamp.fromDate(new Date('2024-07-25')),
        members: ['user-2', 'user-5']
    }
]

const permissionsByRole = {
  admin: {
    canManageUsers: true,
    canViewAllUsers: true,
    canCreateProjects: true,
    canApproveProjects: true,
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
    canManageUsers: false,
    canViewAllUsers: true,
    canCreateProjects: true,
    canApproveProjects: true,
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
  inventory_manager: {
    canManageUsers: false,
    canViewAllUsers: false,
    canCreateProjects: true,
    canApproveProjects: false,
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
    canManageUsers: false,
    canViewAllUsers: false,
    canCreateProjects: true,
    canApproveProjects: true, // Specific to drone projects
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
    canManageUsers: false,
    canViewAllUsers: false,
    canCreateProjects: true,
    canApproveProjects: true, // Specific to plane projects
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
    canManageUsers: false,
    canViewAllUsers: false,
    canCreateProjects: true,
    canApproveProjects: false,
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
  }
};


const seedCollection = async (collectionName: string, data: any[], subcollection?: { name: string, data: any[], foreignKey: string }) => {
  console.log(`Seeding ${collectionName}...`);
  const promises = data.map(async (item) => {
    const docId = item.id || item.name; // Use id or name for doc reference
    const docRef = doc(db, collectionName, docId);
    const dataWithTimestamp = {
        ...item,
        createdAt: item.createdAt || serverTimestamp(),
    };
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
        keyA: { holderId: 'user-1', heldSince: now },
        keyB: { holderId: 'user-3', heldSince: now },
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
