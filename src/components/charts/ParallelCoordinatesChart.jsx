import { useMemo, useState } from 'react'
import { colors } from '../../colors.js'

const AXES = [
  { key: 'age', label: 'Age', min: 17, max: 39 },
  { key: 'overall_rating', label: 'Rating', min: 60, max: 94 },
  { key: 'potential_rating', label: 'Potential', min: 65, max: 98 },
  { key: 'goals', label: 'Goals', min: 0, max: 39 },
  { key: 'assists', label: 'Assists', min: 0, max: 25 },
  { key: 'market_value', label: 'Value (€M)', min: 0.5, max: 180 },
]

const norm = (v, min, max) => (v - min) / (max - min)

export default function ParallelCoordinatesChart({ players }) {
  const [hovered, setHovered] = useState(null)
  const W = 700, H = 300, PAD_X = 60, PAD_Y = 40

  const axisX = useMemo(() =>
    AXES.map((_, i) => PAD_X + (i * (W - PAD_X * 2)) / (AXES.length - 1)),
    []
  )

  const sample = useMemo(() => {
    if (players.length <= 120) return players
    const step = Math.ceil(players.length / 120)
    return players.filter((_, i) => i % step === 0)
  }, [players])

  const getY = (player, axis) => {
    const v = player[axis.key] ?? 0
    return PAD_Y + (1 - norm(v, axis.min, axis.max)) * (H - PAD_Y * 2)
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
        {/* Player lines */}
        {sample.map((p, pi) => {
          const pts = AXES.map((ax, i) => `${axisX[i]},${getY(p, ax)}`).join(' ')
          const isHov = hovered === p.id
          const col = colors.positions[p.position] || '#f97316'
          return (
            <polyline
              key={p.id}
              points={pts}
              fill="none"
              stroke={col}
              strokeWidth={isHov ? 2.5 : 0.7}
              strokeOpacity={isHov ? 1 : hovered ? 0.08 : 0.35}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer', transition: 'stroke-opacity 0.15s' }}
            />
          )
        })}

        {/* Axes */}
        {AXES.map((ax, i) => (
          <g key={ax.key}>
            <line
              x1={axisX[i]} y1={PAD_Y}
              x2={axisX[i]} y2={H - PAD_Y}
              stroke="rgba(100,116,139,0.5)" strokeWidth={1.5}
            />
            <text x={axisX[i]} y={PAD_Y - 8} textAnchor="middle"
              fill="#94a3b8" fontSize={11} fontWeight={600}>{ax.label}</text>
            <text x={axisX[i]} y={PAD_Y + 2} textAnchor="middle"
              fill="#64748b" fontSize={9}>{ax.max}</text>
            <text x={axisX[i]} y={H - PAD_Y + 12} textAnchor="middle"
              fill="#64748b" fontSize={9}>{ax.min}</text>
          </g>
        ))}

        {/* Hovered player label */}
        {hovered && (() => {
          const p = sample.find(x => x.id === hovered)
          if (!p) return null
          return (
            <text x={W / 2} y={H - 4} textAnchor="middle"
              fill="#f97316" fontSize={11} fontWeight={600}>
              {p.name} · {p.position} · {p.club} · €{p.market_value}M
            </text>
          )
        })()}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 8 }}>
        {Object.entries(colors.positions).map(([pos, col]) => (
          <div key={pos} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 20, height: 2, background: col, borderRadius: 1 }} />
            <span style={{ color: '#94a3b8', fontSize: 11 }}>{pos}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
