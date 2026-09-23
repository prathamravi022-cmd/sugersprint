import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './store'
import { Landing } from './screens/Landing'
import { Dashboard } from './screens/Dashboard'
import { Capture } from './screens/Capture'
import { Caregiver } from './screens/Caregiver'
import { Report } from './screens/Report'
import { Onboarding } from './screens/Onboarding'
import { Confetti } from './components/Confetti'
import { Toasts } from './components/Toast'
import { BottomNav } from './components/BottomNav'

export default function App() {
  const user = useStore((s) => s.user)
  const sprint = useStore((s) => s.sprint)
  const toasts = useStore((s) => s.toasts)
  const confetti = useStore((s) => s.confetti)
  const pushToast = useStore((s) => s.pushToast)

  // Flush queued writes when connectivity returns (Frontend Spec §7)
  useEffect(() => {
    const onOnline = () => {
      const { pendingQueue, syncPending } = useStore.getState()
      if (pendingQueue.length > 0) void syncPending()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  // Cross-tab sync: a cheer sent from another tab (e.g. caregiver phone
  // window) rehydrates the store so confetti/status update live.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'sugarsprint-state' && e.newValue) {
        try {
          void useStore.persist.rehydrate()
        } catch {
          /* ignore malformed payloads */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (useStore.getState().pendingQueue.length > 0) {
      pushToast(`📥 ${useStore.getState().pendingQueue.length} change(s) waiting to sync`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Confetti trigger={confetti} />
      <Toasts toasts={toasts} />
      <HashRouter>
        <NavGate hasApp={Boolean(user && sprint)}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/app"
              element={!user || !sprint ? <Onboarding /> : <Dashboard />}
            />
            <Route
              path="/capture"
              element={!user || !sprint ? <Navigate to="/app" replace /> : <Capture />}
            />
            <Route path="/care" element={<Caregiver />} />
            <Route
              path="/report"
              element={!user || !sprint ? <Navigate to="/app" replace /> : <Report />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NavGate>
      </HashRouter>
    </>
  )
}

/** Renders the sticky bottom nav on app routes and reserves its height. */
function NavGate({ hasApp, children }: { hasApp: boolean; children: React.ReactNode }) {
  const { pathname } = useLocation()
  const onAppRoute =
    pathname.startsWith('/app') ||
    pathname.startsWith('/capture') ||
    pathname.startsWith('/care') ||
    pathname.startsWith('/report')
  const showNav = hasApp && onAppRoute

  useEffect(() => {
    document.documentElement.style.setProperty('--nav-h', showNav ? '74px' : '0px')
  }, [showNav])

  return (
    <>
      {children}
      {showNav && <BottomNav />}
    </>
  )
}
