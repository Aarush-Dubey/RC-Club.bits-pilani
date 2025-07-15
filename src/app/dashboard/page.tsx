
import { CheckCircle, HandCoins, ShoppingCart, Users, ToyBrick, ArrowRight } from "lucide-react"
import { collection, getDocs, doc, getDoc, query, where, limit, orderBy } from "firebase/firestore"
import Link from "next/link"

import { db } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

async function getDashboardData() {
  const projectsSnapshot = await getDocs(collection(db, "projects"));
  const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const inventorySnapshot = await getDocs(collection(db, "inventory_items"));
  const inventory = inventorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const roomStatusDoc = await getDoc(doc(db, "system", "room_status"));
  const roomStatusData = roomStatusDoc.exists() ? roomStatusDoc.data() : { isOpen: false, openedById: null, openedAt: null };
  
  let roomOccupancyUser = 'N/A';
  if (roomStatusData.isOpen && roomStatusData.openedById) {
      const userDoc = await getDoc(doc(db, "users", roomStatusData.openedById));
      if (userDoc.exists()) {
          roomOccupancyUser = userDoc.data().name;
      }
  }
  
  const roomStatus = {
      occupied: roomStatusData.isOpen,
      user: roomOccupancyUser,
      since: roomStatusData.openedAt ? roomStatusData.openedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
  };

  const projectStatusCounts = projects.reduce((acc, project) => {
    const status = project.status.replace('_', ' ');
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const projectStatusData = Object.entries(projectStatusCounts).map(([name, value]) => ({ name, value }));

  const onLoanCount = inventory.reduce((sum, item) => sum + (item.checkedOutQuantity || 0), 0);
  
  const overdueRequestsSnapshot = await getDocs(query(collection(db, "inventory_requests"), where("isOverdue", "==", true)));
  const overdueCount = overdueRequestsSnapshot.size;

  const pendingReimbursementsSnapshot = await getDocs(query(collection(db, "reimbursements"), where("status", "==", "pending")));
  const pendingReimbursements = pendingReimbursementsSnapshot.size;
  
  const recentProjectsQuery = query(collection(db, "projects"), orderBy("createdAt", "desc"), limit(5));
  const recentProjectsSnapshot = await getDocs(recentProjectsQuery);
  const recentProjects = recentProjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));


  return { 
    projects, 
    inventory, 
    roomStatus, 
    projectStatusData,
    onLoanCount,
    overdueCount,
    pendingReimbursements,
    recentProjects
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending_approval':
      return <Badge variant="secondary">Pending Approval</Badge>
    case 'approved':
      return <Badge className="bg-yellow-500 text-white">Approved</Badge>
    case 'active':
      return <Badge className="bg-blue-500 text-white">Active</Badge>
    case 'completed':
      return <Badge className="bg-green-500 text-white">Completed</Badge>
    case 'closed':
      return <Badge variant="outline">Closed</Badge>
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>
    default:
      return <Badge variant="outline">{status ? status.replace(/_/g, ' ') : 'Unknown'}</Badge>
  }
}


export default async function DashboardPage() {
  const { 
    projects, 
    roomStatus,
    onLoanCount,
    overdueCount,
    pendingReimbursements,
    recentProjects
  } = await getDashboardData();

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <ToyBrick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.filter(p => p.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              {projects.length} total projects
            </p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Items on Loan
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onLoanCount}</div>
            <p className="text-xs text-muted-foreground">
              {overdueCount} items overdue
            </p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReimbursements}</div>
            <p className="text-xs text-muted-foreground">
              Reimbursements waiting
            </p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Room Status</CardTitle>
            {roomStatus.occupied ? <Users className="h-4 w-4 text-muted-foreground" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{roomStatus.occupied ? `Occupied by ${roomStatus.user}` : 'Available'}</div>
            <p className="text-xs text-muted-foreground">
              {roomStatus.occupied ? `Since ${roomStatus.since}` : 'Ready for use'}
            </p>
          </CardContent>
        </Card>
      </div>
      <div>
          <h3 className="text-2xl font-headline font-bold mb-4">Recent Projects</h3>
          <div className="grid gap-6 md:grid-cols-2">
              {recentProjects.map((project: any) => (
                  <Card key={project.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <CardTitle className="font-headline text-lg group-hover:text-primary transition-colors">{project.title}</CardTitle>
                             {getStatusBadge(project.status)}
                        </div>
                        <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow"></CardContent>
                    <CardFooter>
                         <Link href={`/dashboard/projects/${project.id}`} className="w-full">
                            <Button variant="outline" className="w-full">
                                View Project
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
              ))}
          </div>
      </div>
    </div>
  )
}
