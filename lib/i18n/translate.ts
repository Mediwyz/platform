import { en, type MessageKey } from './dictionaries/en'
import { fr } from './dictionaries/fr'
import { mfe } from './dictionaries/mfe'

export type Locale = 'en' | 'fr' | 'mfe'

const DICTS: Record<Locale, Partial<Record<MessageKey, string>>> = {
  en,
  fr,
  mfe,
}

/**
 * Pure translate function - usable in server code, tests, and components.
 *
 * Resolution order: requested locale → English → the key itself.
 * Placeholders like `{{name}}` get filled from `vars`.
 *
 * Keeping this a plain function (no hook, no context) means we can call it
 * from anywhere - including server components and cron jobs - without
 * wrestling with React provider trees.
 */
export function translate(
  key: MessageKey | string,
  locale: Locale = 'en',
  vars?: Record<string, string | number>,
): string {
  const dict = DICTS[locale] ?? DICTS.en
  const raw = (dict[key as MessageKey] ?? en[key as MessageKey] ?? key) as string
  if (!vars) return raw
  return raw.replace(/\{\{(\w+)\}\}/g, (_, v) => String(vars[v] ?? `{{${v}}}`))
}

/** Narrow user preference string to a supported Locale, falling back to en. */
export function coerceLocale(preferred: string | undefined | null): Locale {
  if (preferred === 'fr' || preferred === 'mfe') return preferred
  return 'en'
}
