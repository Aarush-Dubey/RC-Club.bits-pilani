import { db } from './firebase';
import { collection, doc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';

const users = [
  { id: 'user-1', name: 'Alex Doe', email: 'alex.doe@example.com', role: 'admin', joinedProjects: ['proj-1', 'proj-3'] },
  { id: 'user-2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'treasurer', joinedProjects: ['proj-2', 'proj-4'] },
  { id: 'user-3', name: 'Sam Wilson', email: 'sam.wilson@example.com', role: 'inventory_manager', joinedProjects: ['proj-2'] },
  { id: 'user-4', name: 'Peter Jones', email: 'peter.jones@example.com', role: 'project_lead', joinedProjects: ['proj-1', 'proj-4'] },
  { id: 'user-5', name: 'Mary Jane', email: 'mary.jane@example.com', role: 'member', joinedProjects: ['proj-1', 'proj-3'] },
];

const projects = [
  {
    id: 'proj-1',
    title: 'Project Phoenix - FPV Drone',
    description: 'Building a high-speed FPV racing drone from scratch.',
    createdById: 'user-4',
    status: 'active',
    approvedBy: 'user-1',
    approvedAt: Timestamp.fromDate(new Date('2024-07-10')),
    targetCompletion: Timestamp.fromDate(new Date('2024-09-30')),
    lastActivity: serverTimestamp(),
    teamLeadId: 'user-4',
    memberIds: ['user-4', 'user-5'],
    updates: [{ byId: 'user-4', message: 'Kick-off meeting complete.', timestamp: Timestamp.fromDate(new Date('2024-07-15')) }],
    hasPendingReturns: true,
    inventoryUsage: [{ itemId: 'inv-2', quantity: 5 }],
  },
  {
    id: 'proj-2',
    title: 'The Crawler King - RC Rock Crawler',
    description: 'A custom-built RC rock crawler for extreme terrain.',
    createdById: 'user-2',
    status: 'completed',
    approvedBy: 'user-1',
    approvedAt: Timestamp.fromDate(new Date('2024-05-01')),
    targetCompletion: Timestamp.fromDate(new Date('2024-07-01')),
    actualCompletion: Timestamp.fromDate(new Date('2024-07-20')),
    lastActivity: serverTimestamp(),
    teamLeadId: 'user-2',
    memberIds: ['user-2', 'user-3'],
    updates: [],
    hasPendingReturns: false,
    inventoryUsage: [],
  },
  {
    id: 'proj-3',
    title: 'Sea Serpent - RC Boat',
    description: 'Designing a fast and agile RC boat for lake races.',
    createdById: 'user-1',
    status: 'approved',
    approvedBy: 'user-1',
    approvedAt: Timestamp.fromDate(new Date('2024-07-25')),
    targetCompletion: Timestamp.fromDate(new Date('2024-10-31')),
    lastActivity: serverTimestamp(),
    teamLeadId: 'user-1',
    memberIds: ['user-1', 'user-5'],
    updates: [],
    hasPendingReturns: false,
    inventoryUsage: [],
  }
];

const inventoryItems = [
  { id: 'inv-1', name: 'Taranis Q X7 Transmitter', totalQuantity: 2, availableQuantity: 1, checkedOutQuantity: 1, isPerishable: false, costPerUnit: 150 },
  { id: 'inv-2', name: 'Lipo Battery 4S 1500mAh', totalQuantity: 10, availableQuantity: 5, checkedOutQuantity: 5, isPerishable: true, costPerUnit: 25 },
  { id: 'inv-3', name: 'iMAX B6 Charger', totalQuantity: 3, availableQuantity: 3, checkedOutQuantity: 0, isPerishable: false, costPerUnit: 50 },
  { id: 'inv-4', name: 'FPV Goggles Eachine EV800D', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false, costPerUnit: 120 },
];

const inventoryRequests = [
    { id: 'req-1', projectId: 'proj-1', requestedById: 'user-5', itemId: 'inv-1', quantity: 1, reason: 'Need for flight testing.', status: 'fulfilled', fulfilledAt: Timestamp.fromDate(new Date('2024-07-28')), isOverdue: false },
    { id: 'req-2', projectId: 'proj-3', requestedById: 'user-1', itemId: 'inv-4', quantity: 1, reason: 'For initial boat camera setup.', status: 'pending', isOverdue: false },
];

const newItemRequests = [
    { id: 'new-req-1', projectId: 'proj-1', requestedById: 'user-4', itemName: '3D Printer Filament (PLA, 1kg)', description: 'For printing custom drone parts.', justification: 'Essential for custom frame.', status: 'ordered', estimatedCost: 25, actualCost: 23.50, reimbursementStatus: 'none' },
];

const reimbursements = [
    { id: 'reimb-1', submittedById: 'user-4', newItemRequestId: 'new-req-1', amount: 23.50, status: 'pending', createdAt: serverTimestamp() },
    { id: 'reimb-2', submittedById: 'user-5', description: 'Travel for parts pickup', amount: 15.00, status: 'approved', createdAt: Timestamp.fromDate(new Date('2024-07-26')), approvedAt: Timestamp.fromDate(new Date('2024-07-27')) }
];

const seedCollection = async (collectionName: string, data: any[]) => {
  console.log(`Seeding ${collectionName}...`);
  const promises = data.map(item => {
    const docRef = doc(db, collectionName, item.id);
    // Add createdAt if it doesn't exist
    const dataWithTimestamp = {
        ...item,
        createdAt: item.createdAt || serverTimestamp(),
    };
    return setDoc(docRef, dataWithTimestamp);
  });
  await Promise.all(promises);
  console.log(`${collectionName} seeded successfully.`);
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
    await seedCollection('users', users.map(u => ({...u, permissions: [u.role]})));
    await seedCollection('projects', projects);
    await seedCollection('inventory_items', inventoryItems);
    await seedCollection('inventory_requests', inventoryRequests);
    await seedCollection('new_item_requests', newItemRequests);
    await seedCollection('reimbursements', reimbursements);
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
