export const SHAMSI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
] as const

export type ShamsiMonth = (typeof SHAMSI_MONTHS)[number]

/** Returns a short Jalali label like "اردیبهشت ۰۳" from a Gregorian year/month. */
export function toJalaliLabel(gregorianYear: number, gregorianMonth: number): string {
  try {
    const date = new Date(gregorianYear, gregorianMonth - 1, 15)
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: '2-digit',
      month: 'long',
    }).format(date)
  } catch {
    return `${gregorianMonth}/${gregorianYear}`
  }
}

/** Full Jalali month name + year like "اردیبهشت ۱۴۰۳" */
export function toJalaliLabelFull(gregorianYear: number, gregorianMonth: number): string {
  try {
    const date = new Date(gregorianYear, gregorianMonth - 1, 15)
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: 'long',
    }).format(date)
  } catch {
    return `${gregorianMonth}/${gregorianYear}`
  }
}

/** 1-based Jalali month index → month name (e.g. 1 → "فروردین") */
export function shamsiMonthName(monthIndex: number): ShamsiMonth | '—' {
  return SHAMSI_MONTHS[(monthIndex - 1) % 12] ?? '—'
}

/**
 * When year/month are already Jalali (e.g. from MonthlyMarketRate where
 * Year=1402, Month=11 means "Bahman 1402"), use this — no calendar conversion.
 * Returns "بهمن ۰۲" (short 2-digit year suffix).
 */
export function jalaliMonthLabel(jalaliYear: number, jalaliMonth: number): string {
  const monthName = SHAMSI_MONTHS[(jalaliMonth - 1) % 12] ?? '—'
  const yearShort = String(jalaliYear).slice(-2)
  return `${monthName} ${yearShort}`
}
