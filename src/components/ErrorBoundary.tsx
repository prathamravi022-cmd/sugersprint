import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  error: Error | null
}

/** App-wide error boundary with a friendly golden fallback (no blank screens). */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('SugarSprint crashed:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="phone-shell"
          style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 16 }}
        >
          <div style={{ fontSize: 56 }}>🛟</div>
          <h1 className="h1">Something tripped.</h1>
          <p className="sub">
            Your data is safe on this device — this is just a rendering hiccup. Reloading puts
            you right back on the track.
          </p>
          <button className="btn btn-yellow" style={{ maxWidth: 300 }} onClick={() => window.location.reload()}>
            🔁 Reload the app
          </button>
          <button
            className="btn-link"
            onClick={() => {
              try {
                localStorage.removeItem('sugarsprint-state')
              } catch {
                /* ignore */
              }
              window.location.href = '#/'
              window.location.reload()
            }}
          >
            Reset local data (last resort)
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
