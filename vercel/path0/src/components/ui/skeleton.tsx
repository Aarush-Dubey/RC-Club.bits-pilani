/**
 * This file defines a Skeleton component used for displaying loading states.
 * It renders a simple `div` with a pulsing animation and consistent styling,
 * which can be used as a placeholder for content that is loading asynchronously,
 * improving the user experience by providing visual feedback.
 */
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/50", className)}
      {...props}
    />
  )
}

export { Skeleton }

