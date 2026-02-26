import React, { useRef, useEffect, useState, useCallback } from 'react'

const BALL_SIZE = 32
const GRAVITY = 0.25
const FRICTION = 0.98
const BOUNCE = 0.6

export default function SoccerBall({ navRef }) {
  const [pos, setPos] = useState({ x: 60, y: 10 })
  const vel = useRef({ x: 2.5, y: 1.5 })
  const posRef = useRef({ x: 60, y: 10 })
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const lastMouse = useRef({ x: 0, y: 0 })
  const mouseVel = useRef({ x: 0, y: 0 })
  const rafId = useRef(null)
  const ballRef = useRef(null)
  const spinning = useRef(0) // degrees
  const spinVel = useRef(0)

  const getBounds = useCallback(() => {
    if (!navRef.current || !ballRef.current) return null
    const nav = navRef.current.getBoundingClientRect()
    return {
      minX: 0,
      maxX: nav.width - BALL_SIZE,
      minY: 0,
      maxY: nav.height - BALL_SIZE,
    }
  }, [navRef])

  useEffect(() => {
    const tick = () => {
      if (dragging.current) {
        rafId.current = requestAnimationFrame(tick)
        return
      }

      const bounds = getBounds()
      if (!bounds) {
        rafId.current = requestAnimationFrame(tick)
        return
      }

      let { x, y } = posRef.current
      let { x: vx, y: vy } = vel.current

      // gravity
      vy += GRAVITY

      x += vx
      y += vy

      // bounce off walls
      if (x <= bounds.minX) { x = bounds.minX; vx = Math.abs(vx) * BOUNCE; spinVel.current = vx * 3 }
      if (x >= bounds.maxX) { x = bounds.maxX; vx = -Math.abs(vx) * BOUNCE; spinVel.current = -vx * 3 }
      if (y <= bounds.minY) { y = bounds.minY; vy = Math.abs(vy) * BOUNCE }
      if (y >= bounds.maxY) {
        y = bounds.maxY
        vy = -Math.abs(vy) * BOUNCE
        vx *= FRICTION
        spinVel.current = vx * 2
        // stop tiny bounces
        if (Math.abs(vy) < 0.5) vy = 0
      }

      // air friction
      vx *= 0.999
      spinVel.current *= 0.97

      vel.current = { x: vx, y: vy }
      posRef.current = { x, y }
      spinning.current = (spinning.current + spinVel.current) % 360

      setPos({ x, y })
      rafId.current = requestAnimationFrame(tick)
    }

    rafId.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId.current)
  }, [getBounds])

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    const nav = navRef.current.getBoundingClientRect()
    dragOffset.current = {
      x: e.clientX - nav.left - posRef.current.x,
      y: e.clientY - nav.top - posRef.current.y,
    }
    lastMouse.current = { x: e.clientX, y: e.clientY }
    mouseVel.current = { x: 0, y: 0 }
    vel.current = { x: 0, y: 0 }
  }, [navRef])

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return
      const nav = navRef.current?.getBoundingClientRect()
      if (!nav) return

      mouseVel.current = {
        x: e.clientX - lastMouse.current.x,
        y: e.clientY - lastMouse.current.y,
      }
      lastMouse.current = { x: e.clientX, y: e.clientY }

      const bounds = getBounds()
      if (!bounds) return

      let newX = e.clientX - nav.left - dragOffset.current.x
      let newY = e.clientY - nav.top - dragOffset.current.y
      newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX))
      newY = Math.max(bounds.minY, Math.min(bounds.maxY, newY))

      posRef.current = { x: newX, y: newY }
      spinning.current = (spinning.current + mouseVel.current.x * 2) % 360
      spinVel.current = mouseVel.current.x * 2
      setPos({ x: newX, y: newY })
    }

    const onMouseUp = () => {
      if (!dragging.current) return
      dragging.current = false
      vel.current = {
        x: mouseVel.current.x * 0.8,
        y: mouseVel.current.y * 0.8,
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [navRef, getBounds])

  return (
    <div
      ref={ballRef}
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: BALL_SIZE,
        height: BALL_SIZE,
        cursor: dragging.current ? 'grabbing' : 'grab',
        userSelect: 'none',
        zIndex: 10,
        transform: `rotate(${spinning.current}deg)`,
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
        fontSize: BALL_SIZE,
        lineHeight: 1,
      }}
    >
      ⚽
    </div>
  )
}
