/**
 * Input sanitization helpers.
 * Basic regex-based sanitization without external dependencies.
 */

/**
 * Strip HTML tags from a string.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

/**
 * Escape HTML special characters to prevent XSS.
 */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#96;',
  }
  return input.replace(/[&<>"'/`]/g, (char) => map[char] || char)
}

/**
 * Remove null bytes and control characters (except newlines and tabs).
 */
export function removeControlChars(input: string): string {
   
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

/**
 * Sanitize a user input string:
 * 1. Remove null bytes and control characters
 * 2. Strip HTML tags
 * 3. Trim whitespace
 * 4. Optionally limit length
 */
export function sanitizeInput(input: string, maxLength?: number): string {
  let clean = removeControlChars(input)
  clean = stripHtml(clean)
  clean = clean.trim()
  if (maxLength && clean.length > maxLength) {
    clean = clean.slice(0, maxLength)
  }
  return clean
}

/**
 * Sanitize a string for use in SQL-like contexts (basic protection).
 * Note: Always use parameterized queries (Prisma does this by default).
 * This is an extra safety layer.
 */
export function sanitizeSqlInput(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
}

/**
 * Validate and sanitize an email address.
 * Returns the sanitized email or null if invalid.
 */
export function sanitizeEmail(input: string): string | null {
  const cleaned = input.trim().toLowerCase()
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/
  return emailRegex.test(cleaned) ? cleaned : null
}

/**
 * Sanitize a phone number - keep digits, +, -, spaces, and parentheses.
 */
export function sanitizePhone(input: string): string {
  return input.replace(/[^0-9+\-() ]/g, '').trim()
}

/**
 * Sanitize an object's string values recursively.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  maxStringLength = 5000
): T {
  const sanitized = { ...obj }
  for (const key in sanitized) {
    const value = sanitized[key]
    if (typeof value === 'string') {
      ;(sanitized as Record<string, unknown>)[key] = sanitizeInput(
        value,
        maxStringLength
      )
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      ;(sanitized as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>,
        maxStringLength
      )
    }
  }
  return sanitized
}
