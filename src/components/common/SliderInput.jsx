export default function SliderInput({ label, value, min, max, step = 1, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <label style={{ color: '#94a3b8', fontSize: 12 }}>{label}</label>
        <span style={{ color: '#f97316', fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#f97316', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#475569', fontSize: 10 }}>{min}</span>
        <span style={{ color: '#475569', fontSize: 10 }}>{max}</span>
      </div>
    </div>
  )
}
