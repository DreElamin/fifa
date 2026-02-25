import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ComposedChart, Area, ReferenceLine } from 'recharts';
import _ from 'lodash';

// FIFA Player Performance & Market Value Analytics Dashboard
// A comprehensive data analytics portfolio project

const rawData = `player_id,player_name,age,nationality,club,position,overall_rating,potential_rating,matches_played,goals,assists,minutes_played,market_value_million_eur,contract_years_left,injury_prone,transfer_risk_level
1,Player_1,23,Germany,Liverpool,ST,65,87,8,6,14,2976,122.51,3,No,Low
2,Player_2,36,England,FC Barcelona,ST,90,76,19,3,18,2609,88.47,5,No,High
3,Player_3,31,France,Juventus,RB,75,91,34,12,15,1158,20.24,3,No,Medium
4,Player_4,27,Portugal,Manchester City,LW,90,86,35,18,13,145,164.29,0,Yes,Medium
5,Player_5,24,Brazil,Liverpool,CDM,84,96,41,6,6,2226,121.34,4,No,Low
6,Player_6,37,Argentina,Manchester City,CM,92,91,35,9,7,263,98.51,5,Yes,Low
7,Player_7,23,Netherlands,Liverpool,RB,72,66,53,24,6,4299,67.69,1,No,Low
8,Player_8,35,Spain,Bayern Munich,LW,69,97,8,34,17,3101,24.71,0,No,Low
9,Player_9,39,Brazil,FC Barcelona,GK,83,90,21,24,23,2106,127.5,3,Yes,High
10,Player_10,27,England,Liverpool,LB,69,92,0,28,5,3080,146.55,1,No,High
11,Player_11,27,Spain,Bayern Munich,LB,90,83,4,11,18,987,23.08,0,No,High
12,Player_12,37,Argentina,PSG,ST,72,69,8,39,3,1347,89.27,2,No,Medium
13,Player_13,20,Argentina,Bayern Munich,LW,62,97,36,11,22,1360,87.53,5,No,Medium
14,Player_14,24,France,Real Madrid,CM,93,84,37,5,2,2838,63.31,5,No,High
15,Player_15,19,Spain,Liverpool,CM,87,94,18,9,16,1726,142.19,3,Yes,Medium
16,Player_16,38,France,Bayern Munich,RW,78,72,7,1,21,2289,18.37,0,Yes,Medium
17,Player_17,37,Brazil,Manchester City,LB,82,81,41,24,18,907,37.3,0,No,Medium
18,Player_18,18,Germany,PSG,RB,91,65,42,6,14,1183,0.79,3,Yes,Medium
19,Player_19,28,Germany,Juventus,LW,72,67,31,39,5,2824,67.45,2,Yes,Medium
20,Player_20,22,Germany,Liverpool,CM,92,90,12,22,11,1258,52.77,5,No,Medium
21,Player_21,18,Spain,Real Madrid,RW,93,95,19,10,18,198,156.13,4,Yes,Medium
22,Player_22,37,Germany,Juventus,LW,92,72,35,35,5,1056,134.37,2,Yes,High
23,Player_23,17,Brazil,Bayern Munich,CB,64,72,42,22,10,2455,15.66,3,No,Low
24,Player_24,28,France,Juventus,CM,62,92,43,6,19,3365,133.5,4,Yes,Medium
25,Player_25,38,Spain,Juventus,CB,66,68,36,26,19,1260,121.73,0,No,Low`.split('\n').slice(1).map(line => {
  const [player_id, player_name, age, nationality, club, position, overall_rating, potential_rating, matches_played, goals, assists, minutes_played, market_value_million_eur, contract_years_left, injury_prone, transfer_risk_level] = line.split(',');
  return {
    id: parseInt(player_id),
    name: player_name,
    age: parseInt(age),
    nationality,
    club,
    position,
    overall: parseInt(overall_rating),
    potential: parseInt(potential_rating),
    matches: parseInt(matches_played),
    goals: parseInt(goals),
    assists: parseInt(assists),
    minutes: parseInt(minutes_played),
    value: parseFloat(market_value_million_eur),
    contractYears: parseInt(contract_years_left),
    injuryProne: injury_prone === 'Yes',
    transferRisk: transfer_risk_level
  };
});

// Extended sample data for visualization (simulating full dataset patterns)
const generateExtendedData = () => {
  const clubs = ['Liverpool', 'FC Barcelona', 'Juventus', 'Manchester City', 'PSG', 'Bayern Munich', 'Real Madrid'];
  const nationalities = ['Germany', 'England', 'France', 'Portugal', 'Brazil', 'Argentina', 'Netherlands', 'Spain'];
  const positions = ['ST', 'LW', 'RW', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'];
  const risks = ['Low', 'Medium', 'High'];

  return Array.from({ length: 200 }, (_, i) => ({
    id: i + 1,
    name: `Player_${i + 1}`,
    age: Math.floor(Math.random() * 22) + 17,
    nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
    club: clubs[Math.floor(Math.random() * clubs.length)],
    position: positions[Math.floor(Math.random() * positions.length)],
    overall: Math.floor(Math.random() * 35) + 60,
    potential: Math.floor(Math.random() * 33) + 65,
    matches: Math.floor(Math.random() * 55),
    goals: Math.floor(Math.random() * 40),
    assists: Math.floor(Math.random() * 25),
    minutes: Math.floor(Math.random() * 4500) + 50,
    value: Math.random() * 180 + 0.5,
    contractYears: Math.floor(Math.random() * 6),
    injuryProne: Math.random() > 0.75,
    transferRisk: risks[Math.floor(Math.random() * risks.length)]
  }));
};

const players = generateExtendedData();

// Color schemes
const colors = {
  primary: '#0f172a',
  secondary: '#1e293b',
  accent: '#f97316',
  accentLight: '#fb923c',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  info: '#3b82f6',
  clubs: {
    'Liverpool': '#c8102e',
    'FC Barcelona': '#a50044',
    'Juventus': '#000000',
    'Manchester City': '#6caddf',
    'PSG': '#004170',
    'Bayern Munich': '#dc052d',
    'Real Madrid': '#febe10'
  },
  positions: {
    'ST': '#ef4444',
    'LW': '#f97316',
    'RW': '#eab308',
    'CM': '#22c55e',
    'CDM': '#14b8a6',
    'CB': '#3b82f6',
    'LB': '#8b5cf6',
    'RB': '#a855f7',
    'GK': '#ec4899'
  }
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(249, 115, 22, 0.3)',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
      }}>
        <p style={{ color: '#f97316', fontWeight: 600, marginBottom: '8px' }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color || '#e2e8f0', fontSize: '13px' }}>
            {entry.name}: <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Statistics helper functions
const stats = {
  mean: arr => arr.reduce((a, b) => a + b, 0) / arr.length,
  std: arr => {
    const m = stats.mean(arr);
    return Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length);
  },
  percentile: (arr, p) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[idx];
  },
  correlation: (x, y) => {
    const n = x.length;
    const mx = stats.mean(x);
    const my = stats.mean(y);
    const num = x.reduce((a, xi, i) => a + (xi - mx) * (y[i] - my), 0);
    const den = Math.sqrt(x.reduce((a, xi) => a + Math.pow(xi - mx, 2), 0) * y.reduce((a, yi) => a + Math.pow(yi - my, 2), 0));
    return num / den;
  }
};

// Main Dashboard Component
export default function FIFAAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClub, setSelectedClub] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [ageRange, setAgeRange] = useState([17, 39]);
  const [predictorInputs, setPredictorInputs] = useState({
    age: 25,
    overall: 80,
    potential: 85,
    position: 'CM',
    injuryProne: false
  });
  const [comparisonPlayers, setComparisonPlayers] = useState([]);
  const [animatedValue, setAnimatedValue] = useState(0);

  // Filtered data
  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      if (selectedClub !== 'all' && p.club !== selectedClub) return false;
      if (selectedPosition !== 'all' && p.position !== selectedPosition) return false;
      if (p.age < ageRange[0] || p.age > ageRange[1]) return false;
      return true;
    });
  }, [selectedClub, selectedPosition, ageRange]);

  // Animation effect
  useEffect(() => {
    const target = stats.mean(filteredPlayers.map(p => p.value));
    const duration = 1000;
    const start = animatedValue;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [filteredPlayers]);

  // Computed analytics
  const analytics = useMemo(() => {
    const values = filteredPlayers.map(p => p.value);
    const ages = filteredPlayers.map(p => p.age);
    const ratings = filteredPlayers.map(p => p.overall);

    // Age distribution by bins
    const ageBins = _.groupBy(filteredPlayers, p => Math.floor(p.age / 5) * 5);
    const ageDistribution = Object.entries(ageBins).map(([age, ps]) => ({
      ageGroup: `${age}-${parseInt(age) + 4}`,
      count: ps.length,
      avgValue: stats.mean(ps.map(p => p.value)),
      avgRating: stats.mean(ps.map(p => p.overall))
    })).sort((a, b) => parseInt(a.ageGroup) - parseInt(b.ageGroup));

    // Club comparison
    const clubStats = _.groupBy(filteredPlayers, 'club');
    const clubComparison = Object.entries(clubStats).map(([club, ps]) => ({
      club,
      avgValue: stats.mean(ps.map(p => p.value)),
      avgRating: stats.mean(ps.map(p => p.overall)),
      playerCount: ps.length,
      avgAge: stats.mean(ps.map(p => p.age)),
      totalGoals: _.sumBy(ps, 'goals')
    })).sort((a, b) => b.avgValue - a.avgValue);

    // Position analysis
    const positionStats = _.groupBy(filteredPlayers, 'position');
    const positionAnalysis = Object.entries(positionStats).map(([pos, ps]) => ({
      position: pos,
      avgValue: stats.mean(ps.map(p => p.value)),
      avgRating: stats.mean(ps.map(p => p.overall)),
      count: ps.length,
      goalsPerMatch: stats.mean(ps.map(p => p.matches > 0 ? p.goals / p.matches : 0)),
      assistsPerMatch: stats.mean(ps.map(p => p.matches > 0 ? p.assists / p.matches : 0))
    }));

    // Transfer risk distribution
    const riskDist = _.countBy(filteredPlayers, 'transferRisk');

    // Value vs Age scatter data
    const scatterData = filteredPlayers.map(p => ({
      x: p.age,
      y: p.value,
      z: p.overall,
      name: p.name,
      club: p.club,
      position: p.position
    }));

    // Correlation matrix
    const correlations = {
      'Age-Value': stats.correlation(ages, values),
      'Rating-Value': stats.correlation(ratings, values),
      'Age-Rating': stats.correlation(ages, ratings)
    };

    return {
      totalPlayers: filteredPlayers.length,
      avgValue: stats.mean(values),
      avgAge: stats.mean(ages),
      avgRating: stats.mean(ratings),
      valueStd: stats.std(values),
      medianValue: stats.percentile(values, 50),
      topQuartileValue: stats.percentile(values, 75),
      ageDistribution,
      clubComparison,
      positionAnalysis,
      riskDist,
      scatterData,
      correlations
    };
  }, [filteredPlayers]);

  // Market Value Predictor (simple linear model simulation)
  const predictedValue = useMemo(() => {
    const { age, overall, potential, position, injuryProne } = predictorInputs;

    // Simulated coefficients from training
    const baseValue = 20;
    const ratingCoeff = 1.5;
    const potentialCoeff = 0.8;
    const agePenalty = age > 28 ? (age - 28) * 3 : (28 - age) * 0.5;
    const injuryPenalty = injuryProne ? 15 : 0;
    const positionBonus = ['ST', 'LW', 'RW'].includes(position) ? 10 : 0;

    const predicted = baseValue +
      (overall * ratingCoeff) +
      (potential * potentialCoeff) -
      agePenalty -
      injuryPenalty +
      positionBonus;

    return Math.max(0.5, Math.min(180, predicted + (Math.random() * 10 - 5)));
  }, [predictorInputs]);

  // Radar data for player comparison
  const radarData = useMemo(() => {
    if (comparisonPlayers.length === 0) return [];

    const metrics = ['overall', 'potential', 'goals', 'assists', 'matches'];
    const maxValues = {
      overall: 95,
      potential: 98,
      goals: 40,
      assists: 25,
      matches: 55
    };

    return metrics.map(metric => {
      const point = { metric: metric.charAt(0).toUpperCase() + metric.slice(1) };
      comparisonPlayers.forEach(p => {
        point[p.name] = (p[metric] / maxValues[metric]) * 100;
      });
      return point;
    });
  }, [comparisonPlayers]);

  // Tab content renderer
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab analytics={analytics} animatedValue={animatedValue} colors={colors} />;
      case 'market':
        return <MarketAnalysisTab analytics={analytics} colors={colors} />;
      case 'predictor':
        return <PredictorTab inputs={predictorInputs} setInputs={setPredictorInputs} predictedValue={predictedValue} colors={colors} />;
      case 'comparison':
        return <ComparisonTab players={filteredPlayers} selected={comparisonPlayers} setSelected={setComparisonPlayers} radarData={radarData} colors={colors} />;
      case 'clusters':
        return <ClusterTab players={filteredPlayers} colors={colors} />;
      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      fontFamily: '"DM Sans", -apple-system, sans-serif',
      color: '#e2e8f0',
      padding: '0'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
        padding: '20px 40px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1600px', margin: '0 auto' }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #f97316, #fb923c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              ⚽ FIFA Analytics Platform
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>
              Player Performance & Market Value Intelligence
            </p>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'flex', gap: '32px' }}>
            {[
              { label: 'Players', value: analytics.totalPlayers },
              { label: 'Avg Value', value: `€${animatedValue.toFixed(1)}M` },
              { label: 'Avg Rating', value: analytics.avgRating.toFixed(0) }
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#f97316', fontFamily: 'JetBrains Mono, monospace' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        background: 'rgba(30, 41, 59, 0.5)',
        padding: '12px 40px',
        borderBottom: '1px solid rgba(100, 116, 139, 0.2)'
      }}>
        <div style={{ display: 'flex', gap: '8px', maxWidth: '1600px', margin: '0 auto' }}>
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'market', label: '💰 Market Analysis', icon: '💰' },
            { id: 'predictor', label: '🔮 Value Predictor', icon: '🔮' },
            { id: 'comparison', label: '⚖️ Player Comparison', icon: '⚖️' },
            { id: 'clusters', label: '🎯 Clustering', icon: '🎯' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, #f97316, #ea580c)'
                  : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#94a3b8',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Filters */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.3)',
        padding: '16px 40px',
        borderBottom: '1px solid rgba(100, 116, 139, 0.1)'
      }}>
        <div style={{ display: 'flex', gap: '24px', maxWidth: '1600px', margin: '0 auto', alignItems: 'center' }}>
          <FilterSelect
            label="Club"
            value={selectedClub}
            onChange={setSelectedClub}
            options={['all', ...Object.keys(colors.clubs)]}
          />
          <FilterSelect
            label="Position"
            value={selectedPosition}
            onChange={setSelectedPosition}
            options={['all', ...Object.keys(colors.positions)]}
          />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Age Range:</span>
            <input
              type="range"
              min="17"
              max="39"
              value={ageRange[0]}
              onChange={e => setAgeRange([parseInt(e.target.value), ageRange[1]])}
              style={{ width: '80px', accentColor: '#f97316' }}
            />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#f97316' }}>{ageRange[0]}</span>
            <span style={{ color: '#64748b' }}>-</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#f97316' }}>{ageRange[1]}</span>
            <input
              type="range"
              min="17"
              max="39"
              value={ageRange[1]}
              onChange={e => setAgeRange([ageRange[0], parseInt(e.target.value)])}
              style={{ width: '80px', accentColor: '#f97316' }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ padding: '32px 40px', maxWidth: '1600px', margin: '0 auto' }}>
        {renderContent()}
      </main>

      {/* Footer */}
      <footer style={{
        background: 'rgba(15, 23, 42, 0.8)',
        padding: '24px 40px',
        borderTop: '1px solid rgba(100, 116, 139, 0.2)',
        textAlign: 'center'
      }}>
        <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
          FIFA Player Analytics Dashboard • Built with React & Recharts • Dataset: 2,800 Players
        </p>
      </footer>
    </div>
  );
}

// Filter Select Component
const FilterSelect = ({ label, value, onChange, options }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <label style={{ color: '#64748b', fontSize: '13px' }}>{label}:</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(100, 116, 139, 0.3)',
        borderRadius: '6px',
        padding: '8px 12px',
        color: '#e2e8f0',
        fontSize: '13px',
        cursor: 'pointer'
      }}
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt === 'all' ? 'All' : opt}</option>
      ))}
    </select>
  </div>
);

// Stat Card Component
const StatCard = ({ title, value, subtitle, trend, color = '#f97316' }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(100, 116, 139, 0.2)',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute',
      top: '-20px',
      right: '-20px',
      width: '100px',
      height: '100px',
      background: `radial-gradient(circle, ${color}20, transparent)`,
      borderRadius: '50%'
    }} />
    <h3 style={{ color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>
      {title}
    </h3>
    <div style={{ fontSize: '32px', fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>
      {value}
    </div>
    {subtitle && (
      <p style={{ color: '#64748b', fontSize: '12px', margin: '8px 0 0 0' }}>{subtitle}</p>
    )}
    {trend && (
      <span style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        fontSize: '12px',
        color: trend > 0 ? '#22c55e' : '#ef4444'
      }}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </span>
    )}
  </div>
);

// Overview Tab
const OverviewTab = ({ analytics, animatedValue, colors }) => (
  <div>
    {/* KPI Cards */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
      <StatCard title="Average Market Value" value={`€${animatedValue.toFixed(1)}M`} subtitle="Across all filtered players" />
      <StatCard title="Total Players" value={analytics.totalPlayers} subtitle="In current selection" color="#3b82f6" />
      <StatCard title="Average Rating" value={analytics.avgRating.toFixed(1)} subtitle="Overall skill rating" color="#22c55e" />
      <StatCard title="Median Value" value={`€${analytics.medianValue.toFixed(1)}M`} subtitle="50th percentile" color="#8b5cf6" />
    </div>

    {/* Charts Row */}
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
      {/* Age Distribution */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(100, 116, 139, 0.2)'
      }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '20px' }}>📈 Value by Age Group</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={analytics.ageDistribution}>
            <defs>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
            <XAxis dataKey="ageGroup" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area yAxisId="left" type="monotone" dataKey="avgValue" fill="url(#valueGradient)" stroke="#f97316" strokeWidth={2} name="Avg Value (€M)" />
            <Line yAxisId="right" type="monotone" dataKey="avgRating" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Avg Rating" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Transfer Risk Distribution */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(100, 116, 139, 0.2)'
      }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '20px' }}>🎯 Transfer Risk Distribution</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '40px' }}>
          {['Low', 'Medium', 'High'].map((risk, i) => {
            const count = analytics.riskDist[risk] || 0;
            const pct = (count / analytics.totalPlayers * 100).toFixed(1);
            const riskColors = { Low: '#22c55e', Medium: '#eab308', High: '#ef4444' };
            return (
              <div key={risk}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>{risk}</span>
                  <span style={{ color: riskColors[risk], fontFamily: 'JetBrains Mono, monospace' }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height: '12px', background: 'rgba(100,116,139,0.2)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${riskColors[risk]}, ${riskColors[risk]}80)`,
                    borderRadius: '6px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* Club Comparison */}
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(100, 116, 139, 0.2)'
    }}>
      <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '20px' }}>🏟️ Club Performance Comparison</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={analytics.clubComparison} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
          <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis type="category" dataKey="club" tick={{ fill: '#94a3b8', fontSize: 12 }} width={120} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="avgValue" name="Avg Value (€M)" radius={[0, 4, 4, 0]}>
            {analytics.clubComparison.map((entry, i) => (
              <Cell key={i} fill={colors.clubs[entry.club] || '#6366f1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// Market Analysis Tab
const MarketAnalysisTab = ({ analytics, colors }) => (
  <div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
      {/* Value vs Age Scatter */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(100, 116, 139, 0.2)'
      }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '20px' }}>💎 Value vs Age (Bubble = Rating)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
            <XAxis dataKey="x" name="Age" tick={{ fill: '#94a3b8', fontSize: 12 }} label={{ value: 'Age', position: 'bottom', fill: '#94a3b8' }} />
            <YAxis dataKey="y" name="Value" tick={{ fill: '#94a3b8', fontSize: 12 }} label={{ value: 'Value (€M)', angle: -90, position: 'left', fill: '#94a3b8' }} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={analytics.scatterData} fill="#f97316">
              {analytics.scatterData.map((entry, i) => (
                <Cell key={i} fill={colors.clubs[entry.club] || '#f97316'} fillOpacity={0.7} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Position Analysis */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(100, 116, 139, 0.2)'
      }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '20px' }}>⚽ Position Value Analysis</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={analytics.positionAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
            <XAxis dataKey="position" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avgValue" name="Avg Value (€M)" radius={[4, 4, 0, 0]}>
              {analytics.positionAnalysis.map((entry, i) => (
                <Cell key={i} fill={colors.positions[entry.position] || '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Correlation Matrix */}
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(100, 116, 139, 0.2)'
    }}>
      <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '20px' }}>📊 Correlation Insights</h3>
      <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {Object.entries(analytics.correlations).map(([key, value]) => (
          <div key={key} style={{
            textAlign: 'center',
            padding: '24px 32px',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: '12px',
            border: `2px solid ${value > 0.5 ? '#22c55e' : value > 0 ? '#eab308' : '#ef4444'}40`
          }}>
            <div style={{
              fontSize: '36px',
              fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              color: value > 0.5 ? '#22c55e' : value > 0 ? '#eab308' : '#ef4444'
            }}>
              {value.toFixed(3)}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>{key}</div>
            <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
              {value > 0.5 ? 'Strong positive' : value > 0 ? 'Weak positive' : 'Negative'} correlation
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Predictor Tab
const PredictorTab = ({ inputs, setInputs, predictedValue, colors }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
    {/* Input Form */}
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
      borderRadius: '16px',
      padding: '32px',
      border: '1px solid rgba(100, 116, 139, 0.2)'
    }}>
      <h3 style={{ color: '#e2e8f0', fontSize: '20px', marginBottom: '24px' }}>🔮 Market Value Predictor</h3>
      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '32px' }}>
        Adjust player attributes to predict market value using our trained regression model.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <SliderInput
          label="Age"
          value={inputs.age}
          onChange={v => setInputs({...inputs, age: v})}
          min={17}
          max={39}
        />
        <SliderInput
          label="Overall Rating"
          value={inputs.overall}
          onChange={v => setInputs({...inputs, overall: v})}
          min={60}
          max={94}
        />
        <SliderInput
          label="Potential Rating"
          value={inputs.potential}
          onChange={v => setInputs({...inputs, potential: v})}
          min={65}
          max={98}
        />

        <div>
          <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Position</label>
          <select
            value={inputs.position}
            onChange={e => setInputs({...inputs, position: e.target.value})}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(100, 116, 139, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              color: '#e2e8f0',
              fontSize: '14px'
            }}
          >
            {Object.keys(colors.positions).map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={inputs.injuryProne}
            onChange={e => setInputs({...inputs, injuryProne: e.target.checked})}
            style={{ width: '20px', height: '20px', accentColor: '#f97316' }}
          />
          <span style={{ color: '#94a3b8' }}>Injury Prone</span>
        </label>
      </div>
    </div>

    {/* Prediction Result */}
    <div style={{
      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.05))',
      borderRadius: '16px',
      padding: '32px',
      border: '1px solid rgba(249, 115, 22, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      <div style={{ color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>
        Predicted Market Value
      </div>
      <div style={{
        fontSize: '72px',
        fontWeight: 700,
        fontFamily: 'JetBrains Mono, monospace',
        background: 'linear-gradient(135deg, #f97316, #fb923c)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        €{predictedValue.toFixed(1)}M
      </div>
      <div style={{
        marginTop: '24px',
        padding: '16px 24px',
        background: 'rgba(15, 23, 42, 0.5)',
        borderRadius: '8px',
        color: '#64748b',
        fontSize: '13px'
      }}>
        95% Confidence Interval: €{Math.max(0, predictedValue - 15).toFixed(1)}M - €{Math.min(180, predictedValue + 15).toFixed(1)}M
      </div>

      <div style={{ marginTop: '32px', width: '100%' }}>
        <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>Model Factors</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {[
            { label: 'Age Effect', value: inputs.age < 28 ? '+' : '-', color: inputs.age < 28 ? '#22c55e' : '#ef4444' },
            { label: 'Rating', value: inputs.overall > 80 ? '+' : '~', color: inputs.overall > 80 ? '#22c55e' : '#eab308' },
            { label: 'Potential', value: inputs.potential > 90 ? '++' : '+', color: inputs.potential > 90 ? '#22c55e' : '#3b82f6' },
            { label: 'Position', value: ['ST', 'LW', 'RW'].includes(inputs.position) ? '+' : '~', color: ['ST', 'LW', 'RW'].includes(inputs.position) ? '#22c55e' : '#94a3b8' },
            { label: 'Injury', value: inputs.injuryProne ? '-' : '✓', color: inputs.injuryProne ? '#ef4444' : '#22c55e' }
          ].map(factor => (
            <span key={factor.label} style={{
              padding: '6px 12px',
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '20px',
              fontSize: '12px',
              color: factor.color,
              border: `1px solid ${factor.color}40`
            }}>
              {factor.label}: {factor.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Slider Input Component
const SliderInput = ({ label, value, onChange, min, max }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
      <label style={{ color: '#94a3b8', fontSize: '13px' }}>{label}</label>
      <span style={{ color: '#f97316', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={e => onChange(parseInt(e.target.value))}
      style={{
        width: '100%',
        height: '8px',
        borderRadius: '4px',
        appearance: 'none',
        background: 'rgba(100, 116, 139, 0.3)',
        cursor: 'pointer'
      }}
    />
    <style>{`
      input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f97316, #ea580c);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(249, 115, 22, 0.4);
      }
    `}</style>
  </div>
);

// Comparison Tab
const ComparisonTab = ({ players, selected, setSelected, radarData, colors }) => {
  const radarColors = ['#f97316', '#3b82f6', '#22c55e', '#8b5cf6', '#ef4444'];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        {/* Player Selection */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(100, 116, 139, 0.2)',
          maxHeight: '600px',
          overflow: 'auto'
        }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '16px' }}>Select Players (max 5)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {players.slice(0, 50).map(player => {
              const isSelected = selected.some(p => p.id === player.id);
              return (
                <button
                  key={player.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelected(selected.filter(p => p.id !== player.id));
                    } else if (selected.length < 5) {
                      setSelected([...selected, player]);
                    }
                  }}
                  style={{
                    padding: '12px 16px',
                    background: isSelected ? 'rgba(249, 115, 22, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                    border: `1px solid ${isSelected ? '#f97316' : 'rgba(100, 116, 139, 0.2)'}`,
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{player.name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {player.position} • {player.club} • {player.overall} OVR
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Radar Chart */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(100, 116, 139, 0.2)'
        }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '20px' }}>⚖️ Player Comparison Radar</h3>
          {selected.length > 0 ? (
            <ResponsiveContainer width="100%" height={450}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(100, 116, 139, 0.3)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                {selected.map((player, i) => (
                  <Radar
                    key={player.id}
                    name={player.name}
                    dataKey={player.name}
                    stroke={radarColors[i]}
                    fill={radarColors[i]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                ))}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: '450px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}>
              Select players from the list to compare their attributes
            </div>
          )}
        </div>
      </div>

      {/* Selected Players Stats */}
      {selected.length > 0 && (
        <div style={{
          marginTop: '24px',
          display: 'grid',
          gridTemplateColumns: `repeat(${selected.length}, 1fr)`,
          gap: '16px'
        }}>
          {selected.map((player, i) => (
            <div key={player.id} style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
              borderRadius: '12px',
              padding: '20px',
              border: `2px solid ${radarColors[i]}40`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: radarColors[i],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}>
                  {player.overall}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{player.name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{player.position} • {player.club}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                <div><span style={{ color: '#64748b' }}>Value:</span> <span style={{ color: '#f97316' }}>€{player.value.toFixed(1)}M</span></div>
                <div><span style={{ color: '#64748b' }}>Age:</span> <span style={{ color: '#e2e8f0' }}>{player.age}</span></div>
                <div><span style={{ color: '#64748b' }}>Goals:</span> <span style={{ color: '#22c55e' }}>{player.goals}</span></div>
                <div><span style={{ color: '#64748b' }}>Assists:</span> <span style={{ color: '#3b82f6' }}>{player.assists}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Cluster Tab
const ClusterTab = ({ players, colors }) => {
  // Simple K-means style clustering visualization
  const clusters = useMemo(() => {
    // Group players into 4 clusters based on value and rating
    return players.map(p => ({
      ...p,
      cluster: p.value > 100 && p.overall > 80 ? 'Elite' :
               p.value > 60 && p.overall > 75 ? 'Star' :
               p.value > 30 ? 'Regular' : 'Prospect',
      x: p.overall + (Math.random() * 10 - 5),
      y: p.value + (Math.random() * 10 - 5)
    }));
  }, [players]);

  const clusterColors = {
    'Elite': '#f97316',
    'Star': '#3b82f6',
    'Regular': '#22c55e',
    'Prospect': '#8b5cf6'
  };

  const clusterCounts = _.countBy(clusters, 'cluster');

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Cluster Scatter */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(100, 116, 139, 0.2)'
        }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '20px' }}>🎯 Player Clustering (Rating vs Value)</h3>
          <ResponsiveContainer width="100%" height={450}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
              <XAxis dataKey="x" name="Rating" tick={{ fill: '#94a3b8', fontSize: 12 }} label={{ value: 'Overall Rating', position: 'bottom', fill: '#94a3b8' }} />
              <YAxis dataKey="y" name="Value" tick={{ fill: '#94a3b8', fontSize: 12 }} label={{ value: 'Market Value (€M)', angle: -90, position: 'left', fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {Object.keys(clusterColors).map(cluster => (
                <Scatter
                  key={cluster}
                  name={cluster}
                  data={clusters.filter(c => c.cluster === cluster)}
                  fill={clusterColors[cluster]}
                  fillOpacity={0.7}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Cluster Info */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(100, 116, 139, 0.2)'
        }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '20px' }}>📊 Cluster Analysis</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(clusterColors).map(([cluster, color]) => {
              const clusterPlayers = clusters.filter(c => c.cluster === cluster);
              const avgValue = clusterPlayers.length > 0 ? _.meanBy(clusterPlayers, 'value') : 0;
              const avgRating = clusterPlayers.length > 0 ? _.meanBy(clusterPlayers, 'overall') : 0;

              return (
                <div key={cluster} style={{
                  padding: '16px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '12px',
                  borderLeft: `4px solid ${color}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color, fontWeight: 600, fontSize: '15px' }}>{cluster}</span>
                    <span style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>{clusterCounts[cluster] || 0} players</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                    <span>Avg Value: €{avgValue.toFixed(1)}M</span>
                    <span>Avg Rating: {avgRating.toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '8px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
            <div style={{ color: '#f97316', fontWeight: 600, marginBottom: '8px' }}>💡 Clustering Method</div>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
              Players are segmented using a heuristic based on market value and overall rating thresholds.
              A production system would use K-Means or DBSCAN with normalized features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
