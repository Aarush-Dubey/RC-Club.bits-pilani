import { CheckCircle, HandCoins, ShoppingCart, Users, ToyBrick } from "lucide-react"
import { collection, getDocs, doc, getDoc, query, where, limit } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProjectOverviewChart } from "./project-overview-chart"

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
  
  const recentProjectsQuery = query(collection(db, "projects"), limit(5));
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


export default async function DashboardPage() {
  const { 
    projects, 
    roomStatus,
    projectStatusData,
    onLoanCount,
    overdueCount,
    pendingReimbursements,
    recentProjects
  } = await getDashboardData();

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
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
        <Card>
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
        <Card>
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
        <Card>
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
      <div className="grid gap-4 lg:grid-cols-7">
        <ProjectOverviewChart data={projectStatusData} />
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Recent Projects</CardTitle>
            <CardDescription>
              A look at the latest projects started in the club.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentProjects.map((project: any) => (
                        <TableRow key={project.id}>
                            <TableCell>
                                <div className="font-medium">{project.title}</div>
                                <div className="text-sm text-muted-foreground hidden sm:block">{project.description.substring(0,40)}...</div>
                            </TableCell>
                            <TableCell><Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>{project.status.replace('_', ' ')}</Badge></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
