import React from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import StatCard from '../../components/common/StatCard.jsx'
import CustomTooltip from '../../components/common/CustomTooltip.jsx'
import { colors } from '../../colors.js'
import { mean, percentile } from '../../utils/stats.js'
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
  marginBottom: 16,
  margin: '0 0 16px 0',
}

export default function OverviewTab({ filteredPlayers, analytics, animatedValue }) {
  const { ageDistribution, clubComparison, riskDistribution, totalPlayers } = analytics

  const avgRating =
    filteredPlayers.length > 0
      ? mean(filteredPlayers.map((p) => p.overall_rating))
      : 0

  const medianValue =
    filteredPlayers.length > 0
      ? percentile(filteredPlayers.map((p) => p.market_value), 50)
      : 0

  const top8Clubs = _.orderBy(clubComparison, ['avgValue'], ['desc']).slice(0, 8)

  const totalRisk =
    (riskDistribution.Low || 0) +
    (riskDistribution.Medium || 0) +
    (riskDistribution.High || 0)

  const riskPct = (key) =>
    totalRisk > 0 ? ((riskDistribution[key] || 0) / totalRisk) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stat Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}
      >
        <StatCard
          label="Avg Market Value"
          value={`€${animatedValue.toFixed(1)}M`}
          sub="Animated average across filtered players"
          color={colors.accent}
          icon="💰"
        />
        <StatCard
          label="Total Players"
          value={totalPlayers.toLocaleString()}
          sub="Players matching current filters"
          color={colors.info}
          icon="👥"
        />
        <StatCard
          label="Avg Rating"
          value={avgRating.toFixed(1)}
          sub="Overall rating average"
          color={colors.success}
          icon="⭐"
        />
        <StatCard
          label="Median Value"
          value={`€${medianValue.toFixed(1)}M`}
          sub="50th percentile market value"
          color={colors.purple}
          icon="📊"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Age Group Composed Chart */}
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Value by Age Group</p>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={ageDistribution}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.accent} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={colors.accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
              <XAxis
                dataKey="ageGroup"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(100,116,139,0.3)' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="value"
                orientation="left"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(100,116,139,0.3)' }}
                tickLine={false}
                tickFormatter={(v) => `€${v.toFixed(0)}M`}
              />
              <YAxis
                yAxisId="rating"
                orientation="right"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(100,116,139,0.3)' }}
                tickLine={false}
                domain={[60, 90]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: '#94a3b8', fontSize: 12 }}
              />
              <Area
                yAxisId="value"
                type="monotone"
                dataKey="avgValue"
                name="Avg Value (€)"
                stroke={colors.accent}
                strokeWidth={2}
                fill="url(#areaGradient)"
              />
              <Line
                yAxisId="rating"
                type="monotone"
                dataKey="avgRating"
                name="Avg Rating"
                stroke={colors.info}
                strokeWidth={2}
                dot={{ fill: colors.info, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: colors.info }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Top Clubs Horizontal Bar Chart */}
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Top Clubs by Avg Value</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={top8Clubs}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(100,116,139,0.15)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(100,116,139,0.3)' }}
                tickLine={false}
                tickFormatter={(v) => `€${v.toFixed(0)}M`}
              />
              <YAxis
                type="category"
                dataKey="club"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(100,116,139,0.3)' }}
                tickLine={false}
                width={110}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgValue" name="Avg Value (€)" radius={[0, 4, 4, 0]}>
                {top8Clubs.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors.clubs[entry.club] || colors.accent}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transfer Risk Distribution */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Transfer Risk Distribution</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          {/* Low Risk */}
          <div
            style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 10,
              padding: '20px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                color: colors.success,
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 10,
              }}
            >
              Low Risk
            </div>
            <div
              style={{
                color: colors.success,
                fontSize: 32,
                fontWeight: 700,
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              {riskDistribution.Low || 0}
            </div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>
              {riskPct('Low').toFixed(1)}% of total
            </div>
          </div>

          {/* Medium Risk */}
          <div
            style={{
              background: 'rgba(234,179,8,0.1)',
              border: '1px solid rgba(234,179,8,0.3)',
              borderRadius: 10,
              padding: '20px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                color: colors.warning,
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 10,
              }}
            >
              Medium Risk
            </div>
            <div
              style={{
                color: colors.warning,
                fontSize: 32,
                fontWeight: 700,
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              {riskDistribution.Medium || 0}
            </div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>
              {riskPct('Medium').toFixed(1)}% of total
            </div>
          </div>

          {/* High Risk */}
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              padding: '20px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                color: colors.danger,
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 10,
              }}
            >
              High Risk
            </div>
            <div
              style={{
                color: colors.danger,
                fontSize: 32,
                fontWeight: 700,
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              {riskDistribution.High || 0}
            </div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>
              {riskPct('High').toFixed(1)}% of total
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
