export const toArr = (v: any): any[] => Array.isArray(v) ? v : (v?.$values ?? [])
