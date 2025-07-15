
import { doc, getDoc, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notFound } from "next/navigation";
import BucketDetailsClient from "./bucket-details-client";
import { AppUser } from "@/context/auth-context";

// Helper to convert Firestore Timestamps to strings
const serializeFirestoreTimestamps = (data: any): any => {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(serializeFirestoreTimestamps);
    }
    if (typeof data === 'object' && data !== null) {
        if (data instanceof Timestamp) {
            return data.toDate().toISOString();
        }
        const newObj: { [key: string]: any } = {};
        for (const key in data) {
            newObj[key] = serializeFirestoreTimestamps(data[key]);
        }
        return newObj;
    }
    return data;
};


async function getBucketData(bucketId: string) {
    const bucketRef = doc(db, "procurement_buckets", bucketId);
    const bucketSnap = await getDoc(bucketRef);

    if (!bucketSnap.exists()) {
        return null;
    }
    const bucketData = bucketSnap.data();
    
    // Ensure members is an array before trying to use it
    const memberIds = Array.isArray(bucketData.members) && bucketData.members.length > 0 ? bucketData.members : [];

    const bucket = serializeFirestoreTimestamps({ id: bucketSnap.id, ...bucketData, members: memberIds });

    const requestsQuery = query(collection(db, "new_item_requests"), where("linkedBucketId", "==", bucketId));
    const requestsSnap = await getDocs(requestsQuery);
    const requests = requestsSnap.docs.map(doc => serializeFirestoreTimestamps({ id: doc.id, ...doc.data() }));

    let members: AppUser[] = [];
    if (memberIds.length > 0) {
        const usersQuery = query(collection(db, "users"), where("id", "in", memberIds));
        const usersSnap = await getDocs(usersQuery);
        members = usersSnap.docs.map(doc => serializeFirestoreTimestamps({ id: doc.id, ...doc.data() })) as AppUser[];
    }

    return { bucket, requests, members };
}

export default async function BucketDetailsPage({ params }: { params: { id: string } }) {
    const data = await getBucketData(params.id);

    if (!data) {
        notFound();
    }

    return <BucketDetailsClient initialData={data} bucketId={params.id} />;
}
