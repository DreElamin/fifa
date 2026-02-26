import React, { useState, useMemo } from 'react'
import InfoIcon from '../../components/common/InfoIcon.jsx'
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

const noteStyle = {
  fontSize: 12,
  color: '#94a3b8',
  marginTop: 12,
  fontStyle: 'italic',
}

const thStyle = {
  padding: '10px 14px',
  color: '#94a3b8',
  fontWeight: 600,
  fontSize: 12,
  textAlign: 'left',
  borderBottom: '1px solid rgba(100,116,139,0.3)',
  background: 'rgba(15,23,42,0.6)',
  whiteSpace: 'nowrap',
}

const tdBase = {
  padding: '10px 14px',
  fontSize: 13,
  color: '#cbd5e1',
  borderBottom: '1px solid rgba(100,116,139,0.1)',
}

const CLUSTER_COLORS = {
  0: '#f97316',
  1: '#eab308',
  2: '#22c55e',
  3: '#3b82f6',
}

const CLUSTER_LABELS = {
  0: 'Elite',
  1: 'Star',
  2: 'Regular',
  3: 'Prospect',
}

function fmt(val) {
  const n = parseFloat(val)
  return isNaN(n) ? '—' : n.toFixed(2)
}

function normalizeColumn(players, key) {
  const vals = players.map((p) => parseFloat(p[key]) || 0)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  return vals.map((v) => (v - min) / range)
}

function euclidean(a, b) {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0))
}

function UndervaluedTable({ analyzedPlayers, onSelectPlayer, selectedPlayer }) {
  const rows = useMemo(
    () =>
      analyzedPlayers
        .filter((p) => p.zScore < -0.5)
        .sort((a, b) => a.zScore - b.zScore)
        .slice(0, 15),
    [analyzedPlayers]
  )

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Undervalued Players (Model predicts higher value)</h3>
        <InfoIcon text="Top 15 players whose actual market value is significantly below the neural network's prediction (z-score < −0.5). A large gap suggests the market has underpriced their talent. Click a row to explore similar players." />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Name', 'Club', 'Position', 'Actual €M', 'Predicted €M', 'Gap €M', 'Z-Score'].map(
                (h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((player, idx) => {
              const gap = (player.predictedValue - (player.market_value || 0)).toFixed(2)
              const isSelected =
                selectedPlayer &&
                (selectedPlayer.name || selectedPlayer.short_name) ===
                  (player.name || player.short_name)
              return (
                <tr
                  key={idx}
                  onClick={() => onSelectPlayer(player)}
                  style={{
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    background: isSelected
                      ? 'rgba(249,115,22,0.18)'
                      : 'transparent',
                    outline: isSelected ? '1px solid rgba(249,115,22,0.5)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(249,115,22,0.07)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected
                      ? 'rgba(249,115,22,0.18)'
                      : 'transparent'
                  }}
                >
                  <td style={{ ...tdBase, color: isSelected ? '#f97316' : '#f8fafc', fontWeight: 600 }}>
                    {player.name || player.short_name || '—'}
                  </td>
                  <td style={tdBase}>{player.club || player.club_name || '—'}</td>
                  <td style={tdBase}>{player.position || player.player_positions || '—'}</td>
                  <td style={tdBase}>{fmt(player.market_value)}</td>
                  <td style={{ ...tdBase, color: '#f97316' }}>
                    {fmt(player.predictedValue)}
                  </td>
                  <td style={{ ...tdBase, color: '#4ade80', fontWeight: 600 }}>+{gap}</td>
                  <td style={{ ...tdBase, color: '#4ade80', fontWeight: 600 }}>
                    {parseFloat(player.zScore).toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p style={noteStyle}>These players are priced below what their stats suggest</p>
    </div>
  )
}

function OvervaluedTable({ analyzedPlayers, onSelectPlayer, selectedPlayer }) {
  const rows = useMemo(
    () =>
      analyzedPlayers
        .filter((p) => p.zScore > 0.5)
        .sort((a, b) => b.zScore - a.zScore)
        .slice(0, 15),
    [analyzedPlayers]
  )

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Overvalued Players (Actual value exceeds model prediction)</h3>
        <InfoIcon text="Top 15 players whose actual market value is significantly above the neural network's prediction (z-score > 0.5). The market may be pricing in hype, brand value, or factors not captured in the stats." />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Name', 'Club', 'Position', 'Actual €M', 'Predicted €M', 'Gap €M', 'Z-Score'].map(
                (h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((player, idx) => {
              const gap = (player.predictedValue - (player.market_value || 0)).toFixed(2)
              const isSelected =
                selectedPlayer &&
                (selectedPlayer.name || selectedPlayer.short_name) ===
                  (player.name || player.short_name)
              return (
                <tr
                  key={idx}
                  onClick={() => onSelectPlayer(player)}
                  style={{
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    background: isSelected
                      ? 'rgba(239,68,68,0.18)'
                      : 'transparent',
                    outline: isSelected ? '1px solid rgba(239,68,68,0.5)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(239,68,68,0.07)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected
                      ? 'rgba(239,68,68,0.18)'
                      : 'transparent'
                  }}
                >
                  <td style={{ ...tdBase, color: isSelected ? '#f87171' : '#f8fafc', fontWeight: 600 }}>
                    {player.name || player.short_name || '—'}
                  </td>
                  <td style={tdBase}>{player.club || player.club_name || '—'}</td>
                  <td style={tdBase}>{player.position || player.player_positions || '—'}</td>
                  <td style={tdBase}>{fmt(player.market_value)}</td>
                  <td style={{ ...tdBase, color: '#f97316' }}>
                    {fmt(player.predictedValue)}
                  </td>
                  <td style={{ ...tdBase, color: '#f87171', fontWeight: 600 }}>{gap}</td>
                  <td style={{ ...tdBase, color: '#f87171', fontWeight: 600 }}>
                    {parseFloat(player.zScore).toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SimilaritySearch({ allPlayers }) {
  const [selectedName, setSelectedName] = useState('')

  const FEATURE_KEYS = [
    'age',
    'overall_rating',
    'potential_rating',
    'goals',
    'assists',
    'market_value',
  ]

  const normalizedMatrix = useMemo(() => {
    return FEATURE_KEYS.map((key) => normalizeColumn(allPlayers, key))
  }, [allPlayers])

  const getPlayerVector = (playerIdx) =>
    FEATURE_KEYS.map((_, fi) => normalizedMatrix[fi][playerIdx])

  const selectedIdx = useMemo(
    () => allPlayers.findIndex((p) => (p.name || p.short_name) === selectedName),
    [selectedName, allPlayers]
  )

  const similarPlayers = useMemo(() => {
    if (selectedIdx === -1 || !selectedName) return []
    const targetVec = getPlayerVector(selectedIdx)
    return allPlayers
      .map((player, idx) => {
        if (idx === selectedIdx) return null
        const dist = euclidean(targetVec, getPlayerVector(idx))
        return { player, dist }
      })
      .filter(Boolean)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5)
  }, [selectedIdx, selectedName, normalizedMatrix])

  const maxDist = useMemo(
    () => (similarPlayers.length > 0 ? Math.max(...similarPlayers.map((s) => s.dist)) : 1),
    [similarPlayers]
  )

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Find Similar Players</h3>
        <InfoIcon text="Select a player to find the 5 most statistically similar players using Euclidean distance across 6 normalised features: age, overall rating, potential, goals, assists, and market value." />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 8 }}>
          Select a player:
        </label>
        <select
          value={selectedName}
          onChange={(e) => setSelectedName(e.target.value)}
          style={{
            background: 'rgba(15,23,42,0.9)',
            border: '1px solid rgba(100,116,139,0.4)',
            borderRadius: 8,
            color: '#f8fafc',
            padding: '8px 14px',
            fontSize: 13,
            minWidth: 260,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">— Choose a player —</option>
          {allPlayers.map((p, idx) => {
            const name = p.name || p.short_name || `Player ${idx}`
            return (
              <option key={idx} value={name}>
                {name}
              </option>
            )
          })}
        </select>
      </div>

      {selectedName && selectedIdx !== -1 && (
        <>
          <div style={{ marginBottom: 12, fontSize: 13, color: '#94a3b8' }}>
            Showing top 5 players most similar to{' '}
            <span style={{ color: '#f97316', fontWeight: 600 }}>{selectedName}</span> based on
            age, rating, potential, goals, assists, and market value.
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Club', 'Position', 'Rating', 'Value €M', 'Similarity'].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {similarPlayers.map(({ player, dist }, idx) => {
                  const normDist = maxDist > 0 ? dist / maxDist : 0
                  const similarity = ((1 - normDist) * 100).toFixed(1)
                  return (
                    <tr key={idx}>
                      <td style={{ ...tdBase, color: '#f8fafc', fontWeight: 600 }}>
                        {player.name || player.short_name || '—'}
                      </td>
                      <td style={tdBase}>{player.club || player.club_name || '—'}</td>
                      <td style={tdBase}>{player.position || player.player_positions || '—'}</td>
                      <td style={{ ...tdBase, color: '#f97316' }}>
                        {player.overall_rating || '—'}
                      </td>
                      <td style={tdBase}>{fmt(player.market_value)}</td>
                      <td style={{ ...tdBase }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              height: 6,
                              borderRadius: 3,
                              background: 'rgba(100,116,139,0.2)',
                              flex: 1,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${similarity}%`,
                                background:
                                  parseFloat(similarity) > 80
                                    ? '#4ade80'
                                    : parseFloat(similarity) > 60
                                    ? '#f97316'
                                    : '#64748b',
                                borderRadius: 3,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              color:
                                parseFloat(similarity) > 80
                                  ? '#4ade80'
                                  : parseFloat(similarity) > 60
                                  ? '#f97316'
                                  : '#94a3b8',
                              fontWeight: 600,
                              minWidth: 44,
                              fontSize: 13,
                            }}
                          >
                            {similarity}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedName && selectedIdx === -1 && (
        <div style={{ color: '#f87171', fontSize: 13 }}>Player not found in dataset.</div>
      )}
    </div>
  )
}

function PCAMap({ allPlayers, pcaData, clusterLabels }) {
  const scatterData = useMemo(
    () =>
      pcaData.map((point, idx) => ({
        pc1: point.pc1,
        pc2: point.pc2,
        cluster: clusterLabels[idx],
        name: allPlayers[idx]?.name || allPlayers[idx]?.short_name || `Player ${idx}`,
        rating: allPlayers[idx]?.overall_rating || '',
      })),
    [pcaData, clusterLabels, allPlayers]
  )

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div
          style={{
            background: '#1e293b',
            border: '1px solid rgba(100,116,139,0.4)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            color: '#f8fafc',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4, color: CLUSTER_COLORS[d.cluster] }}>
            {d.name}
          </div>
          <div style={{ color: '#94a3b8' }}>Rating: {d.rating}</div>
          <div style={{ color: '#94a3b8' }}>
            PC1: {typeof d.pc1 === 'number' ? d.pc1.toFixed(3) : d.pc1}
          </div>
          <div style={{ color: '#94a3b8' }}>
            PC2: {typeof d.pc2 === 'number' ? d.pc2.toFixed(3) : d.pc2}
          </div>
          <div
            style={{
              color: CLUSTER_COLORS[d.cluster],
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            {CLUSTER_LABELS[d.cluster]}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ ...sectionTitleStyle, margin: 0 }}>PCA Player Map (2D projection of all stats)</h3>
        <InfoIcon text="All 500 players projected onto the first two principal components. Each dot is a player colour-coded by K-Means cluster. Players in the same region share similar overall stat profiles." />
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        {Object.entries(CLUSTER_LABELS).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: CLUSTER_COLORS[parseInt(key)],
                opacity: 0.85,
              }}
            />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 8, right: 20, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
          <XAxis
            dataKey="pc1"
            name="PC1"
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            label={{ value: 'PC1', position: 'insideBottom', offset: -4, fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            dataKey="pc2"
            name="PC2"
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            label={{ value: 'PC2', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={scatterData} r={4}>
            {scatterData.map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={CLUSTER_COLORS[entry.cluster] || '#64748b'}
                opacity={0.7}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p style={noteStyle}>
        Each point is a player projected onto 2 principal components. Clusters show natural player
        groupings.
      </p>
    </div>
  )
}

export default function ScoutTab({ analyzedPlayers, allPlayers, pcaData, clusterLabels }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  return (
    <div
      style={{
        background: '#0f172a',
        minHeight: '100%',
        padding: 24,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {selectedPlayer && (
        <div
          style={{
            background: 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: 10,
            padding: '12px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 13, color: '#fed7aa' }}>
            Selected:{' '}
            <strong style={{ color: '#f97316' }}>
              {selectedPlayer.name || selectedPlayer.short_name}
            </strong>{' '}
            — scroll down to the similarity search to explore similar players.
          </span>
          <button
            onClick={() => setSelectedPlayer(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>
      )}
      <UndervaluedTable analyzedPlayers={analyzedPlayers} onSelectPlayer={setSelectedPlayer} selectedPlayer={selectedPlayer} />
      <OvervaluedTable analyzedPlayers={analyzedPlayers} onSelectPlayer={setSelectedPlayer} selectedPlayer={selectedPlayer} />
      <SimilaritySearch
        allPlayers={allPlayers}
        initialPlayer={selectedPlayer}
      />
      <PCAMap allPlayers={allPlayers} pcaData={pcaData} clusterLabels={clusterLabels} />
    </div>
  )
}
