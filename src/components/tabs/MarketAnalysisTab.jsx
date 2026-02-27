import React from 'react'
import HeatmapChart from '../charts/HeatmapChart.jsx'
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from 'recharts'
import CustomTooltip from '../../components/common/CustomTooltip.jsx'
import InfoIcon from '../../components/common/InfoIcon.jsx'
import { colors } from '../../colors.js'

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
  marginBottom: 16,
  margin: '0 0 16px 0',
}

function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.95)',
        border: '1px solid rgba(249,115,22,0.3)',
        borderRadius: 8,
        padding: '10px 14px',
        backdropFilter: 'blur(20px)',
      }}
    >
      <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}>{d.name}</p>
      <p style={{ color: colors.accent, fontSize: 13, fontWeight: 600 }}>
        Age: {d.age}
      </p>
      <p style={{ color: colors.info, fontSize: 13, fontWeight: 600 }}>
        Value: €{d.market_value.toFixed(1)}M
      </p>
      <p style={{ color: colors.success, fontSize: 13, fontWeight: 600 }}>
        Rating: {d.overall_rating}
      </p>
    </div>
  )
}

// Rating tiers for bubble colour
const RATING_TIERS = [
  { label: '90+',   min: 90,  max: undefined, color: '#ef4444' },
  { label: '80–89', min: 80,  max: 90,        color: '#f97316' },
  { label: '70–79', min: 70,  max: 80,        color: '#eab308' },
  { label: '<70',   min: 0,   max: 70,        color: '#3b82f6' },
]
function ratingColor(r) {
  if (r >= 90) return '#ef4444'
  if (r >= 80) return '#f97316'
  if (r >= 70) return '#eab308'
  return '#3b82f6'
}

function correlationColor(r) {
  if (r >= 0.5) return colors.accent
  if (r >= 0.2) return colors.warning
  if (r >= 0) return colors.success
  if (r >= -0.2) return colors.textMuted || '#94a3b8'
  return colors.info
}

function correlationLabel(r) {
  const abs = Math.abs(r)
  const dir = r >= 0 ? 'Positive' : 'Negative'
  if (abs >= 0.7) return `Strong ${dir}`
  if (abs >= 0.4) return `Moderate ${dir}`
  if (abs >= 0.2) return `Weak ${dir}`
  return 'Negligible'
}

export default function MarketAnalysisTab({ filteredPlayers, analytics }) {
  const { positionAnalysis, correlations } = analytics

  // Build scatter data split by rating tier for a readable legend
  // Subsample every 2nd player to reduce clutter (~50% of players)
  const allScatter = filteredPlayers
    .filter((_, i) => i % 2 === 0)
    .map((p) => ({
      age: p.age,
      market_value: p.market_value,
      overall_rating: p.overall_rating,
      name: p.name,
      z: 30 + ((p.overall_rating - 60) / 40) * 120,
    }))

  const scatterTiers = RATING_TIERS.map(tier => ({
    ...tier,
    data: allScatter.filter(d => d.overall_rating >= tier.min &&
      (tier.max === undefined || d.overall_rating < tier.max)),
  }))

  const correlationCards = [
    {
      label: 'Age — Value',
      key: 'ageValue',
      r: correlations.ageValue,
      description: 'How strongly age predicts market value',
    },
    {
      label: 'Rating — Value',
      key: 'ratingValue',
      r: correlations.ratingValue,
      description: 'How strongly overall rating predicts market value',
    },
    {
      label: 'Age — Rating',
      key: 'ageRating',
      r: correlations.ageRating,
      description: 'How strongly age predicts overall rating',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top row: Scatter + Position Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Scatter Chart: Age vs Market Value */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ ...sectionTitleStyle, margin: 0 }}>Value vs Age (bubble size = rating)</p>
            <InfoIcon text="Each bubble is a player. X-axis is age, Y-axis is market value. Bubble size and colour both reflect overall rating — bigger/redder = higher rated. Market value peaks around age 26 and declines for older players, so younger and prime-age players tend to cluster higher on the chart. Hover a bubble for details." />
          </div>
          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
              <XAxis
                type="number"
                dataKey="age"
                name="Age"
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(100,116,139,0.3)' }}
                tickLine={false}
                label={{ value: 'Age', position: 'insideBottom', offset: -30, fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="market_value"
                name="Market Value"
                domain={[0, 'auto']}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(100,116,139,0.3)' }}
                tickLine={false}
                tickFormatter={(v) => `€${v.toFixed(0)}M`}
                width={56}
              />
              <ZAxis dataKey="z" range={[18, 200]} />
              <Tooltip content={<ScatterTooltip />} />
              <Legend
                verticalAlign="bottom"
                layout="horizontal"
                align="center"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: 11,
                  color: '#94a3b8',
                  paddingTop: 48,
                  textAlign: 'center',
                  width: '100%',
                }}
              />
              {scatterTiers.map(tier => (
                <Scatter
                  key={tier.label}
                  name={tier.label}
                  data={tier.data}
                  fill={tier.color}
                  fillOpacity={0.5}
                  stroke={tier.color}
                  strokeWidth={0.4}
                  strokeOpacity={0.7}
                  isAnimationActive={false}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart: Position vs Avg Value */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ ...sectionTitleStyle, margin: 0 }}>Avg Value by Position</p>
            <InfoIcon text="Bar chart comparing the average market value across player positions. Differences between positions reflect the distribution of overall ratings in the dataset — positions with more highly rated players will show higher average values. Each bar is colour-coded by position." />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={positionAnalysis}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
              <XAxis
                dataKey="position"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(100,116,139,0.3)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(100,116,139,0.3)' }}
                tickLine={false}
                tickFormatter={(v) => `€${v.toFixed(0)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgValue" name="Avg Value (€)" radius={[4, 4, 0, 0]}>
                {positionAnalysis.map((entry, index) => (
                  <Cell
                    key={`pos-cell-${index}`}
                    fill={colors.positions[entry.position] || colors.accent}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Position Performance Table */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ ...sectionTitleStyle, margin: 0 }}>Position Performance</p>
          <InfoIcon text="Per-position averages: number of players, average market value, goals per match, and assists per match. Useful for understanding productivity and value differences across roles." />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                {['Position', 'Players', 'Avg Value', 'Goals / Match', 'Assists / Match'].map(
                  (col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: col === 'Position' ? 'left' : 'right',
                        padding: '8px 12px',
                        color: '#94a3b8',
                        fontWeight: 600,
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        borderBottom: '1px solid rgba(100,116,139,0.2)',
                      }}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {positionAnalysis.map((row, i) => {
                const posColor = colors.positions[row.position] || colors.accent
                return (
                  <tr
                    key={row.position}
                    style={{
                      background:
                        i % 2 === 0 ? 'rgba(15,23,42,0.3)' : 'transparent',
                    }}
                  >
                    <td
                      style={{
                        padding: '10px 12px',
                        color: posColor,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: posColor,
                          flexShrink: 0,
                        }}
                      />
                      {row.position}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        color: '#f1f5f9',
                        textAlign: 'right',
                      }}
                    >
                      {row.count}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        color: '#f1f5f9',
                        textAlign: 'right',
                      }}
                    >
                      €{row.avgValue.toFixed(1)}M
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        color: colors.success,
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                      }}
                    >
                      {row.goalsPerMatch?.toFixed(3) ?? '—'}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        color: colors.info,
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                      }}
                    >
                      {row.assistsPerMatch?.toFixed(3) ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correlation Heatmap */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ ...sectionTitleStyle, margin: 0 }}>Feature Correlation Heatmap</p>
          <InfoIcon text="Heatmap of Pearson correlation coefficients between pairs of numerical features. Warm colours (orange) = positive correlation, cool colours (blue) = negative. Rating↔Value and Potential↔Value should show strong positive correlations since market value is driven by those factors. Goals and Assists are derived from rating and position, so they also correlate moderately with Rating and Value. Age has a mild negative correlation with Value as performance peaks around 26." />
        </div>
        <HeatmapChart players={filteredPlayers} />
      </div>

      {/* Correlation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {correlationCards.map(({ label, r, description }) => {
          const c = correlationColor(r)
          const strength = correlationLabel(r)
          const absR = Math.abs(r)
          return (
            <div
              key={label}
              style={{
                background: 'rgba(30,41,59,0.6)',
                border: `1px solid ${c}33`,
                borderRadius: 12,
                padding: '20px 24px',
                boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 ${c}22`,
              }}
            >
              <div
                style={{
                  color: '#94a3b8',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 10,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  color: c,
                  fontSize: 36,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {r >= 0 ? '+' : ''}{r?.toFixed(3) ?? '—'}
              </div>
              <div
                style={{
                  color: c,
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                {strength}
              </div>
              {/* Mini correlation bar */}
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: 'rgba(100,116,139,0.2)',
                  overflow: 'hidden',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${absR * 100}%`,
                    background: c,
                    borderRadius: 2,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <div style={{ color: '#64748b', fontSize: 11 }}>{description}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
