
"use server"

import { db } from "@/lib/firebase";
import { collection, doc, addDoc, updateDoc, serverTimestamp, runTransaction, getDocs, writeBatch, query, orderBy, Timestamp, where } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// All monetary values are handled as integers in minor units (e.g., paise, cents)

export interface ChartOfAccount {
    id: string;
    name: string;
    group: 'Current Assets' | 'Fixed Assets' | 'Current Liabilities' | 'Equity' | 'Revenue' | 'Expenses';
    isDebitNormal: boolean;
}

export interface TransactionLine {
    acctCode: string;
    debitMinor: number;
    creditMinor: number;
}

export interface TransactionData {
    date: string; // YYYY-MM-DD
    narration: string;
    lines: TransactionLine[];
    createdById: string;
}

export async function getChartOfAccounts(): Promise<ChartOfAccount[]> {
    const snapshot = await getDocs(query(collection(db, "chart_of_accounts"), orderBy("id")));
    return snapshot.docs.map(doc => doc.data() as ChartOfAccount);
}

export async function getTransactions() {
    const transactionsQuery = query(collection(db, "transactions"), orderBy("date", "desc"));
    const transactionsSnap = await getDocs(transactionsQuery);
    
    const linesCollection = collection(db, 'transaction_lines');
    const linesSnap = await getDocs(linesCollection);
    const linesByTransactionId = linesSnap.docs.reduce((acc, doc) => {
        const line = doc.data();
        const txId = line.transactionId;
        if (!acc[txId]) {
            acc[txId] = [];
        }
        acc[txId].push(line);
        return acc;
    }, {} as Record<string, any[]>);

    const transactions = transactionsSnap.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            date: data.date?.toDate ? data.date.toDate().toISOString() : data.date,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            lines: linesByTransactionId[doc.id] || []
        }
    });

    // Sort by entryNumber in descending order after fetching
    transactions.sort((a, b) => b.entryNumber - a.entryNumber);

    return transactions;
}


export async function addTransaction(data: TransactionData) {
    if (!data.createdById) {
        throw new Error("User must be authenticated.");
    }
    if (data.lines.length < 2) {
        throw new Error("A transaction must have at least two lines (a debit and a credit).");
    }

    const totalDebits = data.lines.reduce((sum, line) => sum + line.debitMinor, 0);
    const totalCredits = data.lines.reduce((sum, line) => sum + line.creditMinor, 0);

    if (totalDebits !== totalCredits) {
        throw new Error("Debits and credits must be equal.");
    }
    if (totalDebits === 0) {
        throw new Error("Transaction amount cannot be zero.");
    }

    return await runTransaction(db, async (transaction) => {
        // Get the latest entry number to increment it
        const counterRef = doc(db, 'system_counters', 'transactions');
        const counterDoc = await transaction.get(counterRef);
        const newEntryNumber = (counterDoc.data()?.lastNumber || 0) + 1;
        
        // 1. Create the main transaction document
        const transactionRef = doc(collection(db, "transactions"));
        transaction.set(transactionRef, {
            entryNumber: newEntryNumber,
            date: Timestamp.fromDate(new Date(data.date)),
            narration: data.narration,
            createdById: data.createdById,
            createdAt: serverTimestamp(),
            isReversed: false,
        });

        // 2. Create the transaction line documents
        data.lines.forEach(line => {
            const lineRef = doc(collection(db, "transaction_lines"));
            transaction.set(lineRef, {
                transactionId: transactionRef.id,
                acctCode: line.acctCode,
                debitMinor: line.debitMinor,
                creditMinor: line.creditMinor,
            });
        });

        // 3. Log the audit event
        const auditLogRef = doc(collection(db, 'audit_log'));
        transaction.set(auditLogRef, {
            timestamp: serverTimestamp(),
            userId: data.createdById,
            actionType: 'CREATE_TRANSACTION',
            referenceId: transactionRef.id,
            newValue: JSON.stringify(data)
        });

        // 4. Update the counter
        transaction.set(counterRef, { lastNumber: newEntryNumber }, { merge: true });

        return { transactionId: transactionRef.id, entryNumber: newEntryNumber };
    });
}

export async function reverseTransaction(transactionId: string, reversedById: string, reason: string) {
    if (!reversedById) {
        throw new Error("User must be authenticated.");
    }

    return await runTransaction(db, async (t) => {
        const originalTxRef = doc(db, "transactions", transactionId);
        const originalTxSnap = await t.get(originalTxRef);

        if (!originalTxSnap.exists() || originalTxSnap.data().isReversed) {
            throw new Error("Transaction not found or already reversed.");
        }

        // Get original lines
        const linesQuery = query(collection(db, "transaction_lines"), where("transactionId", "==", transactionId));
        const linesSnap = await getDocs(linesQuery);
        const originalLines = linesSnap.docs.map(d => d.data());

        // Create the reversing transaction
        const reversingLines: TransactionLine[] = originalLines.map(line => ({
            acctCode: line.acctCode,
            debitMinor: line.creditMinor, // Swap debit and credit
            creditMinor: line.debitMinor,
        }));
        
        const reversalData: TransactionData = {
            date: new Date().toISOString().split('T')[0],
            narration: `Reversal of Entry #${originalTxSnap.data().entryNumber}. Reason: ${reason}`,
            lines: reversingLines,
            createdById: reversedById
        };

        // Use the addTransaction logic within this transaction for consistency
        const counterRef = doc(db, 'system_counters', 'transactions');
        const counterDoc = await t.get(counterRef);
        const newEntryNumber = (counterDoc.data()?.lastNumber || 0) + 1;

        const newTxRef = doc(collection(db, "transactions"));
        t.set(newTxRef, {
            entryNumber: newEntryNumber,
            date: Timestamp.now(),
            narration: reversalData.narration,
            createdById: reversalData.createdById,
            createdAt: serverTimestamp(),
            isReversed: false,
            reversesTransactionId: transactionId,
        });

        reversalData.lines.forEach(line => {
            const lineRef = doc(collection(db, "transaction_lines"));
            t.set(lineRef, { ...line, transactionId: newTxRef.id });
        });

        t.set(counterRef, { lastNumber: newEntryNumber });

        // Mark original transaction as reversed
        t.update(originalTxRef, {
            isReversed: true,
            reversedAt: serverTimestamp(),
            reversedById: reversedById,
        });

        // Audit log for the reversal
        const auditLogRef = doc(collection(db, 'audit_log'));
        t.set(auditLogRef, {
            timestamp: serverTimestamp(),
            userId: reversedById,
            actionType: 'REVERSE_TRANSACTION',
            referenceId: transactionId,
            newValue: `Reversed with new transaction ${newTxRef.id}`
        });

        return { reversalTransactionId: newTxRef.id };
    });
}
