import React, { useState, useMemo } from 'react'
import ParallelCoordinatesChart from '../charts/ParallelCoordinatesChart.jsx'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { colors, CHART_COLORS } from '../../colors.js'
import InfoIcon from '../../components/common/InfoIcon.jsx'

const sectionStyle = {
  background: 'rgba(30,41,59,0.6)',
  border: '1px solid rgba(100,116,139,0.2)',
  borderRadius: 12,
  padding: 24,
}

const sectionTitleStyle = {
  color: '#f1f5f9',
  fontSize: 16,
  fontWeight: 700,
  margin: '0 0 16px 0',
}

// Euclidean distance for similarity on normalized features
const euclidean = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0))

const normalizeFeatures = (player, mins, maxs) => {
  const raw = [
    player.age,
    player.overall_rating,
    player.potential_rating,
    player.goals,
    player.assists,
    player.market_value,
  ]
  return raw.map((v, i) => {
    const range = maxs[i] - mins[i]
    return range === 0 ? 0 : (v - mins[i]) / range
  })
}

export default function ComparisonTab({ filteredPlayers }) {
  const initialIds = useMemo(
    () => filteredPlayers.slice(0, 2).map((p) => p.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [selectedIds, setSelectedIds] = useState(initialIds)

  const displayPlayers = filteredPlayers.slice(0, 30)
  const selectedPlayers = useMemo(
    () => filteredPlayers.filter((p) => selectedIds.includes(p.id)),
    [filteredPlayers, selectedIds]
  )

  // Toggle selection
  const togglePlayer = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

  // Radar chart data
  const radarData = useMemo(() => {
    const metrics = [
      { key: 'overall_rating', label: 'Overall', scale: (v) => v },
      { key: 'potential_rating', label: 'Potential', scale: (v) => v },
      { key: 'goals', label: 'Goals', scale: (v) => Math.min(100, v * 2.5) },
      { key: 'assists', label: 'Assists', scale: (v) => Math.min(100, v * 4) },
      { key: 'matches_played', label: 'Matches', scale: (v) => Math.min(100, v / 0.55) },
    ]
    return metrics.map(({ key, label, scale }) => {
      const entry = { metric: label }
      selectedPlayers.forEach((p) => {
        entry[p.name] = +scale(p[key]).toFixed(1)
      })
      return entry
    })
  }, [selectedPlayers])

  // Similar players for first selected player
  const similarPlayers = useMemo(() => {
    if (selectedPlayers.length === 0) return []
    const target = selectedPlayers[0]
    const keys = ['age', 'overall_rating', 'potential_rating', 'goals', 'assists', 'market_value']

    const allVals = keys.map((k) => filteredPlayers.map((p) => p[k]))
    const mins = allVals.map((arr) => Math.min(...arr))
    const maxs = allVals.map((arr) => Math.max(...arr))

    const targetVec = normalizeFeatures(target, mins, maxs)

    return filteredPlayers
      .filter((p) => p.id !== target.id)
      .map((p) => ({ ...p, _dist: euclidean(normalizeFeatures(p, mins, maxs), targetVec) }))
      .sort((a, b) => a._dist - b._dist)
      .slice(0, 5)
  }, [selectedPlayers, filteredPlayers])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Player Selection */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Player Selection</h3>
          <span style={{
            color: '#f97316',
            fontSize: 13,
            fontWeight: 600,
            background: 'rgba(249,115,22,0.12)',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: 6,
            padding: '4px 10px',
          }}>
            {selectedIds.length} / 4 selected
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {displayPlayers.map((p) => {
            const isSelected = selectedIds.includes(p.id)
            return (
              <button
                key={p.id}
                onClick={() => togglePlayer(p.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: isSelected ? 'rgba(249,115,22,0.2)' : 'rgba(30,41,59,0.8)',
                  border: isSelected
                    ? '1px solid rgba(249,115,22,0.7)'
                    : '1px solid rgba(100,116,139,0.25)',
                  color: isSelected ? '#f97316' : '#94a3b8',
                }}
              >
                {p.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Radar Chart */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Performance Radar</h3>
          <InfoIcon text="Radar chart overlaying up to 4 selected players across 5 metrics: overall rating, potential, goals, assists, and matches played (each scaled to 0–100). A larger area indicates a stronger all-round profile." />
        </div>
        {selectedPlayers.length > 0 ? (
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="rgba(100,116,139,0.2)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickCount={4}
              />
              {selectedPlayers.map((p, i) => (
                <Radar
                  key={p.id}
                  name={p.name}
                  dataKey={p.name}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  fillOpacity={0.12}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS[i % CHART_COLORS.length] }}
                />
              ))}
              <Legend
                wrapperStyle={{ color: '#94a3b8', fontSize: 12, paddingTop: 8 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>
            Select at least one player to see the radar chart
          </div>
        )}
      </div>

      {/* Player Stat Cards */}
      {selectedPlayers.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Player Stats</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {selectedPlayers.map((p, i) => {
              const accentColor = CHART_COLORS[i % CHART_COLORS.length]
              return (
                <div
                  key={p.id}
                  style={{
                    background: 'rgba(15,23,42,0.6)',
                    border: `1px solid ${accentColor}44`,
                    borderRadius: 10,
                    padding: 18,
                    borderTop: `3px solid ${accentColor}`,
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                      {p.name}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>
                      {p.club} · {p.position}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { label: 'Market Value', value: `€${p.market_value}M`, color: '#f97316' },
                      { label: 'Age', value: p.age },
                      { label: 'Overall', value: p.overall_rating },
                      { label: 'Potential', value: p.potential_rating },
                      { label: 'Goals', value: p.goals },
                      { label: 'Assists', value: p.assists },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{label}</span>
                        <span style={{ color: color || '#f1f5f9', fontWeight: 600, fontSize: 13 }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Similar Players */}
      {selectedPlayers.length > 0 && similarPlayers.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            Players Similar to {selectedPlayers[0].name}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {similarPlayers.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(15,23,42,0.5)',
                  border: '1px solid rgba(100,116,139,0.15)',
                  borderRadius: 8,
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: `${CHART_COLORS[i % CHART_COLORS.length]}22`,
                    border: `2px solid ${CHART_COLORS[i % CHART_COLORS.length]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: CHART_COLORS[i % CHART_COLORS.length],
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                    <div style={{ color: '#64748b', fontSize: 11 }}>{p.club} · {p.position} · Age {p.age}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase' }}>OVR</div>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>{p.overall_rating}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase' }}>Value</div>
                    <div style={{ color: '#f97316', fontWeight: 700, fontSize: 14 }}>€{p.market_value}M</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase' }}>Dist</div>
                    <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>{p._dist.toFixed(3)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parallel Coordinates — all filtered players */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Parallel Coordinates — All Players</h3>
          <InfoIcon text="Multi-axis chart where each vertical axis is a stat (age, rating, potential, goals, assists, value). Each line is a player, coloured by position. Parallel lines reveal patterns; crossing lines reveal trade-offs between attributes." />
        </div>
        <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 12px 0' }}>
          Each line is a player coloured by position. Hover to highlight.
        </p>
        <ParallelCoordinatesChart players={filteredPlayers} />
      </div>

    </div>
  )
}
