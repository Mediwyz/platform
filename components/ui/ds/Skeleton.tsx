import { cn } from '@/lib/cn'

/** Skeleton  shimmer placeholder for async content (reserves layout space). */
export default function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-subtle dark:bg-line', className)}
      {...props}
    />
  )
}
