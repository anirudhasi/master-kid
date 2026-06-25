import { Component, type ReactNode } from 'react'

// Catches render/runtime errors in a page so a crash shows a friendly, recoverable
// message instead of a blank white screen. `resetKey` (e.g. the route path) lets the
// boundary auto-clear when the user navigates elsewhere.
interface Props { children: ReactNode; resetKey?: string }
interface State { error: Error | null }

const FONT = "'Nunito', 'Inter', sans-serif"

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ maxWidth: 560, margin: '64px auto', padding: '0 24px', fontFamily: FONT, textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>😵‍💫</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>This page hit a snag</h1>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 18 }}>
          Something went wrong rendering this screen. You can try again, or head back to the dashboard.
        </p>
        <pre style={{ textAlign: 'left', fontSize: 12, color: '#991B1B', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 12, overflowX: 'auto', marginBottom: 18 }}>
          {this.state.error.message}
        </pre>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => this.setState({ error: null })}
            style={{ padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6C63FF,#9B59FF)', color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: FONT }}>
            Try again
          </button>
          <a href="/child" style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 800, fontFamily: FONT, textDecoration: 'none' }}>
            Go to dashboard
          </a>
        </div>
      </div>
    )
  }
}
