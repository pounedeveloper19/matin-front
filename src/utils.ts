export const toArr = (v: any): any[] => Array.isArray(v) ? v : (v?.$values ?? [])

const CONSTRAINT_LABELS: Record<string, string> = {
  budget_cap_exchange:  'بورس برق: سقف بودجه اعمال شد',
  budget_cap_green:     'برق سبز: سقف بودجه اعمال شد',
  budget_cap_bilateral: 'قرارداد دوجانبه: سقف بودجه اعمال شد',
  not_beneficial:       'سودآور نبود — نادیده گرفته شد',
}
export const constraintLabel = (c: string): string => CONSTRAINT_LABELS[c] ?? c
