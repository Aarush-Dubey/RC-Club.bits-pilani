
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from 'next/link'
import { ArrowLeft, Check, X } from 'lucide-react'

import { type Project, type User } from "../project-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApprovalActions } from "./approval-actions"

async function getApprovalData() {
    const approvalRequestsQuery = query(
        collection(db, "projects"), 
        where("status", "==", "pending_approval"),
        orderBy("createdAt", "desc")
    );
    const approvalRequestsSnapshot = await getDocs(approvalRequestsQuery);
    const approvalRequests = approvalRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];

    const userIds = [...new Set(approvalRequests.flatMap(p => [p.leadId, ...p.memberIds]))];
    let users: User[] = [];
    if (userIds.length > 0) {
        // Firestore 'in' query is limited to 30 elements.
        const userChunks = [];
        for (let i = 0; i < userIds.length; i += 30) {
            userChunks.push(userIds.slice(i, i + 30));
        }

        for (const chunk of userChunks) {
            if (chunk.length > 0) {
                const usersSnapshot = await getDocs(query(collection(db, "users"), where("id", "in", chunk)));
                users.push(...usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[]);
            }
        }
    }
    
    return { approvalRequests, users };
}

export default async function ApprovalsPage() {
    // In a real app, you'd protect this route using middleware or similar
    // For now, we assume the user has canApproveProjects permission
    
    const { approvalRequests, users } = await getApprovalData();

    return (
        <div className="space-y-8">
             <div className="flex items-center gap-4">
                <Link href="/dashboard/projects">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Project Approvals</h2>
                    <p className="text-muted-foreground">
                        Review and approve new project proposals.
                    </p>
                </div>
            </div>

            {approvalRequests.length > 0 ? (
                <div className="space-y-4">
                    {approvalRequests.map((project) => (
                       <Card key={project.id}>
                            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <p className="font-semibold font-headline text-lg">{project.title}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                                </div>
                                <ApprovalActions projectId={project.id} />
                            </CardContent>
                       </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">All Clear!</h3>
                    <p>There are no projects waiting for approval.</p>
                </div>
            )}
        </div>
    )
}
