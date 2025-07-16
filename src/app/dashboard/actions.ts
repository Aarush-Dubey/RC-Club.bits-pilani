'use server'

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Project, User } from './projects/project-card'


// Helper to convert Firestore Timestamps to JSON-serializable strings
const serializeData = (doc: any): any => {
    const data = doc.data();
    if (!data) return null;

    // Convert all Timestamp fields to ISO strings
    for (const key in data) {
        if (data[key]?.toDate) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return { id: doc.id, ...data };
};


export async function getPendingProjectApprovals() {
  const approvalRequestsQuery = query(
    collection(db, "projects"),
    where("status", "==", "pending_approval")
  );
  const approvalRequestsSnapshot = await getDocs(approvalRequestsQuery);
  const approvalRequests = approvalRequestsSnapshot.docs.map(serializeData) as Project[];

  if (approvalRequests.length === 0) {
    return { approvalRequests: [], users: {} };
  }

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

  return { approvalRequests, users };
}
