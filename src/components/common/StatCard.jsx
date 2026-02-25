export default function StatCard({ label, value, sub, color = '#f97316', icon }) {
  return (
    <div style={{
      background: 'rgba(30,41,59,0.6)', border: `1px solid ${color}33`,
      borderRadius: 12, padding: '16px 20px',
      boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 ${color}22`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <p style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      </div>
      <p style={{ color, fontSize: 26, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{sub}</p>}
    </div>
  )
}
