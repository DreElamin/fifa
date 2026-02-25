import { useMemo, useState } from 'react'
import { correlation } from '../../utils/stats.js'

const FIELDS = [
  { key: 'age', label: 'Age' },
  { key: 'overall_rating', label: 'Rating' },
  { key: 'potential_rating', label: 'Potential' },
  { key: 'market_value', label: 'Value' },
  { key: 'goals', label: 'Goals' },
  { key: 'assists', label: 'Assists' },
]

const getColor = (r) => {
  if (r >= 0) {
    const t = r
    const R = Math.round(249 * t + 30 * (1 - t))
    const G = Math.round(115 * t + 41 * (1 - t))
    const B = Math.round(22 * t + 59 * (1 - t))
    return `rgba(${R},${G},${B},${0.3 + t * 0.7})`
  } else {
    const t = -r
    const R = Math.round(59 * t + 30 * (1 - t))
    const G = Math.round(130 * t + 41 * (1 - t))
    const B = Math.round(246 * t + 59 * (1 - t))
    return `rgba(${R},${G},${B},${0.3 + t * 0.7})`
  }
}

export default function HeatmapChart({ players }) {
  const [tooltip, setTooltip] = useState(null)

  const matrix = useMemo(() => {
    const cols = FIELDS.map(f => players.map(p => p[f.key] ?? 0))
    return FIELDS.map((_, i) => FIELDS.map((_, j) => {
      if (i === j) return 1
      return +correlation(cols[i], cols[j]).toFixed(3)
    }))
  }, [players])

  const cellSize = 64

  return (
    <div style={{ position: 'relative', overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${FIELDS.length}, ${cellSize}px)`, gap: 2 }}>
        {/* Top-left empty */}
        <div />
        {/* Column headers */}
        {FIELDS.map(f => (
          <div key={f.key} style={{
            textAlign: 'center', color: '#94a3b8', fontSize: 11, fontWeight: 600,
            padding: '4px 0', borderBottom: '1px solid rgba(100,116,139,0.2)',
          }}>{f.label}</div>
        ))}

        {/* Rows */}
        {FIELDS.map((rowF, i) => (
          <>
            <div key={rowF.key} style={{
              display: 'flex', alignItems: 'center',
              color: '#94a3b8', fontSize: 11, fontWeight: 600,
              paddingRight: 8, borderRight: '1px solid rgba(100,116,139,0.2)',
            }}>{rowF.label}</div>
            {FIELDS.map((colF, j) => {
              const r = matrix[i][j]
              return (
                <div
                  key={colF.key}
                  style={{
                    width: cellSize, height: cellSize,
                    background: getColor(r),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 4, cursor: 'default',
                    border: tooltip?.i === i && tooltip?.j === j ? '1.5px solid #f97316' : '1.5px solid transparent',
                    transition: 'border 0.1s',
                  }}
                  onMouseEnter={() => setTooltip({ i, j, r, row: rowF.label, col: colF.label })}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <span style={{
                    color: Math.abs(r) > 0.5 ? '#fff' : '#94a3b8',
                    fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                  }}>{r.toFixed(2)}</span>
                </div>
              )
            })}
          </>
        ))}
      </div>

      {/* Color scale legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <span style={{ color: '#94a3b8', fontSize: 11 }}>-1</span>
        <div style={{
          flex: 1, height: 8, borderRadius: 4,
          background: 'linear-gradient(to right, rgba(59,130,246,1), rgba(30,41,59,0.5), rgba(249,115,22,1))',
        }} />
        <span style={{ color: '#94a3b8', fontSize: 11 }}>+1</span>
        <span style={{ color: '#64748b', fontSize: 11, marginLeft: 8 }}>Blue = negative · Orange = positive correlation</span>
      </div>

      {tooltip && (
        <div style={{
          marginTop: 12, padding: '8px 14px',
          background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: 8, display: 'inline-block',
        }}>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>
            {tooltip.row} × {tooltip.col}: {' '}
          </span>
          <span style={{ color: Math.abs(tooltip.r) > 0.5 ? '#f97316' : '#94a3b8', fontWeight: 700, fontSize: 13 }}>
            r = {tooltip.r.toFixed(3)}
          </span>
          <span style={{ color: '#64748b', fontSize: 11, marginLeft: 8 }}>
            ({Math.abs(tooltip.r) > 0.7 ? 'strong' : Math.abs(tooltip.r) > 0.4 ? 'moderate' : 'weak'} {tooltip.r >= 0 ? 'positive' : 'negative'})
          </span>
        </div>
      )}
    </div>
  )
}
