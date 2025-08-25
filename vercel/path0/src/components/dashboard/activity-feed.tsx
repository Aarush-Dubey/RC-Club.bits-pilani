/**
 * This file defines the ActivityFeed component, which displays a chronological
 * list of recent activities within the club. It dynamically renders different
 * feed item types (e.g., new project, inventory request) with appropriate icons,
 * user names, and timestamps, providing a high-level overview of club happenings.
 */
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  HandCoins,
  History,
  Package,
  ToyBrick,
  Truck,
  User as UserIcon
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type ActivityFeedProps = {
  feed: any[]
  users: Record<string, any>
  inventoryItems: Record<string, any>
}

const ICONS: Record<string, React.ReactNode> = {
  project: <ToyBrick className="h-5 w-5" />,
  inventory: <Package className="h-5 w-5" />,
  procurement: <Truck className="h-5 w-5" />,
  reimbursement: <HandCoins className="h-5 w-5" />,
  default: <History className="h-5 w-5" />,
}

function FeedItem({ item, users, inventoryItems }: { item: any, users: Record<string, any>, inventoryItems: Record<string, any> }) {
  const user = users[item.leadId || item.requestedById || item.postedById || item.createdBy]
  const userName = user?.name || 'A user'

  let text = ''
  let link = ''

  switch (item.type) {
    case 'project':
      text = ` proposed a new project: ${item.title}`
      link = `/dashboard/projects/${item.id}`
      break
    case 'inventory':
      const inventoryItem = inventoryItems[item.itemId]
      const itemName = inventoryItem?.name || 'an item'
      text = ` requested ${itemName} (x${item.quantity})`
      link = '/dashboard/inventory'
      break
    case 'procurement':
      text = ` requested a new item: ${item.itemName}`
      link = '/dashboard/procurement'
      break
    default:
      text = ' performed an unknown action'
      break
  }

  // Ensure createdAt is a Date object before formatting
  const createdAtDate = item.createdAt ? new Date(item.createdAt) : new Date();

  return (
    <div className="flex items-start gap-4">
       <UserIcon className="h-9 w-9 text-muted-foreground p-1.5 bg-muted rounded-full" />
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-semibold">{userName}</span>
          {text}
        </p>
        <Link href={link} className="text-xs text-muted-foreground hover:underline">
          {formatDistanceToNow(createdAtDate, { addSuffix: true })}
        </Link>
      </div>
    </div>
  )
}


export function ActivityFeed({ feed, users, inventoryItems }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Club Activity</CardTitle>
        <CardDescription>
          A log of the latest happenings in the club.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {feed.length > 0 ? (
          <div className="space-y-6">
            {feed.map((item, index) => (
              <FeedItem key={`${item.id}-${index}`} item={item} users={users} inventoryItems={inventoryItems} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            No recent activity.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

