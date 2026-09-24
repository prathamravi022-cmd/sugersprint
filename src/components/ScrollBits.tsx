import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/** Scrolls to top on every route change (focus management for a11y). */
export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

/** Golden scroll-progress bar — landing page only. */
export function ScrollProgress() {
  const { pathname } = useLocation()
  const [pct, setPct] = useState(0)

  useEffect(() => {
    if (pathname !== '/') {
      setPct(0)
      return
    }
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setPct(h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  if (pathname !== '/' || pct < 1) return null
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: 3,
        width: `${pct}%`,
        background: 'linear-gradient(90deg, #FACC15, #FFD700)',
        boxShadow: '0 0 10px rgba(255,215,0,0.7)',
        zIndex: 100,
        transition: 'width 0.15s linear',
      }}
    />
  )
}

/** Back-to-top floating button (appears after 700px of scroll). */
export function BackToTop() {
  const [show, setShow] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  if (!show) return null
  return (
    <button
      className="icon-btn"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{
        position: 'fixed',
        right: 18,
        bottom: 'calc(18px + var(--nav-h))',
        zIndex: 85,
        background: 'rgba(20,20,22,0.9)',
        backdropFilter: 'blur(10px)',
        borderColor: 'var(--gold)',
        color: 'var(--gold)',
      }}
    >
      ⬆️
    </button>
  )
}
