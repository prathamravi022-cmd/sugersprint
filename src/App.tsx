import { Suspense, lazy, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './store'
import { Landing } from './screens/Landing'
import { Dashboard } from './screens/Dashboard'
import { Capture } from './screens/Capture'
import { Caregiver } from './screens/Caregiver'
import { Onboarding } from './screens/Onboarding'
import { Settings } from './screens/Settings'
import { Achievements } from './screens/Achievements'
import { NotFound } from './screens/NotFound'
import { Confetti } from './components/Confetti'
import { Toasts } from './components/Toast'
import { BottomNav } from './components/BottomNav'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BackToTop, ScrollProgress, ScrollToTop } from './components/ScrollBits'
import { CommandPalette } from './components/CommandPalette'

// Route-level code splitting — the report bundle only loads when opened.
const Report = lazy(() => import('./screens/Report').then((m) => ({ default: m.Report })))
const Insights = lazy(() => import('./screens/Insights').then((m) => ({ default: m.Insights })))

export default function App() {
  const user = useStore((s) => s.user)
  const sprint = useStore((s) => s.sprint)
  const toasts = useStore((s) => s.toasts)
  const confetti = useStore((s) => s.confetti)
  const pushToast = useStore((s) => s.pushToast)
  const settings = useStore((s) => s.settings)

  // Accessibility preferences are applied at the document level so every
  // rem-based size and animation respects them.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-motion', settings?.reduceMotion ? 'reduce' : 'full')
    root.setAttribute('data-font', settings?.fontScale ?? 'md')
  }, [settings?.reduceMotion, settings?.fontScale])

  // Flush queued writes when connectivity returns (Frontend Spec §7)
  useEffect(() => {
    const onOnline = () => {
      const { pendingQueue, syncPending } = useStore.getState()
      if (pendingQueue.length > 0) void syncPending()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  // Cross-tab sync: a cheer sent from another tab rehydrates the store.
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
    <ErrorBoundary>
      <Confetti trigger={confetti} />
      <Toasts toasts={toasts} />
      <HashRouter>
        <ScrollToTop />
        <ScrollProgress />
        <BackToTop />
        <NavGate hasApp={Boolean(user && sprint)}>
          <Suspense
            fallback={
              <div className="phone-shell" style={{ justifyContent: 'center' }}>
                <p className="center sub">
                  <span className="spin">◌</span> Compiling your summary…
                </p>
              </div>
            }
          >
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
              <Route
                path="/insights"
                element={!user || !sprint ? <Navigate to="/app" replace /> : <Insights />}
              />
              <Route path="/settings" element={<Settings />} />
              <Route path="/badges" element={<Achievements />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </NavGate>
        {user && <CommandPalette />}
      </HashRouter>
    </ErrorBoundary>
  )
}

/** Renders the sticky bottom nav on app routes and reserves its height. */
function NavGate({ hasApp, children }: { hasApp: boolean; children: React.ReactNode }) {
  const { pathname } = useLocation()
  const onAppRoute =
    pathname.startsWith('/app') ||
    pathname.startsWith('/capture') ||
    pathname.startsWith('/care') ||
    pathname.startsWith('/report') ||
    pathname.startsWith('/insights') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/badges')
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
