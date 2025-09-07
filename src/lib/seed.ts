
import { db } from './firebase';
import { collection, doc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

const chartOfAccounts = [
    // Assets
    { id: '1010', name: 'Cash and Bank', group: 'Current Assets', isDebitNormal: true },
    { id: '1020', name: 'Accounts Receivable', group: 'Current Assets', isDebitNormal: true },
    { id: '1030', name: 'Inventory - Perishables', group: 'Current Assets', isDebitNormal: true },
    { id: '1210', name: 'General Equipment', group: 'Fixed Assets', isDebitNormal: true },

    // Liabilities
    { id: '2010', name: 'Accounts Payable', group: 'Current Liabilities', isDebitNormal: false },
    { id: '2020', name: 'Member Reimbursements Payable', group: 'Current Liabilities', isDebitNormal: false },

    // Equity
    { id: '3010', name: 'Club Capital', group: 'Equity', isDebitNormal: false },
    { id: '3020', name: 'Retained Earnings', group: 'Equity', isDebitNormal: false },

    // Revenue
    { id: '4010', name: 'Sponsorship Income', group: 'Revenue', isDebitNormal: false },
    { id: '4020', name: 'Event Income', group: 'Revenue', isDebitNormal: false },

    // Expenses
    { id: '5010', name: 'Equipment Purchase (Deprecated)', group: 'Expenses', isDebitNormal: true }, // Kept for historical data
    { id: '5020', name: 'Event Expenses', group: 'Expenses', isDebitNormal: true },
    { id: '5030', name: 'Consumables & Parts', group: 'Expenses', isDebitNormal: true },
    { id: '5040', name: 'Bank Fees', group: 'Expenses', isDebitNormal: true },
    { id: '5050', name: 'Loss on Asset Retirement', group: 'Expenses', isDebitNormal: true },
];

const seedCollection = async (collectionName: string, data: any[]) => {
  if (data.length === 0) {
    console.log(`Skipping seeding for ${collectionName} as no data is provided.`);
    return;
  }
  console.log(`Seeding ${collectionName}...`);
  const batch = writeBatch(db);
  data.forEach((item) => {
    const docRef = doc(db, collectionName, item.id);
    batch.set(docRef, item);
  });
  await batch.commit();
  console.log(`${collectionName} seeded successfully.`);
};

const seedDatabase = async () => {
  try {
    console.log('Seeding Chart of Accounts...');
    await seedCollection('chart_of_accounts', chartOfAccounts);
    
    // Clear old finance-related collections if they exist to avoid conflicts.
    // In a real migration, you'd transform this data. For a fresh start, we can clear.
    // For now, we assume this is a fresh setup based on the new schema.
    
    console.log('\n✅ Database seeded with new finance schema!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

seedDatabase().then(() => {
    if (typeof process !== 'undefined') {
        process.exit(0);
    }
});
