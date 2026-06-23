'use client'

export interface WeeklyBarChartData {
 label: string
 value: number
 target?: number
}

export interface WeeklyBarChartProps {
 data: WeeklyBarChartData[]
 unit?: string
 color?: string
 maxHeight?: number
}

export default function WeeklyBarChart({
 data,
 unit = '',
 color = 'bg-blue-500',
 maxHeight = 200,
}: WeeklyBarChartProps) {
 const maxValue = Math.max(...data.map((d) => d.value), 1)
 const globalTarget = data.find((d) => d.target !== undefined)?.target

 const targetPercent =
 globalTarget !== undefined ? Math.min((globalTarget / maxValue) * 100, 100) : null

 return (
 <div className="bg-surface rounded-lg shadow-sm p-4">
 <div className="relative" style={{ height: maxHeight }}>
 {/* Target line */}
 {targetPercent !== null && (
 <div
 className="absolute left-0 right-0 border-t-2 border-dashed border-line z-10"
 style={{ bottom: `${targetPercent}%` }}
 >
 <span className="absolute -top-4 right-0 text-xs text-faint">
 Target: {globalTarget}{unit ? ` ${unit}` : ''}
 </span>
 </div>
 )}

 {/* Bars */}
 <div className="flex items-end justify-between h-full gap-1">
 {data.map((item, i) => {
 const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0
 return (
 <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
 {/* Value label */}
 <span className="text-xs text-soft mb-1 font-medium">
 {item.value > 0 ? item.value : ''}
 </span>
 {/* Bar */}
 <div
 className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 ease-out ${color}`}
 style={{
 height: `${Math.max(heightPercent, item.value > 0 ? 4 : 0)}%`,
 minHeight: item.value > 0 ? '4px' : '0',
 }}
 />
 </div>
 )
 })}
 </div>
 </div>

 {/* Labels */}
 <div className="flex justify-between mt-2">
 {data.map((item, i) => (
 <div key={i} className="flex-1 text-center">
 <span className="text-xs text-faint">{item.label}</span>
 </div>
 ))}
 </div>
 </div>
 )
}
