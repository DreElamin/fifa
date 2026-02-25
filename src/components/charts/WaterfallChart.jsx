import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, ResponsiveContainer } from 'recharts'

export default function WaterfallChart({ factors }) {
  // factors: [{label, value, cumulative, color}]
  if (!factors?.length) return null

  const CustomBar = (props) => {
    const { x, y, width, height, fill } = props
    return <rect x={x} y={y} width={width} height={height} fill={fill} rx={3} />
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={factors} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={v => `€${v}M`} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <div style={{
                background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(249,115,22,0.3)',
                borderRadius: 8, padding: '8px 12px',
              }}>
                <p style={{ color: '#94a3b8', fontSize: 11 }}>{d.label}</p>
                <p style={{ color: d.color || '#f97316', fontWeight: 700, fontSize: 13 }}>
                  {d.value >= 0 ? '+' : ''}€{d.value.toFixed(1)}M
                </p>
                <p style={{ color: '#64748b', fontSize: 11 }}>Running total: €{d.cumulative?.toFixed(1)}M</p>
              </div>
            )
          }}
        />
        <ReferenceLine y={0} stroke="rgba(100,116,139,0.4)" />
        <Bar dataKey="value" shape={<CustomBar />}>
          {factors.map((f, i) => (
            <Cell key={i} fill={f.color || (f.value >= 0 ? '#22c55e' : '#ef4444')} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
