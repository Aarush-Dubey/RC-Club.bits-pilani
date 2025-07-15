
import { doc, getDoc, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notFound } from "next/navigation";
import ProjectDetailsClient from "./project-details-client";

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

async function getProjectData(projectId: string) {
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
        return null;
    }

    const projectData = projectSnap.data();
    const memberIds = Array.isArray(projectData.memberIds) && projectData.memberIds.length > 0
        ? projectData.memberIds
        : [projectData.leadId]; 

    const project = serializeFirestoreTimestamps({ id: projectSnap.id, ...projectData, memberIds });

    const usersQuery = query(collection(db, "users"), where("id", "in", memberIds));
    const usersSnap = await getDocs(usersQuery);
    const members = usersSnap.docs.map(doc => serializeFirestoreTimestamps({ id: doc.id, ...doc.data() }));

    const inventoryRequestsQuery = query(collection(db, "inventory_requests"), where("projectId", "==", projectId));
    const inventoryRequestsSnap = await getDocs(inventoryRequestsQuery);
    const inventoryRequests = inventoryRequestsSnap.docs.map(doc => serializeFirestoreTimestamps({ id: doc.id, ...doc.data() }));

    const inventoryItems = [];
    if(inventoryRequests.length > 0) {
        const itemIds = inventoryRequests.map(req => req.itemId).filter(id => id);
        if (itemIds.length > 0) {
            // Firestore 'in' queries are limited to 30 items. For more, chunking would be needed.
            const inventoryItemsQuery = query(collection(db, "inventory_items"), where("id", "in", itemIds.slice(0, 30)));
            const inventoryItemsSnap = await getDocs(inventoryItemsQuery);
            inventoryItems.push(...inventoryItemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
    }

    return { project, members, inventoryRequests, inventoryItems };
}


export default async function ProjectDetailsPage({ params }: { params: { id: string } }) {
    const data = await getProjectData(params.id);

    if (!data) {
        notFound();
    }

    return <ProjectDetailsClient initialData={data} />;
}
