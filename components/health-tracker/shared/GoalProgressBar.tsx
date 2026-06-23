'use client'

export interface GoalProgressBarProps {
 label: string
 current: number
 target: number
 unit?: string
 color?: string
}

export default function GoalProgressBar({
 label,
 current,
 target,
 unit = '',
 color = 'bg-blue-500',
}: GoalProgressBarProps) {
 const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0

 return (
 <div className="w-full">
 <div className="flex items-center justify-between mb-1">
 <span className="text-sm font-medium text-soft">{label}</span>
 <span className="text-sm text-soft">
 {current}/{target}{unit ? ` ${unit}` : ''}
 </span>
 </div>
 <div className="w-full h-2.5 bg-subtle rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
 style={{ width: `${percent}%` }}
 />
 </div>
 </div>
 )
}
