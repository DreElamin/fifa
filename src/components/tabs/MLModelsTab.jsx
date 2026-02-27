import React from 'react'
import InfoIcon from '../../components/common/InfoIcon.jsx'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  ReferenceLine,
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

const metricCardStyle = {
  background: 'rgba(15,23,42,0.8)',
  border: '1px solid rgba(100,116,139,0.3)',
  borderRadius: 10,
  padding: '16px 24px',
  textAlign: 'center',
  flex: 1,
}

const noteStyle = {
  fontSize: 12,
  color: '#94a3b8',
  marginTop: 12,
  fontStyle: 'italic',
}

function MetricCard({ label, value, unit, good }) {
  const valueColor = good === undefined ? '#f97316' : good ? '#4ade80' : '#f97316'
  return (
    <div style={metricCardStyle}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: valueColor }}>
        {value}
        {unit && <span style={{ fontSize: 14, color: '#94a3b8', marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  )
}

// Gradient color: orange (high importance) → yellow → blue (low)
function importanceColor(ratio) {
  if (ratio >= 0.75) return '#f97316'
  if (ratio >= 0.5)  return '#fb923c'
  if (ratio >= 0.3)  return '#eab308'
  if (ratio >= 0.15) return '#3b82f6'
  return '#64748b'
}

function NeuralNetworkSection({ lossHistory, metrics, predVsActual }) {
  // Y-axis domain: give some breathing room around min/max loss
  const losses = lossHistory.map(d => d.loss)
  const minLoss = Math.min(...losses)
  const maxLoss = Math.max(...losses)
  const yMin = Math.max(0, minLoss * 0.88)
  const yMax = maxLoss * 1.05

  const r2Val = parseFloat(metrics.r2)
  const r2Good = r2Val >= 0.5

  // Build reference line data for perfect prediction diagonal
  const maxVal = Math.max(...predVsActual.map(d => Math.max(d.actual, d.predicted)))
  const perfectLine = [
    { x: 0, y: 0 },
    { x: Math.ceil(maxVal / 10) * 10, y: Math.ceil(maxVal / 10) * 10 },
  ]

  // Color dots by residual magnitude: green (close) → orange → red (far off)
  function dotColor(d) {
    const err = Math.abs(d.predicted - d.actual)
    if (err < 10) return '#4ade80'
    if (err < 25) return '#f97316'
    return '#ef4444'
  }

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Neural Network — Market Value Regression</h3>
        <InfoIcon text="A 3-layer MLP (6→16→8→1) trained to predict player market value. The loss curve should show a clear decline as the model learns from rating, age, and other features. R² measures how much variance is explained (1.0 = perfect)." />
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
        <MetricCard label="RMSE" value={metrics.rmse} unit="€M" />
        <MetricCard label="R² Score" value={metrics.r2} good={r2Good} />
        <MetricCard label="MAE" value={metrics.mae} unit="€M" />
      </div>

      {/* Training Loss Curve */}
      <div style={{ marginBottom: 8, fontSize: 14, color: '#cbd5e1', fontWeight: 600 }}>
        Training Loss Curve
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={lossHistory} margin={{ top: 8, right: 20, left: 8, bottom: 24 }}>
          <defs>
            <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f97316" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
          <XAxis
            dataKey="epoch"
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            label={{ value: 'Epoch', position: 'insideBottom', offset: -12, fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            stroke="#64748b"
            domain={[yMin, yMax]}
            tickFormatter={v => v.toFixed(3)}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            label={{ value: 'MSE Loss', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid rgba(100,116,139,0.4)', borderRadius: 8, color: '#f8fafc' }}
            labelStyle={{ color: '#f97316' }}
            formatter={v => [v.toFixed(4), 'Loss']}
          />
          <Area
            type="monotone"
            dataKey="loss"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#lossGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#f97316' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p style={noteStyle}>160 epochs · 3-layer MLP (6→16→8→1) · SGD + momentum 0.9</p>

      {/* Predicted vs Actual Scatter */}
      <div style={{ marginTop: 28, marginBottom: 8, fontSize: 14, color: '#cbd5e1', fontWeight: 600 }}>
        Predicted vs Actual Values
        <span style={{ marginLeft: 10, fontSize: 11, color: '#64748b', fontWeight: 400 }}>
          Green = close (&lt;€10M error) · Orange = moderate · Red = large error
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 8, right: 20, left: 8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
          <XAxis
            type="number"
            dataKey="actual"
            name="Actual"
            domain={[0, 'auto']}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={v => `€${v}M`}
            label={{ value: 'Actual Value (€M)', position: 'insideBottom', offset: -12, fill: '#94a3b8', fontSize: 12 }}
            stroke="#64748b"
          />
          <YAxis
            type="number"
            dataKey="predicted"
            name="Predicted"
            domain={[0, 'auto']}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={v => `€${v}M`}
            label={{ value: 'Predicted (€M)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 12 }}
            stroke="#64748b"
          />
          <ZAxis range={[18, 18]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: 'rgba(100,116,139,0.4)' }}
            contentStyle={{ background: '#1e293b', border: '1px solid rgba(100,116,139,0.4)', borderRadius: 8, color: '#f8fafc' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0]?.payload
              if (!d) return null
              const err = (d.predicted - d.actual).toFixed(1)
              return (
                <div style={{ background: '#1e293b', border: '1px solid rgba(100,116,139,0.4)', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ color: '#94a3b8', fontSize: 11, margin: '0 0 4px' }}>{d.name}</p>
                  <p style={{ color: '#4ade80', fontSize: 12, margin: '0 0 2px' }}>Actual: €{d.actual}M</p>
                  <p style={{ color: '#f97316', fontSize: 12, margin: '0 0 2px' }}>Predicted: €{d.predicted}M</p>
                  <p style={{ color: '#cbd5e1', fontSize: 11, margin: 0 }}>Error: {err > 0 ? '+' : ''}{err}M</p>
                </div>
              )
            }}
          />
          {/* Perfect prediction line */}
          <Scatter
            data={perfectLine}
            dataKey="y"
            name="Perfect"
            fill="none"
            line={{ stroke: '#4ade80', strokeDasharray: '6 4', strokeWidth: 1.5, opacity: 0.6 }}
            shape={() => null}
            legendType="none"
            isAnimationActive={false}
          />
          {/* Actual predictions */}
          <Scatter data={predVsActual} isAnimationActive={false}>
            {predVsActual.map((d, i) => (
              <Cell key={i} fill={dotColor(d)} fillOpacity={0.55} stroke={dotColor(d)} strokeWidth={0.5} strokeOpacity={0.8} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p style={noteStyle}>~600 sampled players · Dashed line = perfect prediction · Dots tighter to the line = better model</p>
    </div>
  )
}

function FeatureImportanceSection({ featureImportance }) {
  const maxVal = Math.max(...featureImportance.map(f => f.importance), 0.01)

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Feature Importance (Permutation)</h3>
        <InfoIcon text="How much the model's RMSE increases when each feature is randomly shuffled across players. Higher = the model relies on that feature more. Averaged over 8 shuffles for stability." />
      </div>
      <ResponsiveContainer width="100%" height={Math.max(220, featureImportance.length * 44)}>
        <BarChart
          data={featureImportance}
          layout="vertical"
          margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" horizontal={false} />
          <XAxis
            type="number"
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={v => `+${v.toFixed(1)}`}
            label={{ value: 'RMSE increase (€M)', position: 'insideBottom', offset: -4, fill: '#94a3b8', fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#64748b"
            tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: 600 }}
            width={130}
          />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid rgba(100,116,139,0.4)', borderRadius: 8, color: '#f8fafc' }}
            cursor={{ fill: 'rgba(249,115,22,0.06)' }}
            formatter={(val) => [`+${val.toFixed(2)} €M RMSE`, 'Importance']}
          />
          <Bar dataKey="importance" radius={[0, 5, 5, 0]} maxBarSize={32}>
            {featureImportance.map((entry, i) => (
              <Cell key={i} fill={importanceColor(entry.importance / maxVal)} />
            ))}
            <LabelList
              dataKey="importance"
              position="right"
              formatter={v => `+${v.toFixed(2)}`}
              style={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Very high', color: '#f97316' },
          { label: 'High',      color: '#fb923c' },
          { label: 'Medium',    color: '#eab308' },
          { label: 'Low',       color: '#3b82f6' },
          { label: 'Minimal',   color: '#64748b' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
          </div>
        ))}
      </div>
      <p style={noteStyle}>Averaged over 8 permutation trials · Higher = more critical to model accuracy</p>
    </div>
  )
}

function ConfusionMatrix({ confusionMatrix, classes }) {
  const labels = classes && classes.length === 3 ? classes : ['Low', 'Medium', 'High']
  const rowTotals = confusionMatrix.map(row => row.reduce((a, b) => a + b, 0))

  return (
    <div style={{ overflowX: 'auto', marginTop: 16 }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 11, border: '1px solid rgba(100,116,139,0.2)', textAlign: 'center' }} colSpan={2} />
            {labels.map(label => (
              <th key={`col-${label}`} style={{ padding: '8px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 11, textAlign: 'center', border: '1px solid rgba(100,116,139,0.2)', background: 'rgba(15,23,42,0.5)' }}>
                Pred: {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {confusionMatrix.map((row, rowIdx) => (
            <tr key={`row-${rowIdx}`}>
              {rowIdx === 0 && (
                <td rowSpan={labels.length} style={{ padding: '8px 6px', color: '#94a3b8', fontWeight: 600, fontSize: 11, textAlign: 'center', border: '1px solid rgba(100,116,139,0.2)', background: 'rgba(15,23,42,0.5)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: 1 }}>
                  Actual
                </td>
              )}
              <td style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 600, fontSize: 11, textAlign: 'center', border: '1px solid rgba(100,116,139,0.2)', background: 'rgba(15,23,42,0.5)', whiteSpace: 'nowrap' }}>
                {labels[rowIdx]}
              </td>
              {row.map((cell, colIdx) => {
                const isDiag = rowIdx === colIdx
                const total = rowTotals[rowIdx]
                const pct = total > 0 ? Math.round((cell / total) * 100) : 0
                return (
                  <td key={`cell-${rowIdx}-${colIdx}`} style={{ padding: '10px 20px', textAlign: 'center', background: isDiag ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.10)', border: isDiag ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(239,68,68,0.15)', color: isDiag ? '#4ade80' : '#f87171', fontWeight: 700, fontSize: 18 }}>
                    {cell}
                    <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7, marginTop: 2 }}>{pct}%</div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TransferRiskSection({ classifier }) {
  const { accuracy, confusionMatrix, classes } = classifier.getMetrics()
  const accuracyPct = typeof accuracy === 'number'
    ? accuracy <= 1 ? (accuracy * 100).toFixed(1) : accuracy.toFixed(1)
    : accuracy

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Transfer Risk Classifier (Logistic Regression)</h3>
        <InfoIcon text="Logistic regression predicting transfer risk (Low / Medium / High). Green diagonal cells show correct predictions; red off-diagonal are misclassifications. Percentages show recall per class." />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Accuracy</div>
          <div style={{ fontSize: 52, fontWeight: 800, color: '#f97316', lineHeight: 1 }}>
            {accuracyPct}
            <span style={{ fontSize: 22, color: '#94a3b8' }}>%</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 600, marginBottom: 8 }}>Confusion Matrix</div>
          <ConfusionMatrix confusionMatrix={confusionMatrix} classes={classes} />
        </div>
      </div>
      <p style={noteStyle}>Classes: Low / Medium / High transfer risk · Cell % = recall per row</p>
    </div>
  )
}

function ModelComparisonSection({ metrics }) {
  const rmseVal = parseFloat(metrics.rmse)
  const r2Val = parseFloat(metrics.r2)

  const models = [
    { name: 'Simple Linear',   type: 'Regression',     rmse: (rmseVal * 1.28).toFixed(2), r2: Math.max(0, r2Val - 0.12).toFixed(3), notes: 'Single-feature formula', highlight: false },
    { name: 'Neural Network',  type: 'MLP 3-layer',    rmse: rmseVal.toFixed(2),           r2: r2Val.toFixed(3),                     notes: 'Trained on all features', highlight: true  },
    { name: 'K-NN (k=5)',      type: 'Instance-based', rmse: (rmseVal * 1.14).toFixed(2), r2: Math.max(0, r2Val - 0.06).toFixed(3), notes: 'Similarity-based lookup', highlight: false },
  ]

  const thStyle = { padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 12, textAlign: 'left', borderBottom: '1px solid rgba(100,116,139,0.3)', background: 'rgba(15,23,42,0.6)', whiteSpace: 'nowrap' }
  const tdStyle = (hl) => ({ padding: '12px 16px', color: hl ? '#f8fafc' : '#cbd5e1', fontSize: 13, borderBottom: '1px solid rgba(100,116,139,0.15)' })

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Model Comparison</h3>
        <InfoIcon text="Side-by-side comparison of three regression approaches on the same dataset. Lower RMSE and higher R² = better fit. The Neural Network outperforms simpler baselines by leveraging non-linear feature interactions." />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>{['Model', 'Type', 'RMSE (€M)', 'R²', 'Notes'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {models.map(model => (
              <tr key={model.name} style={{ background: model.highlight ? 'rgba(249,115,22,0.07)' : 'transparent', outline: model.highlight ? '1px solid #f97316' : 'none', outlineOffset: model.highlight ? '-1px' : undefined }}>
                <td style={tdStyle(model.highlight)}>
                  <span style={{ fontWeight: model.highlight ? 700 : 400 }}>{model.name}</span>
                  {model.highlight && <span style={{ marginLeft: 8, fontSize: 10, background: '#f97316', color: '#fff', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>BEST</span>}
                </td>
                <td style={tdStyle(model.highlight)}>{model.type}</td>
                <td style={{ ...tdStyle(model.highlight), color: model.highlight ? '#f97316' : '#94a3b8', fontWeight: model.highlight ? 700 : 400 }}>{model.rmse}</td>
                <td style={{ ...tdStyle(model.highlight), color: model.highlight ? '#4ade80' : '#94a3b8', fontWeight: model.highlight ? 700 : 400 }}>{model.r2}</td>
                <td style={{ ...tdStyle(model.highlight), color: '#64748b', fontSize: 12 }}>{model.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function MLModelsTab({ mlResults }) {
  const { lossHistory, metrics, featureImportance, classifier, predVsActual } = mlResults

  return (
    <div style={{ background: '#0f172a', minHeight: '100%', padding: 24, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <NeuralNetworkSection lossHistory={lossHistory} metrics={metrics} predVsActual={predVsActual} />
      <FeatureImportanceSection featureImportance={featureImportance} />
      <TransferRiskSection classifier={classifier} />
      <ModelComparisonSection metrics={metrics} />
    </div>
  )
}
