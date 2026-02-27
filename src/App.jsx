import React, { useState, useMemo, useEffect, useRef } from 'react'
import _ from 'lodash'

import { players } from './data/players.js'
import { mean, percentile, correlation } from './utils/stats.js'
import {
  NeuralNetwork,
  KMeans,
  PCA,
  AnomalyDetector,
  computeFeatureImportance,
  TransferRiskClassifier,
} from './utils/ml.js'
import { colors } from './colors.js'

import OverviewTab from './components/tabs/OverviewTab.jsx'
import MarketAnalysisTab from './components/tabs/MarketAnalysisTab.jsx'
import MLModelsTab from './components/tabs/MLModelsTab.jsx'
import PredictorTab from './components/tabs/PredictorTab.jsx'
import ComparisonTab from './components/tabs/ComparisonTab.jsx'
import ClusterTab from './components/tabs/ClusterTab.jsx'
import InsightsTab from './components/tabs/InsightsTab.jsx'
import ScoutTab from './components/tabs/ScoutTab.jsx'
import FilterSelect from './components/common/FilterSelect.jsx'
import SoccerBall from './components/common/SoccerBall.jsx'

// ─── Train ML models once at module load ──────────────────────────────────────
const nn = new NeuralNetwork()
nn.train(players, 160, 0.015, 0.9)

const kmeans = new KMeans(4)
kmeans.fit(players)
const clusterLabels = kmeans.getLabels()

const pca = new PCA()
pca.fit(players)
const pcaData = pca.transform(players)

const anomalyDetector = new AnomalyDetector()
const analyzedPlayers = anomalyDetector.analyze(players, nn)

const featureImportance = computeFeatureImportance(nn, players)

const classifier = new TransferRiskClassifier()
classifier.train(players)

// Sample ~600 players for the predicted-vs-actual scatter (every 4th player)
const predVsActual = players
  .filter((_, i) => i % 4 === 0)
  .map(p => ({
    actual: +p.market_value.toFixed(1),
    predicted: +nn.predict(p).toFixed(1),
    name: p.name,
    rating: p.overall_rating,
  }))

const mlResults = {
  lossHistory: nn.lossHistory,
  metrics: nn.getMetrics(players),
  featureImportance,
  classifier,
  nn,
  predVsActual,
}

// ─── Tabs config ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',    label: '📊 Overview' },
  { id: 'market',      label: '💰 Market Analysis' },
  { id: 'ml',          label: '🧠 ML Models' },
  { id: 'predictor',   label: '🔮 Value Predictor' },
  { id: 'comparison',  label: '⚖️ Comparison' },
  { id: 'clusters',    label: '🎯 Clustering' },
  { id: 'insights',    label: '💡 Insights' },
  { id: 'scout',       label: '🔍 Scout' },
]

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function FIFAAnalyticsDashboard() {
  const navRef = useRef(null)
  const [activeTab, setActiveTab]           = useState('overview')
  const [selectedClub, setSelectedClub]     = useState('all')
  const [selectedPosition, setSelectedPosition] = useState('all')
  const [ageRange, setAgeRange]             = useState([17, 39])
  const [animatedValue, setAnimatedValue]   = useState(0)

  // ── Filtered players ──────────────────────────────────────────────────────
  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      if (selectedClub !== 'all' && p.club !== selectedClub) return false
      if (selectedPosition !== 'all' && p.position !== selectedPosition) return false
      if (p.age < ageRange[0] || p.age > ageRange[1]) return false
      return true
    })
  }, [selectedClub, selectedPosition, ageRange])

  // ── Animate average value ─────────────────────────────────────────────────
  useEffect(() => {
    const target = filteredPlayers.length > 0
      ? mean(filteredPlayers.map(p => p.market_value))
      : 0
    const start = animatedValue
    const startTime = Date.now()
    const animate = () => {
      const t = Math.min((Date.now() - startTime) / 800, 1)
      const eased = 1 - (1 - t) ** 3
      setAnimatedValue(start + (target - start) * eased)
      if (t < 1) requestAnimationFrame(animate)
    }
    animate()
  }, [filteredPlayers]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Analytics ─────────────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const values   = filteredPlayers.map(p => p.market_value)
    const ages     = filteredPlayers.map(p => p.age)
    const ratings  = filteredPlayers.map(p => p.overall_rating)

    // Age distribution (5-year bins)
    const ageBins = _.groupBy(filteredPlayers, p => Math.floor(p.age / 5) * 5)
    const ageDistribution = Object.entries(ageBins)
      .map(([age, ps]) => ({
        ageGroup: `${age}–${parseInt(age) + 4}`,
        count:    ps.length,
        avgValue: mean(ps.map(p => p.market_value)),
        avgRating: mean(ps.map(p => p.overall_rating)),
      }))
      .sort((a, b) => parseInt(a.ageGroup) - parseInt(b.ageGroup))

    // Club stats
    const clubGroups = _.groupBy(filteredPlayers, 'club')
    const clubComparison = Object.entries(clubGroups).map(([club, ps]) => ({
      club,
      avgValue:    mean(ps.map(p => p.market_value)),
      avgRating:   mean(ps.map(p => p.overall_rating)),
      playerCount: ps.length,
      avgAge:      mean(ps.map(p => p.age)),
      totalGoals:  _.sumBy(ps, 'goals'),
    })).sort((a, b) => b.avgValue - a.avgValue)

    // Transfer risk counts
    const riskDistribution = _.countBy(filteredPlayers, 'transfer_risk')

    // Position stats
    const posGroups = _.groupBy(filteredPlayers, 'position')
    const positionAnalysis = Object.entries(posGroups).map(([position, ps]) => ({
      position,
      avgValue:       mean(ps.map(p => p.market_value)),
      avgRating:      mean(ps.map(p => p.overall_rating)),
      count:          ps.length,
      goalsPerMatch:  mean(ps.map(p => p.matches_played > 0 ? p.goals / p.matches_played : 0)),
      assistsPerMatch: mean(ps.map(p => p.matches_played > 0 ? p.assists / p.matches_played : 0)),
    }))

    // Pearson correlations
    const correlations = {
      ageValue:    correlation(ages,    values),
      ratingValue: correlation(ratings, values),
      ageRating:   correlation(ages,    ratings),
    }

    return {
      totalPlayers:    filteredPlayers.length,
      avgValue:        values.length > 0 ? mean(values) : 0,
      avgRating:       ratings.length > 0 ? mean(ratings) : 0,
      ageDistribution,
      clubComparison,
      riskDistribution,
      positionAnalysis,
      correlations,
    }
  }, [filteredPlayers])

  // ── Clubs & positions for filter dropdowns ────────────────────────────────
  const allClubs     = useMemo(() => [...new Set(players.map(p => p.club))].sort(), [])
  const allPositions = useMemo(() => [...new Set(players.map(p => p.position))].sort(), [])

  // ── Cluster labels for filtered players ──────────────────────────────────
  const filteredClusterLabels = useMemo(() => {
    return filteredPlayers.map(p => {
      const idx = players.findIndex(q => q.id === p.id)
      return idx >= 0 ? clusterLabels[idx] : 0
    })
  }, [filteredPlayers])

  const filteredPcaData = useMemo(() => {
    return filteredPlayers.map(p => {
      const idx = players.findIndex(q => q.id === p.id)
      return idx >= 0 ? pcaData[idx] : { pc1: 0, pc2: 0 }
    })
  }, [filteredPlayers])

  // ── Tab renderer ─────────────────────────────────────────────────────────
  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            filteredPlayers={filteredPlayers}
            analytics={analytics}
            animatedValue={animatedValue}
          />
        )
      case 'market':
        return (
          <MarketAnalysisTab
            filteredPlayers={filteredPlayers}
            analytics={analytics}
          />
        )
      case 'ml':
        return <MLModelsTab mlResults={mlResults} />
      case 'predictor':
        return <PredictorTab nn={nn} />
      case 'comparison':
        return <ComparisonTab filteredPlayers={filteredPlayers} />
      case 'clusters':
        return (
          <ClusterTab
            filteredPlayers={filteredPlayers}
            kmeans={kmeans}
            pcaData={filteredPcaData}
            clusterLabels={filteredClusterLabels}
          />
        )
      case 'insights':
        return (
          <InsightsTab
            mlResults={mlResults}
            analyzedPlayers={analyzedPlayers}
            allPlayers={players}
            featureImportance={featureImportance}
          />
        )
      case 'scout':
        return (
          <ScoutTab
            analyzedPlayers={analyzedPlayers}
            allPlayers={players}
            pcaData={pcaData}
            clusterLabels={clusterLabels}
          />
        )
      default:
        return null
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      color: '#e2e8f0',
    }}>
      {/* ── Header + Navigation (merged) ───────────────────────────────── */}
      <header
        ref={navRef}
        style={{
          background: 'linear-gradient(180deg, #000000 0%, #050d18 55%, rgba(15,23,42,0.98) 100%)',
          backgroundImage: `
            linear-gradient(rgba(34,197,94,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.025) 1px, transparent 1px),
            linear-gradient(180deg, #000000 0%, #050d18 55%, rgba(15,23,42,0.98) 100%)
          `,
          backgroundSize: '48px 48px, 48px 48px, 100% 100%',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(34,197,94,0.2)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          overflow: 'hidden',
        }}
      >
        <style>{`
          @keyframes badgeGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(34,197,94,0.3), inset 0 0 12px rgba(34,197,94,0.08); }
            50%       { box-shadow: 0 0 35px rgba(34,197,94,0.5), inset 0 0 20px rgba(34,197,94,0.15); }
          }
        `}</style>

        <SoccerBall navRef={navRef} />

        <div style={{
          padding: '10px 40px',
          maxWidth: 1600,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          position: 'relative',
          zIndex: 1,
        }}>

          {/* ── Brand ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #166534, #052e16 80%)',
              border: '2px solid rgba(34,197,94,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
              animation: 'badgeGlow 3s ease-in-out infinite',
            }}>⚽</div>

            <span style={{
              fontSize: 32, fontWeight: 900, letterSpacing: '-2px',
              background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 35%, #86efac 70%, #dcfce7 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase', lineHeight: 1,
            }}>FIFA</span>
          </div>

          {/* ── Divider ────────────────────────────────────────────────── */}
          <div style={{ width: 1, height: 28, background: 'rgba(100,116,139,0.3)', flexShrink: 0 }} />

          {/* ── Tab buttons ────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 3, flex: 1 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, #f97316, #ea580c)'
                    : 'transparent',
                  color: activeTab === tab.id ? '#fff' : '#94a3b8',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Scoreboard stat panels ─────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'stretch', flexShrink: 0 }}>
            {[
              { sublabel: 'Squad',   value: analytics.totalPlayers,          color: '#3b82f6', accent: 'rgba(59,130,246,0.12)'  },
              { sublabel: 'Avg Val', value: `€${animatedValue.toFixed(1)}M`, color: '#f97316', accent: 'rgba(249,115,22,0.12)'  },
              { sublabel: 'Rating',  value: analytics.avgRating.toFixed(1),  color: '#eab308', accent: 'rgba(234,179,8,0.12)'   },
            ].map((stat, i) => (
              <div key={stat.sublabel} style={{
                padding: '6px 18px',
                background: stat.accent,
                borderTop: `2.5px solid ${stat.color}`,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                borderLeft:  i === 0 ? `1px solid rgba(255,255,255,0.1)` : '1px solid rgba(255,255,255,0.05)',
                borderRight: i === 2 ? `1px solid rgba(255,255,255,0.1)` : '1px solid rgba(255,255,255,0.05)',
                borderRadius: i === 0 ? '8px 0 0 8px' : i === 2 ? '0 8px 8px 0' : 0,
                textAlign: 'center', minWidth: 80,
              }}>
                <div style={{
                  fontSize: 10, color: stat.color, textTransform: 'uppercase',
                  letterSpacing: '2px', marginBottom: 2, fontWeight: 600,
                }}>{stat.sublabel}</div>
                <div style={{
                  fontSize: 20, fontWeight: 800, color: '#f1f5f9',
                  fontFamily: 'monospace', letterSpacing: '-0.5px', lineHeight: 1,
                }}>{stat.value}</div>
              </div>
            ))}
          </div>

        </div>
      </header>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(30,41,59,0.3)',
        padding: '14px 40px',
        borderBottom: '1px solid rgba(100,116,139,0.1)',
      }}>
        <div style={{ display: 'flex', gap: 24, maxWidth: 1600, margin: '0 auto', alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterSelect
            label="Club"
            value={selectedClub}
            onChange={setSelectedClub}
            options={allClubs}
          />
          <FilterSelect
            label="Position"
            value={selectedPosition}
            onChange={setSelectedPosition}
            options={allPositions}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            <span style={{ color: '#64748b', fontSize: 12 }}>Age:</span>
            <input
              type="range" min={17} max={39} value={ageRange[0]}
              onChange={e => setAgeRange([+e.target.value, ageRange[1]])}
              style={{ width: 80, accentColor: '#f97316' }}
            />
            <span style={{ color: '#f97316', fontFamily: 'monospace', fontSize: 13 }}>{ageRange[0]}</span>
            <span style={{ color: '#64748b' }}>–</span>
            <span style={{ color: '#f97316', fontFamily: 'monospace', fontSize: 13 }}>{ageRange[1]}</span>
            <input
              type="range" min={17} max={39} value={ageRange[1]}
              onChange={e => setAgeRange([ageRange[0], +e.target.value])}
              style={{ width: 80, accentColor: '#f97316' }}
            />
          </div>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main style={{ padding: '28px 40px', maxWidth: 1600, margin: '0 auto' }}>
        {renderTab()}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{
        background: 'rgba(15,23,42,0.8)',
        padding: '20px 40px',
        borderTop: '1px solid rgba(100,116,139,0.2)',
        textAlign: 'center',
      }}>
        <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
          FIFA Analytics Dashboard · React + Recharts · 2,800 Players · Neural Network (3-layer MLP) · K-Means Clustering · PCA
        </p>
      </footer>
    </div>
  )
}
