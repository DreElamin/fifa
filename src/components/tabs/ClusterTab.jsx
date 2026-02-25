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
} from 'recharts'
import { colors } from '../../colors.js'
import _ from 'lodash'

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

const CLUSTER_COLORS = {
  Elite: '#f97316',
  Star: '#eab308',
  Regular: '#22c55e',
  Prospect: '#3b82f6',
}

const CLUSTER_NAMES = ['Elite', 'Star', 'Regular', 'Prospect']

export default function ClusterTab({ filteredPlayers, kmeans, pcaData, clusterLabels }) {
  // Build scatter data
  const scatterData = useMemo(() => {
    if (!pcaData || !clusterLabels || pcaData.length !== filteredPlayers.length) return []
    return filteredPlayers.map((p, i) => ({
      pc1: pcaData[i]?.pc1 ?? 0,
      pc2: pcaData[i]?.pc2 ?? 0,
      cluster: clusterLabels[i] ?? 0,
      clusterName: kmeans ? kmeans.getClusterName(clusterLabels[i]) : CLUSTER_NAMES[clusterLabels[i]] ?? 'Unknown',
      name: p.name,
      overall: p.overall_rating,
      value: p.market_value,
    }))
  }, [filteredPlayers, pcaData, clusterLabels, kmeans])

  // Cluster statistics
  const clusterStats = useMemo(() => {
    return CLUSTER_NAMES.map((name, idx) => {
      const members = filteredPlayers.filter((_, i) => clusterLabels?.[i] === idx)
      const count = members.length
      const avgValue = count > 0 ? _.meanBy(members, 'market_value') : 0
      const avgRating = count > 0 ? _.meanBy(members, 'overall_rating') : 0
      const avgAge = count > 0 ? _.meanBy(members, 'age') : 0

      // Most common position
      const posGroups = _.groupBy(members, 'position')
      const typicalPosition = count > 0
        ? _.maxBy(Object.entries(posGroups), ([, arr]) => arr.length)?.[0] ?? '—'
        : '—'

      return { name, idx, count, avgValue, avgRating, avgAge, typicalPosition, color: CLUSTER_COLORS[name] }
    })
  }, [filteredPlayers, clusterLabels])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Cluster Scatter (PCA) */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Player Clusters (K-Means, k=4)</h3>
          <span style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
            Positioned using PCA — 2 principal components
          </span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          {CLUSTER_NAMES.map((name) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: CLUSTER_COLORS[name],
              }} />
              <span style={{ color: '#94a3b8', fontSize: 12 }}>{name}</span>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.12)" />
            <XAxis
              dataKey="pc1"
              type="number"
              name="PC1"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'PC1', position: 'insideBottom', offset: -8, fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              dataKey="pc2"
              type="number"
              name="PC2"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'PC2', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 11 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: 'rgba(100,116,139,0.3)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload
                if (!d) return null
                const clusterColor = CLUSTER_COLORS[d.clusterName] || '#f97316'
                return (
                  <div style={{
                    background: 'rgba(15,23,42,0.95)',
                    border: `1px solid ${clusterColor}55`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    minWidth: 140,
                  }}>
                    <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13, margin: '0 0 4px 0' }}>{d.name}</p>
                    <p style={{ color: clusterColor, fontSize: 12, margin: '0 0 2px 0' }}>{d.clusterName}</p>
                    <p style={{ color: '#94a3b8', fontSize: 11, margin: '0 0 2px 0' }}>
                      Overall: {d.overall}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>
                      Value: €{d.value}M
                    </p>
                  </div>
                )
              }}
            />
            <Scatter data={scatterData} isAnimationActive={false}>
              {scatterData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={CLUSTER_COLORS[entry.clusterName] || '#94a3b8'}
                  fillOpacity={0.75}
                  stroke={CLUSTER_COLORS[entry.clusterName] || '#94a3b8'}
                  strokeWidth={0.5}
                  strokeOpacity={0.4}
                  r={4}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Cluster Statistics Cards */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Cluster Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {clusterStats.map((cs) => (
            <div
              key={cs.name}
              style={{
                background: 'rgba(15,23,42,0.5)',
                border: `1px solid ${cs.color}33`,
                borderRadius: 10,
                padding: 18,
                borderTop: `3px solid ${cs.color}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ color: cs.color, fontWeight: 700, fontSize: 15 }}>{cs.name}</span>
                <span style={{
                  background: `${cs.color}20`,
                  color: cs.color,
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {cs.count}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: 12 }}>Avg Value</span>
                  <span style={{ color: '#f97316', fontWeight: 700, fontSize: 13 }}>
                    €{cs.avgValue.toFixed(1)}M
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: 12 }}>Avg Rating</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>
                    {cs.avgRating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cluster Insights Table */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Cluster Insights</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Cluster', 'Players', 'Avg Value', 'Avg Rating', 'Avg Age', 'Typical Position'].map((h) => (
                  <th
                    key={h}
                    style={{
                      color: '#64748b',
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '8px 14px',
                      textAlign: 'left',
                      borderBottom: '1px solid rgba(100,116,139,0.2)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clusterStats.map((cs, rowIdx) => (
                <tr
                  key={cs.name}
                  style={{
                    background: rowIdx % 2 === 0 ? 'transparent' : 'rgba(15,23,42,0.3)',
                  }}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: cs.color,
                        flexShrink: 0,
                      }} />
                      <span style={{ color: cs.color, fontWeight: 700 }}>{cs.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#f1f5f9', fontWeight: 600 }}>
                    {cs.count}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#f97316', fontWeight: 600 }}>
                    €{cs.avgValue.toFixed(1)}M
                  </td>
                  <td style={{ padding: '10px 14px', color: '#f1f5f9' }}>
                    {cs.avgRating.toFixed(1)}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#f1f5f9' }}>
                    {cs.avgAge.toFixed(1)}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      background: `${colors.positions[cs.typicalPosition] || '#94a3b8'}22`,
                      color: colors.positions[cs.typicalPosition] || '#94a3b8',
                      border: `1px solid ${colors.positions[cs.typicalPosition] || '#94a3b8'}44`,
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {cs.typicalPosition}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
