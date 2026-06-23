'use client'

import { IconType } from 'react-icons'

export interface QuickActionButtonProps {
 icon: IconType
 label: string
 onClick: () => void
 color?: string
}

export default function QuickActionButton({
 icon: Icon,
 label,
 onClick,
 color = 'bg-blue-100 text-blue-600',
}: QuickActionButtonProps) {
 return (
 <button
 onClick={onClick}
 className="flex flex-col items-center gap-1.5 group focus:outline-none"
 >
 <div
 className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-blue-400 ${color}`}
 >
 <Icon className="text-lg" />
 </div>
 <span className="text-xs font-medium text-soft group-hover:text-fg transition-colors">
 {label}
 </span>
 </button>
 )
}
