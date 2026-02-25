export default function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(249,115,22,0.3)',
      borderRadius: 8, padding: '10px 14px', backdropFilter: 'blur(20px)',
    }}>
      {label && <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || '#f97316', fontSize: 13, fontWeight: 600 }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
        </p>
      ))}
    </div>
  )
}
