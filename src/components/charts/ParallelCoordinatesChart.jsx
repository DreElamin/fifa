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
  const [tooltip, setTooltip] = useState({ x: 0, y: 0 })
  const [activePositions, setActivePositions] = useState(new Set())
  const W = 700, H = 300, PAD_X = 60, PAD_Y = 40

  const togglePosition = (pos) => {
    setActivePositions(prev => {
      const next = new Set(prev)
      if (next.has(pos)) next.delete(pos)
      else next.add(pos)
      return next
    })
  }

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

  const hoveredPlayer = hovered ? sample.find(x => x.id === hovered) : null

  return (
    <div style={{ overflowX: 'auto', position: 'relative' }}>
      <svg
        width={W}
        height={H}
        style={{ display: 'block', margin: '0 auto' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        }}
      >
        {/* Player lines */}
        {sample.map((p) => {
          const pts = AXES.map((ax, i) => `${axisX[i]},${getY(p, ax)}`).join(' ')
          const isHov = hovered === p.id
          const col = colors.positions[p.position] || '#f97316'
          const posFiltered = activePositions.size > 0
          const posActive = activePositions.has(p.position)
          const dimmed = isHov ? false : (posFiltered ? !posActive : (hovered ? true : false))
          return (
            <g key={p.id}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <polyline
                points={pts}
                fill="none"
                stroke={col}
                strokeWidth={isHov ? 2.5 : posActive && !hovered ? 1.2 : 0.7}
                strokeOpacity={isHov ? 1 : dimmed ? 0.05 : 0.45}
                style={{ pointerEvents: 'none', transition: 'stroke-opacity 0.15s' }}
              />
              {/* Wide invisible hit area so hover is easy to trigger */}
              <polyline
                points={pts}
                fill="none"
                stroke="transparent"
                strokeWidth={8}
                style={{ cursor: 'pointer' }}
              />
            </g>
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
      </svg>

      {/* Floating tooltip */}
      {hoveredPlayer && (() => {
        const col = colors.positions[hoveredPlayer.position] || '#f97316'
        const tipW = 200
        // flip left if too close to right edge
        const left = tooltip.x + 14 + tipW > W ? tooltip.x - tipW - 14 : tooltip.x + 14
        return (
          <div style={{
            position: 'absolute',
            top: tooltip.y - 10,
            left,
            pointerEvents: 'none',
            background: 'rgba(15,23,42,0.95)',
            border: `1px solid ${col}55`,
            borderRadius: 8,
            padding: '8px 12px',
            minWidth: tipW,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            zIndex: 10,
          }}>
            <div style={{ color: col, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
              {hoveredPlayer.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
              {[
                ['Position', hoveredPlayer.position],
                ['Club', hoveredPlayer.club],
                ['Age', hoveredPlayer.age],
                ['Rating', hoveredPlayer.overall_rating],
                ['Potential', hoveredPlayer.potential_rating],
                ['Value', `€${hoveredPlayer.market_value}M`],
                ['Goals', hoveredPlayer.goals],
                ['Assists', hoveredPlayer.assists],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#475569', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Legend — click to filter by position */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 10 }}>
        {Object.entries(colors.positions).map(([pos, col]) => {
          const active = activePositions.has(pos)
          return (
            <div
              key={pos}
              onClick={() => togglePosition(pos)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                cursor: 'pointer',
                padding: '3px 10px',
                borderRadius: 20,
                border: `1px solid ${active ? col : 'rgba(100,116,139,0.25)'}`,
                background: active ? `${col}22` : 'transparent',
                opacity: activePositions.size > 0 && !active ? 0.45 : 1,
                transition: 'all 0.15s',
                userSelect: 'none',
              }}
            >
              <div style={{ width: 18, height: 2.5, background: col, borderRadius: 2 }} />
              <span style={{ color: active ? col : '#94a3b8', fontSize: 11, fontWeight: active ? 700 : 400 }}>{pos}</span>
            </div>
          )
        })}
        {activePositions.size > 0 && (
          <div
            onClick={() => setActivePositions(new Set())}
            style={{
              display: 'flex', alignItems: 'center',
              cursor: 'pointer', padding: '3px 10px', borderRadius: 20,
              border: '1px solid rgba(100,116,139,0.4)',
              color: '#64748b', fontSize: 11,
              transition: 'all 0.15s',
              userSelect: 'none',
            }}
          >
            clear
          </div>
        )}
      </div>
    </div>
  )
}
