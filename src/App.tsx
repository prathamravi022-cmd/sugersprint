import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from './store'
import { Onboarding } from './screens/Onboarding'
import { Dashboard } from './screens/Dashboard'
import { Capture } from './screens/Capture'
import { Caregiver } from './screens/Caregiver'
import { Report } from './screens/Report'
import { Confetti } from './components/Confetti'
import { Toasts } from './components/Toast'

export default function App() {
  const user = useStore((s) => s.user)
  const sprint = useStore((s) => s.sprint)
  const toasts = useStore((s) => s.toasts)
  const confetti = useStore((s) => s.confetti)
  const pendingQueue = useStore((s) => s.pendingQueue)
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

  // Gentle sync reminder if the app loaded with pending offline writes
  useEffect(() => {
    if (pendingQueue.length > 0) {
      pushToast(`📥 ${pendingQueue.length} change(s) waiting to sync`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const needsOnboarding = !user || !sprint

  return (
    <>
      <Confetti trigger={confetti} />
      <Toasts toasts={toasts} />
      <HashRouter>
        <Routes>
          <Route
            path="/"
            element={needsOnboarding ? <Onboarding /> : <Dashboard />}
          />
          <Route
            path="/capture"
            element={needsOnboarding ? <Navigate to="/" replace /> : <Capture />}
          />
          <Route path="/care" element={<Caregiver />} />
          <Route
            path="/report"
            element={needsOnboarding ? <Navigate to="/" replace /> : <Report />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </>
  )
}
