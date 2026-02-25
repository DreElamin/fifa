import React, { useState, useMemo, useEffect } from 'react'
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

// ─── Train ML models once at module load ──────────────────────────────────────
const nn = new NeuralNetwork()
nn.train(players, 120, 0.01, 0.9)

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

const mlResults = {
  lossHistory: nn.lossHistory,
  metrics: nn.getMetrics(players),
  featureImportance,
  classifier,
  nn,
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
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(249,115,22,0.2)',
        padding: '20px 40px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1600, margin: '0 auto' }}>
          <div>
            <h1 style={{
              fontSize: 28, fontWeight: 700, margin: 0,
              background: 'linear-gradient(135deg, #f97316, #fb923c)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              ⚽ FIFA Analytics Platform
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '4px 0 0 0' }}>
              Player Performance &amp; Market Value Intelligence · Neural Network Powered
            </p>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 32 }}>
            {[
              { label: 'Players',   value: analytics.totalPlayers },
              { label: 'Avg Value', value: `€${animatedValue.toFixed(1)}M` },
              { label: 'Avg Rating', value: analytics.avgRating.toFixed(1) },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#f97316', fontFamily: 'monospace' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav style={{
        background: 'rgba(30,41,59,0.5)',
        padding: '10px 40px',
        borderBottom: '1px solid rgba(100,116,139,0.2)',
        overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', gap: 4, maxWidth: 1600, margin: '0 auto' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '9px 16px',
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
      </nav>

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
          FIFA Analytics Dashboard · React + Recharts · 500 Players · Neural Network (3-layer MLP) · K-Means Clustering · PCA
        </p>
      </footer>
    </div>
  )
}
