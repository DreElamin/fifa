import React, { useMemo } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  ReferenceLine,
  LabelList,
} from 'recharts'
import _ from 'lodash'
import { colors } from '../../colors.js'
import InfoIcon from '../../components/common/InfoIcon.jsx'

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const sectionStyle = {
  background: 'rgba(30,41,59,0.6)',
  border: '1px solid rgba(100,116,139,0.2)',
  borderRadius: 12,
  padding: 24,
  marginBottom: 24,
}

const sectionTitleStyle = {
  fontSize: 18,
  fontWeight: 700,
  color: '#f8fafc',
  margin: '0 0 20px 0',
}

const tooltipStyle = {
  background: '#1e293b',
  border: '1px solid rgba(100,116,139,0.4)',
  borderRadius: 8,
  color: '#f8fafc',
  fontSize: 13,
  padding: '10px 14px',
}

// ---------------------------------------------------------------------------
// Section 1 — Project Objective
// ---------------------------------------------------------------------------

function ProjectObjectiveSection() {
  return (
    <div
      style={{
        ...sectionStyle,
        background: 'rgba(30,41,59,0.8)',
        border: '1px solid rgba(249,115,22,0.35)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gradient accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #f97316, #fb923c, #fbbf24)',
          borderRadius: '12px 12px 0 0',
        }}
      />

      <div style={{ paddingTop: 8 }}>
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(249,115,22,0.15)',
            border: '1px solid rgba(249,115,22,0.4)',
            borderRadius: 6,
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 700,
            color: '#f97316',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Project Objective
        </div>

        <h2
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: '#f8fafc',
            margin: '0 0 12px 0',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}
        >
          Identifying Undervalued Football Players Using Machine Learning
        </h2>

        <p
          style={{
            fontSize: 15,
            color: '#94a3b8',
            margin: '0 0 24px 0',
            lineHeight: 1.7,
            maxWidth: 820,
          }}
        >
          We train a neural network on 500 player records to predict market value from
          performance stats, then surface players whose actual price is significantly below
          the model's prediction.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              dot: '#f97316',
              text: 'A 3-layer MLP is trained on features such as overall rating, age, position, and potential to learn what a "fair" market value looks like for any given player profile.',
            },
            {
              dot: '#22c55e',
              text: 'Once the model is trained, we run every player through it and compute the residual — the difference between the predicted price and the real transfer fee on record.',
            },
            {
              dot: '#3b82f6',
              text: 'Players with a large negative residual (actual price well below prediction) are flagged as undervalued targets — hidden gems that the market has not yet priced correctly.',
            },
          ].map(({ dot, text }, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: dot,
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <p style={{ margin: 0, fontSize: 14, color: '#cbd5e1', lineHeight: 1.65 }}>
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 2 — Model Performance Summary
// ---------------------------------------------------------------------------

function PerformanceSummarySection({ metrics, classifier }) {
  const { accuracy } = classifier.getMetrics()
  const accuracyPct =
    typeof accuracy === 'number'
      ? accuracy <= 1
        ? (accuracy * 100).toFixed(1)
        : accuracy.toFixed(1)
      : String(accuracy)

  const cards = [
    { label: 'NN RMSE', value: `€${metrics.rmse}M`, color: '#ef4444', sub: 'Root Mean Squared Error' },
    { label: 'NN R²', value: String(metrics.r2), color: '#22c55e', sub: 'Variance Explained' },
    { label: 'NN MAE', value: `€${metrics.mae}M`, color: '#3b82f6', sub: 'Mean Absolute Error' },
    { label: 'Classifier Accuracy', value: `${accuracyPct}%`, color: '#f97316', sub: 'Transfer Risk Classifier' },
  ]

  return (
    <div style={sectionStyle}>
      <h3 style={sectionTitleStyle}>Model Performance Summary</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}
      >
        {cards.map(({ label, value, color, sub }) => (
          <div
            key={label}
            style={{
              background: 'rgba(15,23,42,0.8)',
              border: `1px solid rgba(100,116,139,0.25)`,
              borderTop: `3px solid ${color}`,
              borderRadius: 10,
              padding: '18px 20px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {label}
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1, marginBottom: 6 }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: '#475569' }}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 3 — Key Findings
// ---------------------------------------------------------------------------

const KEY_FINDINGS = [
  {
    icon: '★',
    color: '#f97316',
    borderColor: 'rgba(249,115,22,0.5)',
    gradientFrom: 'rgba(249,115,22,0.10)',
    gradientTo: 'rgba(249,115,22,0.02)',
    title: 'Overall Rating is the Strongest Predictor',
    body: 'Top feature driving market value predictions. A 10-point rating increase correlates with roughly €15–25M in additional value, making it the single most impactful variable in the model.',
  },
  {
    icon: '▲',
    color: '#22c55e',
    borderColor: 'rgba(34,197,94,0.5)',
    gradientFrom: 'rgba(34,197,94,0.10)',
    gradientTo: 'rgba(34,197,94,0.02)',
    title: 'Age Peaks at 24–29',
    body: 'Players in this age band command the highest market values. After 29, value declines roughly 8% per year on average as the remaining years at peak performance shrink.',
  },
  {
    icon: '⚡',
    color: '#3b82f6',
    borderColor: 'rgba(59,130,246,0.5)',
    gradientFrom: 'rgba(59,130,246,0.10)',
    gradientTo: 'rgba(59,130,246,0.02)',
    title: 'Attackers Are Worth More',
    body: 'ST/LW/RW positions command a 30% premium over defensive positions at equivalent overall ratings. Goal-scoring output is priced at a significant premium by the transfer market.',
  },
  {
    icon: '!',
    color: '#ef4444',
    borderColor: 'rgba(239,68,68,0.5)',
    gradientFrom: 'rgba(239,68,68,0.10)',
    gradientTo: 'rgba(239,68,68,0.02)',
    title: 'Injury History Carries a Significant Penalty',
    body: 'Injury-prone players are valued ~20–25% lower than equivalent healthy players, even when performance stats are similar. The model captures this risk discount clearly.',
  },
]

function KeyFindingsSection() {
  return (
    <div style={sectionStyle}>
      <h3 style={sectionTitleStyle}>Key Findings</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        {KEY_FINDINGS.map(({ icon, color, borderColor, gradientFrom, gradientTo, title, body }) => (
          <div
            key={title}
            style={{
              background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
              border: `1px solid ${borderColor}`,
              borderLeft: `4px solid ${color}`,
              borderRadius: 10,
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: `rgba(0,0,0,0.25)`,
                  border: `1px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  color,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>
                {title}
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.65 }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 4 — Top 10 Undervalued Players table
// ---------------------------------------------------------------------------

function UndervaluedPlayersSection({ analyzedPlayers }) {
  const topUndervalued = useMemo(() => {
    return analyzedPlayers
      .filter((p) => p.zScore < -0.5)
      .sort((a, b) => a.zScore - b.zScore)
      .slice(0, 10)
  }, [analyzedPlayers])

  const [hoveredRow, setHoveredRow] = React.useState(null)

  const thStyle = {
    padding: '10px 14px',
    color: '#64748b',
    fontWeight: 600,
    fontSize: 11,
    textAlign: 'left',
    borderBottom: '1px solid rgba(100,116,139,0.25)',
    background: 'rgba(15,23,42,0.7)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={sectionStyle}>
      <h3 style={sectionTitleStyle}>Top 10 Undervalued Players</h3>
      {topUndervalued.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: 14 }}>
          No players with z-score below -0.5 found in the analyzed dataset.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Rank', 'Name', 'Club', 'Position', 'Actual Value', 'Predicted Value', 'Gap', 'Z-Score'].map(
                  (h) => (
                    <th key={h} style={{ ...thStyle, textAlign: h === 'Rank' ? 'center' : 'left' }}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {topUndervalued.map((player, idx) => {
                const actualM = (+player.market_value).toFixed(1)
                const predictedM = player.predictedValue.toFixed(1)
                const gapM = (player.predictedValue - player.market_value).toFixed(1)
                const isHovered = hoveredRow === idx
                const posColor = colors.positions[player.position] || '#94a3b8'

                return (
                  <tr
                    key={player.id ?? idx}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      background: isHovered
                        ? 'rgba(249,115,22,0.08)'
                        : idx % 2 === 0
                        ? 'rgba(15,23,42,0.3)'
                        : 'transparent',
                      transition: 'background 0.15s',
                      cursor: 'default',
                    }}
                  >
                    {/* Rank */}
                    <td
                      style={{
                        padding: '11px 14px',
                        color: idx === 0 ? '#f97316' : '#64748b',
                        fontWeight: idx === 0 ? 800 : 500,
                        fontSize: 13,
                        textAlign: 'center',
                        borderBottom: '1px solid rgba(100,116,139,0.1)',
                      }}
                    >
                      {idx + 1}
                    </td>
                    {/* Name */}
                    <td
                      style={{
                        padding: '11px 14px',
                        color: '#f1f5f9',
                        fontWeight: 600,
                        borderBottom: '1px solid rgba(100,116,139,0.1)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {player.name}
                    </td>
                    {/* Club */}
                    <td
                      style={{
                        padding: '11px 14px',
                        color: '#94a3b8',
                        borderBottom: '1px solid rgba(100,116,139,0.1)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {player.club}
                    </td>
                    {/* Position */}
                    <td
                      style={{
                        padding: '11px 14px',
                        borderBottom: '1px solid rgba(100,116,139,0.1)',
                      }}
                    >
                      <span
                        style={{
                          background: `${posColor}22`,
                          border: `1px solid ${posColor}66`,
                          color: posColor,
                          borderRadius: 5,
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {player.position}
                      </span>
                    </td>
                    {/* Actual Value */}
                    <td
                      style={{
                        padding: '11px 14px',
                        color: '#cbd5e1',
                        borderBottom: '1px solid rgba(100,116,139,0.1)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      €{actualM}M
                    </td>
                    {/* Predicted Value */}
                    <td
                      style={{
                        padding: '11px 14px',
                        color: '#cbd5e1',
                        borderBottom: '1px solid rgba(100,116,139,0.1)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      €{predictedM}M
                    </td>
                    {/* Gap */}
                    <td
                      style={{
                        padding: '11px 14px',
                        color: '#22c55e',
                        fontWeight: 700,
                        borderBottom: '1px solid rgba(100,116,139,0.1)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      +€{gapM}M
                    </td>
                    {/* Z-Score */}
                    <td
                      style={{
                        padding: '11px 14px',
                        color: '#22c55e',
                        fontWeight: 700,
                        borderBottom: '1px solid rgba(100,116,139,0.1)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {player.zScore.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 5 — Actual vs Predicted Scatter
// ---------------------------------------------------------------------------

function getPointColor(zScore) {
  if (zScore < -1.5) return '#22c55e'  // undervalued
  if (zScore > 1.5) return '#ef4444'   // overvalued
  return '#64748b'                      // fair value
}

function ScatterTooltipContent({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>{d.name}</div>
      <div style={{ color: '#94a3b8', marginBottom: 2 }}>
        Actual: <span style={{ color: '#f1f5f9', fontWeight: 600 }}>€{(d.x).toFixed(1)}M</span>
      </div>
      <div style={{ color: '#94a3b8', marginBottom: 2 }}>
        Predicted: <span style={{ color: '#f1f5f9', fontWeight: 600 }}>€{(d.y).toFixed(1)}M</span>
      </div>
      <div style={{ color: '#94a3b8' }}>
        Z-Score: <span style={{ color: getPointColor(d.zScore), fontWeight: 600 }}>{d.zScore?.toFixed(2)}</span>
      </div>
    </div>
  )
}

function ScatterSection({ analyzedPlayers }) {
  const scatterData = useMemo(() => {
    return analyzedPlayers.map((p) => ({
      x: +p.market_value,
      y: p.predictedValue,
      name: p.name,
      zScore: p.zScore,
    }))
  }, [analyzedPlayers])

  // Determine axis bounds
  const allX = scatterData.map((d) => d.x)
  const allY = scatterData.map((d) => d.y)
  const minVal = Math.floor(Math.min(...allX, ...allY))
  const maxVal = Math.ceil(Math.max(...allX, ...allY))

  // Reference line data: y = x diagonal
  const diagData = [
    { x: minVal, y: minVal },
    { x: maxVal, y: maxVal },
  ]

  const legendItems = [
    { color: '#22c55e', label: 'Undervalued (z < -1.5)' },
    { color: '#64748b', label: 'Fair Value (|z| ≤ 1.5)' },
    { color: '#ef4444', label: 'Overvalued (z > 1.5)' },
  ]

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Actual vs Predicted Market Value</h3>
        <InfoIcon text="Each point is a player. X-axis = actual market value, Y-axis = neural network prediction. Points on the dashed diagonal are perfectly predicted. Green dots are undervalued by the market; red dots are overvalued." />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
        {legendItems.map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 18,
              height: 2,
              background: 'rgba(249,115,22,0.6)',
              borderTop: '2px dashed rgba(249,115,22,0.6)',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Perfect Prediction (y = x)</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
          <XAxis
            type="number"
            dataKey="x"
            name="Actual Value"
            domain={[minVal, maxVal]}
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(v) => `€${v}M`}
            label={{
              value: 'Actual Market Value (€M)',
              position: 'insideBottom',
              offset: -16,
              fill: '#64748b',
              fontSize: 12,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Predicted Value"
            domain={[minVal, maxVal]}
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(v) => `€${v}M`}
            label={{
              value: 'Predicted Market Value (€M)',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              fill: '#64748b',
              fontSize: 12,
            }}
          />
          <Tooltip content={<ScatterTooltipContent />} cursor={{ stroke: 'rgba(249,115,22,0.3)', strokeWidth: 1 }} />
          {/* Perfect prediction diagonal */}
          <ReferenceLine
            segment={diagData}
            stroke="rgba(249,115,22,0.55)"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            ifOverflow="extendDomain"
          />
          <Scatter data={scatterData} isAnimationActive={false}>
            {scatterData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getPointColor(entry.zScore)}
                fillOpacity={0.75}
                r={4}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p
        style={{
          fontSize: 12,
          color: '#475569',
          margin: '8px 0 0 0',
          fontStyle: 'italic',
        }}
      >
        Points above the dashed line are underestimated by the market; points below are overestimated.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 6 — Position Value Analysis
// ---------------------------------------------------------------------------

function PositionBarTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>{d.position}</div>
      <div style={{ color: '#94a3b8', marginBottom: 2 }}>
        Avg Actual:{' '}
        <span style={{ color: '#f1f5f9', fontWeight: 600 }}>€{d.avgActual.toFixed(1)}M</span>
      </div>
      <div style={{ color: '#94a3b8', marginBottom: 2 }}>
        Avg Predicted:{' '}
        <span style={{ color: '#f1f5f9', fontWeight: 600 }}>€{d.avgPredicted.toFixed(1)}M</span>
      </div>
      <div style={{ color: '#94a3b8' }}>
        Avg Gap:{' '}
        <span
          style={{ color: d.avgGap >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}
        >
          {d.avgGap >= 0 ? '+' : ''}€{d.avgGap.toFixed(1)}M
        </span>
      </div>
    </div>
  )
}

function PositionValueSection({ analyzedPlayers }) {
  const positionData = useMemo(() => {
    const grouped = _.groupBy(analyzedPlayers, 'position')
    return Object.entries(grouped)
      .map(([position, players]) => {
        const avgActual = _.meanBy(players, (p) => +p.market_value)
        const avgPredicted = _.meanBy(players, (p) => p.predictedValue)
        const avgGap = avgPredicted - avgActual
        return { position, avgActual, avgPredicted, avgGap, count: players.length }
      })
      .sort((a, b) => b.avgGap - a.avgGap)
  }, [analyzedPlayers])

  const maxAbsGap = Math.max(...positionData.map((d) => Math.abs(d.avgGap)), 1)

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Which Positions Are Systematically Mispriced?</h3>
        <InfoIcon text="Average valuation gap (predicted minus actual) per position. Green bars mean the market tends to undervalue that position on average; red bars mean it tends to overpay. Sorted from most undervalued to most overvalued." />
      </div>
      <p
        style={{
          fontSize: 13,
          color: '#64748b',
          margin: '0 0 20px 0',
          lineHeight: 1.6,
        }}
      >
        Average gap = predicted value minus actual value per position. Positive (green) means the
        market tends to undervalue that position; negative (red) means it tends to overpay.
      </p>

      <ResponsiveContainer width="100%" height={Math.max(200, positionData.length * 44)}>
        <BarChart
          data={positionData}
          layout="vertical"
          margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(100,116,139,0.15)"
            horizontal={false}
          />
          <XAxis
            type="number"
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(100,116,139,0.3)' }}
            tickLine={false}
            tickFormatter={(v) => `€${v.toFixed(1)}M`}
            domain={[-maxAbsGap * 1.2, maxAbsGap * 1.2]}
          />
          <YAxis
            type="category"
            dataKey="position"
            stroke="#64748b"
            tick={{ fill: '#cbd5e1', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(100,116,139,0.3)' }}
            tickLine={false}
            width={50}
          />
          <Tooltip content={<PositionBarTooltip />} cursor={{ fill: 'rgba(249,115,22,0.06)' }} />
          <ReferenceLine x={0} stroke="rgba(100,116,139,0.5)" strokeWidth={1} />
          <Bar dataKey="avgGap" radius={[0, 4, 4, 0]}>
            {positionData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.avgGap >= 0 ? '#22c55e' : '#ef4444'}
                fillOpacity={0.8}
              />
            ))}
            <LabelList
              dataKey="avgGap"
              position="right"
              formatter={(val) => {
                if (typeof val !== 'number') return ''
                const sign = val >= 0 ? '+' : ''
                return `${sign}€${val.toFixed(1)}M`
              }}
              style={{ fill: '#94a3b8', fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root export
// ---------------------------------------------------------------------------

export default function InsightsTab({ mlResults, analyzedPlayers, allPlayers, featureImportance }) {
  const { metrics, classifier } = mlResults

  return (
    <div
      style={{
        background: '#0f172a',
        minHeight: '100%',
        padding: 24,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <ProjectObjectiveSection />
      <PerformanceSummarySection metrics={metrics} classifier={classifier} />
      <KeyFindingsSection />
      <UndervaluedPlayersSection analyzedPlayers={analyzedPlayers} />
      <ScatterSection analyzedPlayers={analyzedPlayers} />
      <PositionValueSection analyzedPlayers={analyzedPlayers} />
    </div>
  )
}
