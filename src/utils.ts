export const toArr = (v: any): any[] => Array.isArray(v) ? v : (v?.$values ?? [])

export const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
export const monthName = (m: number) => MONTHS[m - 1] ?? String(m)

const CONSTRAINT_LABELS: Record<string, string> = {
  budget_cap_exchange:  'بورس برق: سقف بودجه اعمال شد',
  budget_cap_green:     'برق سبز: سقف بودجه اعمال شد',
  budget_cap_bilateral: 'قرارداد دوجانبه: سقف بودجه اعمال شد',
  not_beneficial:       'سودآور نبود — نادیده گرفته شد',
}
export const constraintLabel = (c: string): string => CONSTRAINT_LABELS[c] ?? c
