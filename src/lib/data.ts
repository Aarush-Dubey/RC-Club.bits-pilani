export const users = [
  { id: 'user-1', name: 'Alex Doe', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
  { id: 'user-2', name: 'Jane Smith', role: 'treasurer', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
  { id: 'user-3', name: 'Sam Wilson', role: 'inventory_manager', avatar: 'https://i.pravatar.cc/150?u=a04258114e29026702d' },
  { id: 'user-4', name: 'Peter Jones', role: 'project_lead', avatar: 'https://i.pravatar.cc/150?u=a048581f4e29026701d' },
  { id: 'user-5', name: 'Mary Jane', role: 'member', avatar: 'https://i.pravatar.cc/150?u=a092581f4e29026705d' },
];

export const projects = [
  {
    id: 'proj-1',
    name: 'Project Phoenix - FPV Drone',
    leadId: 'user-4',
    members: ['user-4', 'user-5'],
    status: 'In Progress',
    budget: 500,
    spent: 250,
    description: 'Building a high-speed FPV racing drone from scratch.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'drone racing',
  },
  {
    id: 'proj-2',
    name: 'The Crawler King - RC Rock Crawler',
    leadId: 'user-2',
    members: ['user-2', 'user-3'],
    status: 'Completed',
    budget: 300,
    spent: 290,
    description: 'A custom-built RC rock crawler for extreme terrain.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'RC car',
  },
  {
    id: 'proj-3',
    name: 'Sea Serpent - RC Boat',
    leadId: 'user-1',
    members: ['user-1', 'user-5'],
    status: 'Planning',
    budget: 400,
    spent: 50,
    description: 'Designing a fast and agile RC boat for lake races.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'RC boat',
  },
  {
    id: 'proj-4',
    name: 'Glider-X - Autonomous Glider',
    leadId: 'user-4',
    members: ['user-4', 'user-2'],
    status: 'On Hold',
    budget: 600,
    spent: 100,
    description: 'Developing a long-endurance autonomous glider with GPS.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'glider plane',
  },
];

export const inventory = [
    { id: 'inv-1', name: 'Taranis Q X7 Transmitter', category: 'Electronics', status: 'Available', quantity: 2 },
    { id: 'inv-2', name: 'Lipo Battery 4S 1500mAh', category: 'Power', status: 'On Loan', quantity: 10, borrowedBy: 'user-4', dueDate: '2024-08-15' },
    { id: 'inv-3', name: 'iMAX B6 Charger', category: 'Tools', status: 'Available', quantity: 3 },
    { id: 'inv-4', name: 'FPV Goggles Eachine EV800D', category: 'Electronics', status: 'Available', quantity: 1 },
    { id: 'inv-5', name: 'Soldering Iron Kit', category: 'Tools', status: 'On Loan', quantity: 5, borrowedBy: 'user-5', dueDate: '2024-08-10' },
    { id: 'inv-6', name: 'Carbon Fiber Frame Kit', category: 'Parts', status: 'Overdue', quantity: 1, borrowedBy: 'user-2', dueDate: '2024-07-20' },
];

export const inventoryRequests = [
    { id: 'req-1', itemId: 'inv-1', userId: 'user-5', date: '2024-07-28', status: 'Pending' },
    { id: 'req-2', itemId: 'inv-4', userId: 'user-4', date: '2024-07-27', status: 'Approved' },
    { id: 'req-3', itemId: 'inv-3', userId: 'user-2', date: '2024-07-25', status: 'Rejected' },
];

export const reimbursements = [
  { id: 'reimb-1', userId: 'user-4', project: 'Project Phoenix - FPV Drone', amount: 45.50, date: '2024-07-25', status: 'Approved', approver: 'user-2' },
  { id: 'reimb-2', userId: 'user-5', project: 'Project Phoenix - FPV Drone', amount: 120.00, date: '2024-07-26', status: 'Pending', approver: null },
  { id: 'reimb-3', userId: 'user-2', project: 'The Crawler King - RC Rock Crawler', amount: 75.25, date: '2024-07-22', status: 'Paid', approver: 'user-2' },
  { id: 'reimb-4', userId: 'user-1', project: 'Sea Serpent - RC Boat', amount: 30.00, date: '2024-07-28', status: 'Rejected', approver: 'user-2' },
];

export const procurementRequests = [
    { id: 'proc-1', userId: 'user-4', item: '3D Printer Filament (PLA, 1kg)', quantity: 2, reason: 'For printing custom drone parts for Project Phoenix.', date: '2024-07-20', status: 'Approved' },
    { id: 'proc-2', userId: 'user-1', item: 'Waterproof Servo Motor', quantity: 4, reason: 'Needed for the Sea Serpent RC boat project.', date: '2024-07-25', status: 'Pending' },
    { id: 'proc-3', userId: 'user-3', item: 'New set of hex drivers', quantity: 1, reason: 'Current set is worn out.', date: '2024-07-28', status: 'Ordered' },
];

export const roomStatus = {
    occupied: true,
    user: 'Alex Doe',
    since: '10:30 AM',
};

export const keyStatus = {
    holder: 'Jane Smith',
    lastTransfer: '2024-07-28 09:00 AM',
};

export const projectStatusData = [
    { name: 'In Progress', value: 1, fill: 'var(--color-chart-1)' },
    { name: 'Completed', value: 1, fill: 'var(--color-chart-2)' },
    { name: 'Planning', value: 1, fill: 'var(--color-chart-3)' },
    { name: 'On Hold', value: 1, fill: 'var(--color-chart-4)' },
];

export const sampleLogs = {
    procurement: `Date,Item,Project,User,Amount
2024-01-15,FPV Camera,Project Phoenix,user-4,55.00
2024-02-20,Rock Crawler Tires,The Crawler King,user-2,45.00
2024-03-10,Boat Hull,Sea Serpent,user-1,120.00
2024-04-05,GPS Module,Glider-X,user-4,80.00`,
    expenses: `Date,Category,Description,Amount
2024-01-20,Tools,New Soldering Station,150.00
2024-02-25,Supplies,Zip ties and heat shrink,25.00
2024-05-15,Event,Pizza for build night,75.00`,
    reimbursement: `Date,User,Project,Amount
2024-01-18,user-4,Project Phoenix,22.50
2024-02-22,user-2,The Crawler King,30.00
2024-03-15,user-1,Sea Serpent,15.75`
};
