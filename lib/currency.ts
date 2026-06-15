/**
 * Multi-currency support for MediWyz.
 * Maps country currency codes to symbols and provides formatting utilities.
 */

export interface CurrencyInfo {
  code: string
  symbol: string
  decimals: number
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  MUR: { code: 'MUR', symbol: 'Rs', decimals: 0 },
  MGA: { code: 'MGA', symbol: 'Ar', decimals: 0 },
  KES: { code: 'KES', symbol: 'KSh', decimals: 0 },
  XOF: { code: 'XOF', symbol: 'CFA', decimals: 0 },
  RWF: { code: 'RWF', symbol: 'FRw', decimals: 0 },
  USD: { code: 'USD', symbol: '$', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', decimals: 2 },
}

/**
 * Rough exchange rates from MUR for seeding purposes.
 * NOT for live conversions - just approximate equivalents.
 */
const SEED_RATES_FROM_MUR: Record<string, number> = {
  MUR: 1,
  MGA: 40,       // 1 MUR ≈ 40 MGA
  KES: 1.29,     // 1 MUR ≈ 1.29 KES
  XOF: 5.56,     // 1 MUR ≈ 5.56 XOF
  RWF: 12.22,    // 1 MUR ≈ 12.22 RWF
  USD: 0.022,    // 1 MUR ≈ 0.022 USD
  EUR: 0.020,    // 1 MUR ≈ 0.020 EUR
}

/**
 * Format an amount with the correct currency symbol.
 */
export function formatCurrency(amount: number, currencyCode: string = 'MUR'): string {
  const info = CURRENCIES[currencyCode]
  if (!info) return `${amount.toLocaleString()}`

  const formatted = info.decimals > 0
    ? amount.toLocaleString(undefined, { minimumFractionDigits: info.decimals, maximumFractionDigits: info.decimals })
    : Math.round(amount).toLocaleString()

  return `${info.symbol} ${formatted}`
}

/**
 * Get the currency symbol for a given code.
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCIES[currencyCode]?.symbol ?? currencyCode
}

/**
 * Convert an amount from MUR to a target currency (approximate, for seeding).
 * Rounds to nearest whole number for African currencies.
 */
export function getEquivalentAmount(amountMUR: number, targetCurrency: string): number {
  const rate = SEED_RATES_FROM_MUR[targetCurrency]
  if (!rate) return amountMUR
  const converted = amountMUR * rate
  const info = CURRENCIES[targetCurrency]
  if (info && info.decimals === 0) return Math.round(converted)
  return Math.round(converted * 100) / 100
}
