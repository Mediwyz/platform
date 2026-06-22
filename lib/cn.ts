import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn — merge conditional class names and de-dupe conflicting Tailwind utilities.
 * Use everywhere we compose class strings so later utilities win predictably.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
