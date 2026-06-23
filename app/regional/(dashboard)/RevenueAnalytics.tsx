'use client'

import { useState, useEffect } from 'react'
import { FaDollarSign, FaWallet } from 'react-icons/fa'
import { Line, Doughnut } from 'react-chartjs-2'
import {
 Chart as ChartJS,
 CategoryScale,
 LinearScale,
 PointElement,
 LineElement,
 ArcElement,
 Title,
 Tooltip,
 Legend,
 Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
 CategoryScale, LinearScale, PointElement, LineElement,
 ArcElement, Title, Tooltip, Legend, Filler
)

interface RevenueStream {
 source: string;
 amount: number;
 percentage: number;
 trend: number;
}

interface CurrencyOption {
 code: string;
 symbol: string;
 rate: number;
}

// Fallback currencies when regions API is unavailable
const FALLBACK_CURRENCIES: CurrencyOption[] = [
 { code: 'USD', symbol: '$', rate: 1 },
 { code: 'EUR', symbol: '\u20AC', rate: 0.92 },
 { code: 'MUR', symbol: 'Rs', rate: 45.5 },
 { code: 'KES', symbol: 'KSh', rate: 153.5 },
 { code: 'ZAR', symbol: 'R', rate: 18.9 }
];

// Known exchange rates relative to USD (revenue is stored in USD)
const EXCHANGE_RATES: Record<string, number> = {
 USD: 1, EUR: 0.92, MUR: 45.5, KES: 153.5, ZAR: 18.9,
 MGA: 4550, GBP: 0.79, XOF: 603, RWF: 1300, BIF: 2850,
};

// Chart options
const chartOptions = {
 responsive: true,
 maintainAspectRatio: false,
 plugins: {
 legend: {
 position: 'top' as const,
 },
 },
};

export default function RevenueAnalytics({ timeRange, region }: { timeRange: string; region: string }) {
 const [revenueStreams, setRevenueStreams] = useState<RevenueStream[]>([]);
 const [totalRevenue, setTotalRevenue] = useState(0);
 const [revenueGrowth, setRevenueGrowth] = useState(0);
 const [selectedCurrency, setSelectedCurrency] = useState('MUR');
 const [currencies, setCurrencies] = useState<CurrencyOption[]>(FALLBACK_CURRENCIES);

 // Fetch regions to build dynamic currency list
 useEffect(() => {
  const fetchCurrencies = async () => {
   try {
    const res = await fetch('/api/regions')
    if (!res.ok) return
    const json = await res.json()
    if (!json.success || !Array.isArray(json.data)) return

    const seen = new Set<string>()
    const regionCurrencies: CurrencyOption[] = []

    // Always include USD as base
    seen.add('USD')
    regionCurrencies.push({ code: 'USD', symbol: '$', rate: 1 })

    for (const r of json.data) {
     const code = r.currency as string
     if (!code || seen.has(code)) continue
     seen.add(code)
     regionCurrencies.push({
      code,
      symbol: r.currencySymbol || code,
      rate: EXCHANGE_RATES[code] ?? 1,
     })
    }

    if (regionCurrencies.length > 1) {
     setCurrencies(regionCurrencies)
    }
   } catch {
    // Keep fallback currencies
   }
  }
  fetchCurrencies()
 }, [])

 const currentCurrency = currencies.find(c => c.code === selectedCurrency) || currencies[0];

 useEffect(() => {
 const fetchRevenue = async () => {
 try {
 const res = await fetch('/api/admin/metrics', { credentials: 'include' })
 if (!res.ok) return
 const json = await res.json()
 if (!json.success) return
 const revenue = json.data.revenue

 setTotalRevenue(revenue.total)

 // Calculate month-over-month growth
 const thisMonth = revenue.thisMonth ?? revenue.total
 const lastMonth = revenue.lastMonth ?? 0
 if (lastMonth > 0) {
 setRevenueGrowth(Math.round(((thisMonth - lastMonth) / lastMonth) * 100 * 10) / 10)
 } else if (thisMonth > 0) {
 setRevenueGrowth(100)
 }

 // Build streams from byServiceType
 const total = revenue.total || 1
 const streams: RevenueStream[] = (revenue.byServiceType || []).map(
 (s: { serviceType: string; total: number }) => ({
 source: s.serviceType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
 amount: s.total,
 percentage: Math.round((s.total / total) * 100),
 trend: 0,
 })
 )
 setRevenueStreams(streams.length > 0 ? streams : [{ source: 'No data', amount: 0, percentage: 0, trend: 0 }])
 } catch {
 // Keep empty state
 }
 }
 fetchRevenue()
 }, [timeRange, region]);

 const streamDistribution = {
 labels: revenueStreams.map(s => s.source),
 datasets: [{
 data: revenueStreams.map(s => s.percentage),
 backgroundColor: ['#3B82F6', '#22C55E', '#A855F7', '#F97316']
 }]
 };
 
 const iconColors = {
 bg: ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100'],
 text: ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600']
 };

 return (
 <div className="mb-8">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-2xl font-bold">Revenue Analytics</h2>
 <select 
 value={selectedCurrency}
 onChange={(e) => setSelectedCurrency(e.target.value)}
 className="px-4 py-2 border rounded-lg"
 >
 {currencies.map(curr => (
 <option key={curr.code} value={curr.code}>{curr.symbol} {curr.code}</option>
 ))}
 </select>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Total Revenue Card */}
 <div className="bg-brand-navy rounded-xl p-6 text-white">
 <div className="flex items-center justify-between mb-4">
 <FaWallet className="text-3xl opacity-80" />
 <span className="text-sm bg-white/20 px-2 py-1 rounded">{revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}%</span>
 </div>
 <p className="text-blue-100 text-sm mb-1">Total Revenue ({timeRange})</p>
 <p className="text-4xl font-bold mb-2">
 {currentCurrency.symbol}
 {(totalRevenue * currentCurrency.rate).toLocaleString('en-US', { maximumFractionDigits: 0 })}
 </p>
 <p className="text-blue-100 text-sm">Region: {region}</p>
 </div>

 {/* Revenue Streams */}
 <div className="bg-surface rounded-xl p-6 shadow-lg lg:col-span-2">
 <h3 className="text-lg font-semibold mb-4">Revenue Streams Breakdown</h3>
 <div className="space-y-3">
 {revenueStreams.map((stream, idx) => (
 <div key={idx} className="flex items-center justify-between p-3 bg-subtle rounded-lg">
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColors.bg[idx]}`}>
 <FaDollarSign className={iconColors.text[idx]} />
 </div>
 <div>
 <p className="font-medium text-fg">{stream.source}</p>
 <p className="text-sm text-soft">{stream.percentage}% of total</p>
 </div>
 </div>
 <div className="text-right">
 <p className="font-semibold text-fg">
 {currentCurrency.symbol}
 {(stream.amount * currentCurrency.rate).toLocaleString('en-US', { maximumFractionDigits: 0 })}
 </p>
 <p className={`text-sm ${stream.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
 {stream.trend > 0 ? '' : ''} {stream.trend}%
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Revenue Trend & Distribution Charts */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
 <div className="bg-surface rounded-xl p-6 shadow-lg">
 <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
 {/* ---- FIX: Added relative positioning and defined height ---- */}
 <div className="relative h-64">
 <Line data={{
 labels: revenueStreams.map(s => s.source),
 datasets: [{
 label: 'Revenue by Service',
 data: revenueStreams.map(s => s.amount),
 fill: true,
 backgroundColor: 'rgba(59, 130, 246, 0.1)',
 borderColor: 'rgb(59, 130, 246)',
 tension: 0.4,
 }],
 }} options={chartOptions} />
 </div>
 </div>
 
 <div className="bg-surface rounded-xl p-6 shadow-lg">
 <h3 className="text-lg font-semibold mb-4">Revenue Distribution</h3>
 {/* ---- FIX: Added relative positioning and defined height ---- */}
 <div className="relative h-64">
 <Doughnut data={streamDistribution} options={chartOptions} />
 </div>
 </div>
 </div>
 </div>
 )
}