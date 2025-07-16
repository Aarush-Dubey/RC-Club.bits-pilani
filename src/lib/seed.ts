
import { db } from './firebase';
import { collection, doc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';

const users = [
  { 
    id: 'user-1', 
    name: 'Alex Doe', 
    email: 'alex.doe@example.com', 
    role: 'admin', 
    joinedProjects: ['proj-1', 'proj-3'],
    checkout_items: [],
    reimbursement: [],
    procurement: []
  },
  { 
    id: 'user-2', 
    name: 'Jane Smith', 
    email: 'jane.smith@example.com', 
    role: 'coordinator', 
    joinedProjects: ['proj-2', 'proj-4'],
    checkout_items: [],
    reimbursement: [],
    procurement: []
  },
  { 
    id: 'user-3', 
    name: 'Sam Wilson', 
    email: 'sam.wilson@example.com', 
    role: 'inventory_manager', 
    joinedProjects: ['proj-2'],
    checkout_items: [
        { itemName: 'iMAX B6 Charger', quantity: 1, status: 'fulfilled', projectId: 'proj-2' }
    ],
    reimbursement: [],
    procurement: []
  },
  { 
    id: 'user-4', 
    name: 'Peter Jones', 
    email: 'peter.jones@example.com', 
    role: 'drone_lead', 
    joinedProjects: ['proj-1', 'proj-4'],
    checkout_items: [
        { itemName: 'Lipo Battery 4S 1500mAh', quantity: 2, status: 'pending_return', projectId: 'proj-1' }
    ],
    reimbursement: [
        { amount: 23.50, status: 'pending', notes: 'Reimbursement for: 3D Printer Filament' }
    ],
    procurement: [
        { itemName: '3D Printer Filament (PLA, 1kg)', status: 'ordered', bucketId: null }
    ]
  },
  { 
    id: 'user-5', 
    name: 'Mary Jane', 
    email: 'mary.jane@example.com', 
    role: 'plane_lead', 
    joinedProjects: ['proj-1', 'proj-3'],
    checkout_items: [
        { itemName: 'FPV Goggles Eachine EV800D', quantity: 1, status: 'fulfilled', projectId: 'proj-3' }
    ],
    reimbursement: [
        { amount: 15.00, status: 'approved', notes: 'Travel for parts pickup' }
    ],
    procurement: []
  },
  { 
    id: 'user-6', 
    name: 'Member Fresh', 
    email: 'member.fresh@example.com', 
    role: 'member', 
    joinedProjects: [],
    checkout_items: [],
    reimbursement: [],
    procurement: []
  },
  {
    id: 'user-7',
    name: 'Treasurer Tom',
    email: 'treasurer.tom@example.com',
    role: 'treasurer',
    joinedProjects: [],
    checkout_items: [],
    reimbursement: [],
    procurement: []
  }
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
];

const accounts = [
    { id: 'acc-1', name: "Cash", group: "currentAssets", balance: 635706.56 },
    { id: 'acc-2', name: "Perishables", group: "currentAssets", balance: 9833 },
    { id: 'acc-3', name: "Apogee 2025", group: "currentAssets", balance: 1469 },
    { id: 'acc-4', name: "BOSM24 Equipment", group: "currentAssets", balance: 152.6 },
    { id: 'acc-5', name: "BOSM Receivable", group: "currentAssets", balance: 0 },
    { id: 'acc-6', name: "Robofest Receivable", group: "currentAssets", balance: 0 },
    { id: 'acc-7', name: "General Equipment", group: "fixedAssets", balance: 145766.55 },
    { id: 'acc-8', name: "Robofest24 Equipment", group: "fixedAssets", balance: 134690.71 },
    { id: 'acc-9', name: "Apogee 2025", group: "fixedAssets", balance: 32187.31 },
    { id: 'acc-10', name: "BOSM24 Equipment", group: "fixedAssets", balance: 21234.39 },
    { id: 'acc-11', name: "Stockholders' Equity", group: "ownersEquity", balance: -980404.12 },
];


const logbookData = [
    { id: 'log-1', date: '2024-06-23', assetGroup: "Owner's Equity", account: "Stockholders' Equity", description: 'Opening Balance', credit: 121517.38, balance: 121517.38 },
    { id: 'log-2', date: '2024-06-24', assetGroup: 'Current Assets', account: 'Cash', description: 'Bank Interest', debit: 833.00, balance: 122350.38 },
    { id: 'log-3', date: '2024-09-10', assetGroup: 'Current Assets', account: 'Cash', description: 'Received Cash', debit: 68295.95, balance: 190646.33 },
    { id: 'log-4', date: '2024-09-10', assetGroup: 'Current Liabilities', account: 'Manoj Soni', description: 'Received Cash', credit: 68295.95, balance: 122350.38 },
    { id: 'log-5', date: '2024-09-10', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'ESP32/ESP8266/ESP-07', debit: 649.00, balance: 122999.38 },
    { id: 'log-6', date: '2024-09-10', assetGroup: 'Current Assets', account: 'Cash', description: 'ESP32/ESP8266/ESP-07', credit: 649.00, balance: 122350.38 },
    { id: 'log-7', date: '2024-09-10', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'Wifi Dongle x2', debit: 1798.00, balance: 124148.38 },
    { id: 'log-8', date: '2024-09-10', assetGroup: 'Current Assets', account: 'Cash', description: 'Wifi Dongle x2', credit: 1798.00, balance: 122350.38 },
    { id: 'log-9', date: '2024-09-10', assetGroup: 'Current Assets', account: 'Perishables', description: 'Fibreglass Tape x6', debit: 1550.00, balance: 123900.38 },
    { id: 'log-10', date: '2024-09-10', assetGroup: 'Current Assets', account: 'Cash', description: 'Fibreglass Tape x6', credit: 1550.00, balance: 122350.38 },
    { id: 'log-11', date: '2024-09-10', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'ESP32 DevkitC x2', debit: 1217.00, balance: 123567.38 },
    { id: 'log-12', date: '2024-09-10', assetGroup: 'Current Assets', account: 'Cash', description: 'ESP32 DevkitC x2', credit: 1217.00, balance: 122350.38 },
    { id: 'log-13', date: '2024-09-11', assetGroup: 'Fixed Assets', account: 'BOSM24 Equipment', description: 'Pixhawk 2.4.8 with GPS', debit: 14231.00, balance: 136581.38 },
    { id: 'log-14', date: '2024-09-11', assetGroup: 'Current Assets', account: 'Cash', description: 'Pixhawk 2.4.8 with GPS', credit: 14231.00, balance: 122350.38 },
    { id: 'log-15', date: '2024-09-11', assetGroup: 'Fixed Assets', account: 'BOSM24 Equipment', description: 'Sandisk SD Card 8GB', debit: 319.00, balance: 122669.38 },
    { id: 'log-16', date: '2024-09-11', assetGroup: 'Current Assets', account: 'Cash', description: 'Sandisk SD Card 8GB', credit: 319.00, balance: 122350.38 },
    { id: 'log-17', date: '2024-09-11', assetGroup: 'Fixed Assets', account: 'BOSM24 Equipment', description: 'WS2812 neopixel matrix 4*4', debit: 1216.00, balance: 123566.38 },
    { id: 'log-18', date: '2024-09-11', assetGroup: 'Current Assets', account: 'Cash', description: 'WS2812 neopixel matrix 4*4', credit: 1216.00, balance: 122350.38 },
    { id: 'log-19', date: '2024-09-11', assetGroup: 'Fixed Assets', account: 'BOSM24 Equipment', description: '40A ESC', debit: 1900.00, balance: 124250.38 },
    { id: 'log-20', date: '2024-09-11', assetGroup: 'Current Assets', account: 'Cash', description: '40A ESC', credit: 1900.00, balance: 122350.38 },
    { id: 'log-21', date: '2024-09-11', assetGroup: 'Current Assets', account: 'BOSM24 Equipment', description: 'Shipping for the 4 orders above', debit: 152.60, balance: 122502.98 },
    { id: 'log-22', date: '2024-09-11', assetGroup: 'Current Assets', account: 'Cash', description: 'Shipping for the 4 orders above', credit: 152.60, balance: 122350.38 },
    { id: 'log-23', date: '2024-09-11', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'Pixhawk 2.4.8 with GPS', debit: 14231.00, balance: 136581.38 },
    { id: 'log-24', date: '2024-09-11', assetGroup: 'Current Assets', account: 'Cash', description: 'Pixhawk 2.4.8 with GPS', credit: 14231.00, balance: 122350.38 },
    { id: 'log-25', date: '2024-09-11', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'Sandisk SD Card 8GB', debit: 319.00, balance: 122669.38 },
    { id: 'log-26', date: '2024-09-11', assetGroup: 'Current Assets', account: 'Cash', description: 'Sandisk SD Card 8GB', credit: 319.00, balance: 122350.38 },
    { id: 'log-27', date: '2024-09-11', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: '40A ESC', debit: 3800.00, balance: 126150.38 },
    { id: 'log-28', date: '2024-09-11', assetGroup: 'Current Assets', account: 'Cash', description: '40A ESC', credit: 3800.00, balance: 122350.38 },
    { id: 'log-29', date: '2024-09-11', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'USB-UART TTL', debit: 158.00, balance: 122508.38 },
    { id: 'log-30', date: '2024-09-11', assetGroup: 'Current Assets', account: 'Cash', description: 'USB-UART TTL', credit: 158.00, balance: 122350.38 },
    { id: 'log-31', date: '2024-09-11', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'EMAX MT2213 BLDC Motor 935kv', debit: 5715.00, balance: 128065.38 },
    { id: 'log-32', date: '2024-09-11', assetGroup: 'Current Assets', account: 'Cash', description: 'EMAX MT2213 BLDC Motor 935kv', credit: 5715.00, balance: 122350.38 },
    { id: 'log-33', date: '2024-09-11', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'F450 F550 Frame Landing Gear', debit: 1359.00, balance: 123709.38 },
    { id: 'log-34', date: '2024-09-11', assetGroup: 'Current Assets', account: 'Cash', description: 'F450 F550 Frame Landing Gear', credit: 1359.00, balance: 122350.38 },
    { id: 'log-35', date: '2024-09-11', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'HollyBro M9N GPS', debit: 9320.00, balance: 131670.38 },
    { id: 'log-36', date: '2024-09-11', assetGroup: 'Current Assets', account: 'Cash', description: 'HollyBro M9N GPS', credit: 9320.00, balance: 122350.38 },
    { id: 'log-37', date: '2024-09-11', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'EasyMech M2.5 x 8mm 12pcs Nuts and Bolts', debit: 398.00, balance: 122748.38 },
    { id: 'log-38', date: '2024-09-11', assetGroup: 'Current Assets', account: 'Cash', description: 'EasyMech M2.5 x 8mm 12pcs Nuts and Bolts', credit: 398.00, balance: 122350.38 },
    { id: 'log-39', date: '2024-09-11', assetGroup: 'Fixed Assets', account: 'Robofest24 Equipment', description: 'Shipping for the 8 orders above', debit: 267.40, balance: 122617.78 },
    { id: 'log-40', date: '2024-09-11', assetGroup: 'Current Assets', account: 'Cash', description: 'Shipping for the 8 orders above', credit: 267.40, balance: 122350.38 },
    { id: 'log-41', date: '2024-09-11', assetGroup: "Owner's Equity", account: "Stockholders' Equity", description: 'Robofest Money', credit: 50000.00, balance: 72350.38 },
    { id: 'log-42', date: '2024-09-11', assetGroup: 'Current Assets', account: 'Cash', description: 'Robofest Money', debit: 50000.00, balance: 122350.38 },
    { id: 'log-43', date: '2024-11-20', assetGroup: 'Current Assets', account: 'Cash', description: 'Bank Interest', debit: 2686.00, balance: 125036.38},
    { id: 'log-44', date: '2024-11-20', assetGroup: "Owner's Equity", account: "Stockholders' Equity", description: 'Bank Interest', credit: 2686.00, balance: 122350.38},
    { id: 'log-45', date: '2024-12-07', assetGroup: 'Current Assets', account: 'Cash', description: 'Paid to Manoj Soni', credit: 68295.95, balance: 54054.43},
    { id: 'log-46', date: '2024-12-07', assetGroup: 'Current Liabilities', account: 'Manoj Soni', description: 'Paid to Manoj Soni', debit: 68295.95, balance: 122350.38},
    { id: 'log-47', date: '2025-01-20', assetGroup: 'Current Assets', account: 'Cash', description: 'Received Cash', debit: 18000.00, balance: 72054.43},
    { id: 'log-48', date: '2025-01-20', assetGroup: "Owner's Equity", account: "Stockholders' Equity", description: 'Received Cash from DVM', credit: 18000.00, balance: 140350.38},
    { id: 'log-49', date: '2025-01-28', assetGroup: 'Current Assets', account: 'Cash', description: 'Received Cash', debit: 20000.00, balance: 92054.43},
    { id: 'log-50', date: '2025-01-28', assetGroup: 'Current Assets', account: 'BOSM Receivable', description: 'Received Cash', credit: 20000.00, balance: 72054.43},
    { id: 'log-51', date: '2025-02-12', assetGroup: 'Fixed Assets', account: 'Apogee 2025', description: 'EasyMech M4x25 Hex Socket Head', debit: 110.00, balance: 72164.43},
    { id: 'log-52', date: '2025-02-12', assetGroup: 'Current Assets', account: 'Cash', description: 'EasyMech M4x25 Hex Socket Head', credit: 110.00, balance: 72054.43},
    { id: 'log-53', date: '2025-02-12', assetGroup: 'Fixed Assets', account: 'Apogee 2025', description: 'EasyMech M4x30 Hex Socket Head', debit: 140.00, balance: 72194.43},
    { id: 'log-54', date: '2025-02-12', assetGroup: 'Current Assets', account: 'Cash', description: 'EasyMech M4x30 Hex Socket Head', credit: 140.00, balance: 72054.43},
    { id: 'log-55', date: '2025-02-12', assetGroup: 'Fixed Assets', account: 'Apogee 2025', description: 'EasyMech M4x25 CSK Allen Socket', debit: 110.00, balance: 72164.43},
    { id: 'log-56', date: '2025-02-12', assetGroup: 'Current Assets', account: 'Cash', description: 'EasyMech M4x25 CSK Allen Socket', credit: 110.00, balance: 72054.43},
    { id: 'log-57', date: '2025-02-12', assetGroup: 'Fixed Assets', account: 'Apogee 2025', description: 'EasyMech M4 T-Nut 4-Pronged', debit: 200.00, balance: 72254.43},
    { id: 'log-58', date: '2025-02-12', assetGroup: 'Current Assets', account: 'Cash', description: 'EasyMech M4 T-Nut 4-Pronged', credit: 200.00, balance: 72054.43},
    { id: 'log-59', date: '2025-02-12', assetGroup: 'Fixed Assets', account: 'Apogee 2025', description: 'EasyMech M5 T-Nut 4-Pronged', debit: 220.00, balance: 72274.43},
    { id: 'log-60', date: '2025-02-12', assetGroup: 'Current Assets', account: 'Cash', description: 'EasyMech M5 T-Nut 4-Pronged', credit: 220.00, balance: 72054.43},
    { id: 'log-61', date: '2025-02-12', assetGroup: 'Fixed Assets', account: 'Apogee 2025', description: 'EasyMech M4x40 Hex Socket Head', debit: 160.00, balance: 72214.43},
    { id: 'log-62', date: '2025-02-12', assetGroup: 'Current Assets', account: 'Cash', description: 'EasyMech M4x40 Hex Socket Head', credit: 160.00, balance: 72054.43},
    { id: 'log-63', date: '2025-02-12', assetGroup: 'Fixed Assets', account: 'Apogee 2025', description: 'EasyMech M4x35 Hex Socket Head', debit: 150.00, balance: 72204.43},
    { id: 'log-64', date: '2025-02-12', assetGroup: 'Current Assets', account: 'Cash', description: 'EasyMech M4x35 Hex Socket Head', credit: 150.00, balance: 72054.43},
    { id: 'log-65', date: '2025-02-12', assetGroup: 'Fixed Assets', account: 'Apogee 2025', description: 'EasyMech M4x15 Hex Socket Head', debit: 90.00, balance: 72144.43},
    { id: 'log-66', date: '2025-02-12', assetGroup: 'Current Assets', account: 'Cash', description: 'EasyMech M4x15 Hex Socket Head', credit: 90.00, balance: 72054.43},
    { id: 'log-67', date: '2025-02-12', assetGroup: 'Current Assets', account: 'Apogee 2025', description: 'Shipping', debit: 79.00, balance: 72133.43},
    { id: 'log-68', date: '2025-02-12', assetGroup: 'Current Assets', account: 'Cash', description: 'Shipping', credit: 79.00, balance: 72054.43},
];


const permissionsByRole = {
  admin: {
    canHoldKey: true,
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
    canHoldKey: true,
    canManageUsers: true,
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
  treasurer: {
    canHoldKey: true,
    canManageUsers: false,
    canViewAllUsers: true,
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
    await seedCollection('accounts', accounts);
    await seedCollection('logbook', logbookData);
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
