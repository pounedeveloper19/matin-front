import { useRef } from 'react'

function useChartId(prefix: string) {
  const ref = useRef(`${prefix}-${Math.random().toString(36).slice(2)}`)
  return ref.current
}

// ─── Line / Area Chart ────────────────────────────────────────────────────────

export interface LineSeries {
  name: string
  color: string
  data: number[]
}

interface SvgLineChartProps {
  series: LineSeries[]
  labels: string[]
  height?: number
}

export function SvgLineChart({ series, labels, height = 180 }: SvgLineChartProps) {
  const id = useChartId('lc')
  const allVals = series.flatMap(s => s.data).filter(Number.isFinite)
  if (!allVals.length || !labels.length) return null

  const minVal = Math.min(...allVals)
  const maxVal = Math.max(...allVals)
  const range  = maxVal - minVal || 1
  const W = 100, H = 72, PX = 4, PY = 5

  const gx = (i: number) => PX + (i / Math.max(labels.length - 1, 1)) * (W - PX * 2)
  const gy = (v: number) => PY + ((maxVal - v) / range) * (H - PY * 2)

  const smooth = (data: number[]) =>
    data.map((v, i) => {
      const x = gx(i), y = gy(v)
      if (i === 0) return `M ${x.toFixed(2)} ${y.toFixed(2)}`
      const px = gx(i - 1), py = gy(data[i - 1])
      const cx = ((px + x) / 2).toFixed(2)
      return `C ${cx} ${py.toFixed(2)} ${cx} ${y.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`
    }).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H + PY + 7}`} preserveAspectRatio="none" style={{ height, width: '100%' }}>
      <defs>
        {series.map((s, si) => (
          <linearGradient key={si} id={`${id}-g${si}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={s.color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
          </linearGradient>
        ))}
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
        const y = gy(minVal + range * p)
        return (
          <line key={i} x1={PX} x2={W - PX} y1={y} y2={y}
            stroke="rgba(0,0,0,0.07)" strokeWidth="0.35" strokeDasharray="1.5 1.5" />
        )
      })}

      {/* Series */}
      {series.map((s, si) => {
        const path = smooth(s.data)
        const last = s.data.length - 1
        const area = `${path} L ${gx(last).toFixed(2)} ${H} L ${gx(0).toFixed(2)} ${H} Z`
        return (
          <g key={si}>
            <path d={area} fill={`url(#${id}-g${si})`} />
            <path d={path} fill="none" stroke={s.color} strokeWidth="0.9"
              strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )
      })}

      {/* X labels */}
      {labels.map((l, i) => (
        <text key={i} x={gx(i)} y={H + PY + 5} textAnchor="middle"
          fontSize="3" fill="rgba(0,0,0,0.38)" fontFamily="Vazirmatn, sans-serif">
          {l}
        </text>
      ))}
    </svg>
  )
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────

interface DonutChartProps {
  value: number
  color?: string
  size?: number
  label?: string
  trackColor?: string
}

export function DonutChart({
  value,
  color = '#10b981',
  size = 120,
  label,
  trackColor = 'rgba(0,0,0,0.07)',
}: DonutChartProps) {
  const r = 36
  const circ = 2 * Math.PI * r
  const dash = Math.min(Math.max(value, 0), 100) / 100 * circ
  const gap  = circ - dash

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" style={{ width: size, height: size, transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke={trackColor} strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash.toFixed(2)} ${gap.toFixed(2)}`}
          strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        <span className="font-bold" style={{ color, fontSize: size * 0.2 }}>{value}٪</span>
        {label && (
          <span className="text-gray-500 mt-0.5 px-2" style={{ fontSize: size * 0.09, lineHeight: 1.2 }}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Area Wave Chart ──────────────────────────────────────────────────────────

interface AreaWaveProps {
  data: number[]
  color?: string
  height?: number
  labels?: string[]
  filled?: boolean
}

export function AreaWave({ data, color = '#10b981', height = 80, labels = [], filled = true }: AreaWaveProps) {
  const id = useChartId('aw')
  if (!data.length) return null

  const W = 100, H = 62, PX = 3, PY = 4
  const max = Math.max(...data) || 1
  const min = Math.min(...data)
  const range = max - min || 1

  const gx = (i: number) => PX + (i / Math.max(data.length - 1, 1)) * (W - PX * 2)
  const gy = (v: number) => PY + ((max - v) / range) * (H - PY * 2)

  const path = data.map((v, i) => {
    const x = gx(i), y = gy(v)
    if (i === 0) return `M ${x.toFixed(2)} ${y.toFixed(2)}`
    const px = gx(i - 1), py = gy(data[i - 1])
    const cx = ((px + x) / 2).toFixed(2)
    return `C ${cx} ${py.toFixed(2)} ${cx} ${y.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')

  const area = `${path} L ${gx(data.length - 1).toFixed(2)} ${H} L ${gx(0).toFixed(2)} ${H} Z`
  const hasLabels = labels.length > 0

  return (
    <svg viewBox={`0 0 ${W} ${H + (hasLabels ? 9 : 0)}`} preserveAspectRatio="none"
      style={{ height, width: '100%' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {filled && <path d={area} fill={`url(#${id})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      {hasLabels && labels.map((l, i) => (
        <text key={i} x={gx(i)} y={H + 7} textAnchor="middle"
          fontSize="3.5" fill="rgba(0,0,0,0.35)" fontFamily="Vazirmatn, sans-serif">
          {l}
        </text>
      ))}
    </svg>
  )
}

// ─── Region Heat Map — Iran topographic province map ─────────────────────────

// Geographic cluster positions mapped to a 400×255 SVG viewBox
// Each cluster aggregates nearby provinces; density is relative customer weight
const TOPO_CLUSTERS = [
  { label: 'آذربایجان',     cx:  62, cy:  52, rx: 50, ry: 30, tilt: -18, density: 0.78 },
  { label: 'گیلان-مازندران',cx: 192, cy:  30, rx: 68, ry: 20, tilt:   8, density: 0.74 },
  { label: 'خراسان',        cx: 338, cy:  58, rx: 55, ry: 33, tilt:  22, density: 0.88 },
  { label: 'کرمانشاه',      cx:  50, cy: 125, rx: 44, ry: 27, tilt: -12, density: 0.63 },
  { label: 'تهران-البرز',   cx: 198, cy:  88, rx: 58, ry: 36, tilt:   5, density: 0.97 },
  { label: 'اصفهان',        cx: 205, cy: 155, rx: 52, ry: 32, tilt:  10, density: 0.85 },
  { label: 'خوزستان',       cx:  86, cy: 180, rx: 50, ry: 28, tilt:  -5, density: 0.82 },
  { label: 'فارس-بوشهر',   cx: 185, cy: 220, rx: 54, ry: 27, tilt:   8, density: 0.78 },
  { label: 'کرمان-یزد',    cx: 278, cy: 185, rx: 52, ry: 30, tilt:  16, density: 0.63 },
  { label: 'سیستان',        cx: 348, cy: 210, rx: 38, ry: 22, tilt:  26, density: 0.42 },
]

interface RegionHeatMapProps {
  totalCustomers?: number
  provinces?: { id: number; name: string }[]
}

export function RegionHeatMap({ totalCustomers = 0, provinces = [] }: RegionHeatMapProps) {
  const id = useChartId('topo')
  const RINGS = 8
  const topCluster = TOPO_CLUSTERS.reduce((best, current) => current.density > best.density ? current : best, TOPO_CLUSTERS[0])

  return (
    <div
      className="overflow-hidden rounded-3xl bg-white"
      style={{
        border: '1px solid rgba(209,250,229,0.75)',
        boxShadow: '0 10px 26px rgba(15,23,42,0.06)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(226,232,240,0.9)' }}
      >
        <p className="text-sm font-bold text-emerald-900">توزیع جغرافیایی متقاضیان</p>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm" style={{ background: 'rgba(6,78,59,0.15)' }} />
            کم
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm" style={{ background: 'rgba(6,78,59,0.55)' }} />
            متوسط
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm" style={{ background: 'rgba(6,78,59,0.90)' }} />
            زیاد
          </span>
        </div>
      </div>

      {/* Topo SVG */}
      <div className="px-5 py-4">
        <svg viewBox="0 0 400 255" width="100%" style={{ display: 'block', borderRadius: 16 }}>
          <defs>
            {/* Soft blur filter for fill blobs */}
            <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
            {/* Per-cluster radial gradient */}
            {TOPO_CLUSTERS.map((c, i) => (
              <radialGradient key={i} id={`${id}-g${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={`rgba(255,255,255,${(0.35 + c.density * 0.55).toFixed(2)})`} />
                <stop offset="45%"  stopColor={`rgba(209,250,229,${(0.25 + c.density * 0.35).toFixed(2)})`} />
                <stop offset="100%" stopColor="rgba(6,78,59,0)" />
              </radialGradient>
            ))}
            {/* Background gradient */}
            <radialGradient id={`${id}-bg`} cx="48%" cy="42%" r="55%">
              <stop offset="0%"   stopColor="rgba(240,253,244,0.95)" />
              <stop offset="100%" stopColor="rgba(220,252,231,0.55)" />
            </radialGradient>
          </defs>

          {/* Background */}
          <rect width="400" height="255" rx="0" fill={`url(#${id}-bg)`} />

          {/* Soft fill blobs (blurred) */}
          {TOPO_CLUSTERS.map((c, i) => (
            <ellipse key={`blob-${i}`}
              cx={c.cx} cy={c.cy}
              rx={c.rx * 2.0} ry={c.ry * 2.0}
              transform={`rotate(${c.tilt}, ${c.cx}, ${c.cy})`}
              fill={`url(#${id}-g${i})`}
              filter={`url(#${id}-blur)`}
              opacity="0.9"
            />
          ))}

          {/* Contour rings */}
          {TOPO_CLUSTERS.map((c, i) =>
            Array.from({ length: RINGS }, (_, ri) => {
              const t     = (ri + 1) / (RINGS + 1)
              const scale = 1 - t * 0.80
              const alpha = (0.05 + (1 - t) * 0.20 * c.density).toFixed(2)
              const sw    = (0.5 + (1 - t) * 0.7).toFixed(1)
              return (
                <ellipse key={`ring-${i}-${ri}`}
                  cx={c.cx} cy={c.cy}
                  rx={c.rx * scale} ry={c.ry * scale}
                  transform={`rotate(${c.tilt}, ${c.cx}, ${c.cy})`}
                  fill="none"
                  stroke={`rgba(6,78,59,${alpha})`}
                  strokeWidth={sw}
                />
              )
            })
          )}

          {/* Peak dots */}
          {TOPO_CLUSTERS.map((c, i) => (
            <circle key={`dot-${i}`}
              cx={c.cx} cy={c.cy}
              r={1.8 + c.density * 3.2}
              fill={`rgba(6,78,59,${(0.35 + c.density * 0.55).toFixed(2)})`}
            />
          ))}

          {/* Cluster labels */}
          {TOPO_CLUSTERS.map((c, i) => (
            <text key={`lbl-${i}`}
              x={c.cx} y={c.cy + c.ry * 0.35 + 9}
              textAnchor="middle"
              fontSize="6.5" fontFamily="Vazirmatn, sans-serif"
              fill={`rgba(6,78,59,${(0.5 + c.density * 0.4).toFixed(2)})`}
              fontWeight="600"
            >
              {c.label}
            </text>
          ))}
        </svg>
      </div>

      {/* Footer */}
      <div className="space-y-2 px-5 pb-4 text-xs">
        <p className="font-semibold text-gray-700">
          بیشترین تراکم درخواست: <span className="text-emerald-800">{topCluster.label}</span>
        </p>
        <div className="flex items-center justify-between text-gray-400">
          <span>{provinces.length > 0 ? `${provinces.length} استان` : '۳۱ استان کشور ایران'}</span>
          {totalCustomers > 0 && <span>{totalCustomers.toLocaleString('fa-IR')} متقاضی ثبت‌شده</span>}
        </div>
      </div>
    </div>
  )
}
