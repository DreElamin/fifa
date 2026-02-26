import React, { useState } from 'react'

export default function InfoIcon({ text }) {
  const [visible, setVisible] = useState(false)

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '1px solid rgba(148,163,184,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(148,163,184,0.3)',
          fontSize: 11,
          fontWeight: 700,
          fontStyle: 'italic',
          cursor: 'default',
          userSelect: 'none',
          transition: 'color 0.15s, border-color 0.15s',
        }}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        i
      </div>
      {visible && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 6,
            background: 'rgba(15,23,42,0.97)',
            border: '1px solid rgba(100,116,139,0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            color: 'rgba(148,163,184,0.75)',
            width: 270,
            lineHeight: 1.65,
            zIndex: 50,
            pointerEvents: 'none',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
          }}
        >
          {text}
        </div>
      )}
    </div>
  )
}
