import { Component, type ReactNode } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled render error', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto text-center py-24 px-8">
          <h1 className="font-display text-3xl text-primary mb-3">Something tore at the seams</h1>
          <p className="text-secondary mb-6">An unexpected error occurred. Reload to continue.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-primary text-white rounded transition-colors duration-200 cursor-pointer hover:bg-accent"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
