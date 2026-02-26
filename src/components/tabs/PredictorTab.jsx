import React, { useState, useMemo } from 'react'
import SliderInput from '../../components/common/SliderInput.jsx'
import FilterSelect from '../../components/common/FilterSelect.jsx'
import WaterfallChart from '../../components/charts/WaterfallChart.jsx'
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

const clamp = (val, min, max) => Math.max(min, Math.min(max, val))

const POSITIONS = ['ST', 'LW', 'RW', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK']

export default function PredictorTab({ nn }) {
  const [inputs, setInputs] = useState({
    age: 25,
    overall_rating: 78,
    potential_rating: 82,
    position: 'ST',
    injury_prone: false,
    contract_years_left: 3,
  })

  const set = (key) => (val) => setInputs((prev) => ({ ...prev, [key]: val }))

  const { linearValue, nnValue, factors } = useMemo(() => {
    const { age, overall_rating, potential_rating, position, injury_prone, contract_years_left } = inputs

    // Linear model
    const base = 20
    const ratingBonus = (overall_rating - 60) * 1.5
    const potentialBonus = (potential_rating - 65) * 0.8
    const agePenalty = age > 28 ? (age - 28) * 3 : 0
    const injuryPenalty = injury_prone ? 15 : 0
    const posBonus = ['ST', 'LW', 'RW'].includes(position) ? 10 : 0
    const linearValue = clamp(
      base + ratingBonus + potentialBonus - agePenalty - injuryPenalty + posBonus,
      0.5,
      180
    )

    // Build waterfall factors with running cumulative
    let running = 0
    const factorsRaw = [
      { label: 'Base', value: base, color: '#3b82f6' },
      { label: 'Rating', value: ratingBonus, color: ratingBonus >= 0 ? '#22c55e' : '#ef4444' },
      { label: 'Potential', value: potentialBonus, color: potentialBonus >= 0 ? '#22c55e' : '#ef4444' },
      { label: 'Age Adj.', value: -agePenalty, color: agePenalty > 0 ? '#ef4444' : '#94a3b8' },
      { label: 'Position', value: posBonus, color: posBonus > 0 ? '#f97316' : '#94a3b8' },
      { label: 'Injury', value: -injuryPenalty, color: injuryPenalty > 0 ? '#ef4444' : '#94a3b8' },
    ]
    const factors = factorsRaw.map((f) => {
      running += f.value
      return { ...f, cumulative: running }
    })

    // Neural network prediction
    let nnValue = 0
    if (nn && nn.predict) {
      try {
        nnValue = nn.predict({
          age,
          overall_rating,
          potential_rating,
          position,
          injury_prone: injury_prone ? 'Yes' : 'No',
          contract_years_left,
          market_value: 0,
        })
      } catch (e) {
        nnValue = 0
      }
    }

    return { linearValue, nnValue, factors }
  }, [inputs, nn])

  const nnDiff = nnValue - linearValue
  const diffAbs = Math.abs(nnDiff).toFixed(1)
  const diffLabel = nnDiff >= 0
    ? `+€${diffAbs}M higher than Linear`
    : `-€${diffAbs}M lower than Linear`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Input Controls */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Input Controls</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
          <SliderInput
            label="Age"
            value={inputs.age}
            min={17}
            max={39}
            onChange={set('age')}
          />
          <SliderInput
            label="Overall Rating"
            value={inputs.overall_rating}
            min={60}
            max={94}
            onChange={set('overall_rating')}
          />
          <SliderInput
            label="Potential Rating"
            value={inputs.potential_rating}
            min={65}
            max={98}
            onChange={set('potential_rating')}
          />
          <SliderInput
            label="Contract Years Left"
            value={inputs.contract_years_left}
            min={0}
            max={5}
            onChange={set('contract_years_left')}
          />
        </div>

        <div style={{ display: 'flex', gap: 32, marginTop: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <FilterSelect
            label="Position"
            value={inputs.position}
            onChange={set('position')}
            options={POSITIONS}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={inputs.injury_prone}
              onChange={(e) => setInputs((prev) => ({ ...prev, injury_prone: e.target.checked }))}
              style={{ accentColor: '#f97316', width: 16, height: 16, cursor: 'pointer' }}
            />
            <span style={{ color: '#94a3b8', fontSize: 13 }}>Injury Prone</span>
          </label>
        </div>
      </div>

      {/* Prediction Results */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Prediction Results</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Linear Model Card */}
          <div style={{
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 10,
            padding: 24,
            textAlign: 'center',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <InfoIcon text="Formula-based estimate built from 6 additive factors. Starts at a €20M base (league-average floor), then adds or subtracts: Rating bonus = (overall − 60) × 1.5, Potential bonus = (potential − 65) × 0.8, Age penalty = −€3M per year over 28, Injury penalty = −€15M if injury prone, Position premium = +€10M for ST/LW/RW. Negative bars in the breakdown chart show factors actively reducing the value." />
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Linear Model
            </div>
            <div style={{ color: '#3b82f6', fontSize: 48, fontWeight: 800, lineHeight: 1, fontFamily: 'monospace' }}>
              €{linearValue.toFixed(1)}
            </div>
            <div style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>Million</div>
          </div>

          {/* Neural Network Card */}
          <div style={{
            background: 'rgba(249,115,22,0.08)',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: 10,
            padding: 24,
            textAlign: 'center',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <InfoIcon text="Neural network prediction trained on 2,800 real players. Uses a 3-layer MLP (6 inputs → 16 → 8 → 1 output) to learn non-linear relationships the linear formula cannot capture — for example, how age and rating interact differently for a GK vs a ST. The difference shown below compares it against the linear estimate." />
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              AI Prediction
            </div>
            <div style={{ color: '#f97316', fontSize: 48, fontWeight: 800, lineHeight: 1, fontFamily: 'monospace' }}>
              {nn && nn.trained ? `€${nnValue.toFixed(1)}` : '—'}
            </div>
            <div style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>
              {nn && nn.trained ? 'Million' : 'Model not trained'}
            </div>
            {nn && nn.trained && (
              <div style={{
                marginTop: 10,
                fontSize: 12,
                color: nnDiff >= 0 ? '#22c55e' : '#ef4444',
                fontWeight: 600,
              }}>
                {diffLabel}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Value Breakdown Waterfall */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Value Breakdown</h3>
          <InfoIcon text="Waterfall chart showing how each factor contributes to the linear model's final value estimate. Each bar adds or subtracts from the running total, building up from the base value to the final predicted price." />
        </div>
        <WaterfallChart factors={factors} />
        <div style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid rgba(100,116,139,0.15)',
        }}>
          {factors.map((f) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: f.color }} />
              <span style={{ color: '#94a3b8', fontSize: 11 }}>
                {f.label}:{' '}
                <span style={{ color: f.color, fontWeight: 700 }}>
                  {f.value >= 0 ? '+' : ''}€{f.value.toFixed(1)}M
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
