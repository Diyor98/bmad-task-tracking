import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center bg-zinc-50">
          <h1 className="mb-2 text-lg font-semibold text-zinc-900">Something went wrong</h1>
          <p className="mb-4 text-sm text-zinc-500">An unexpected error occurred.</p>
          <Button onClick={() => { this.setState({ hasError: false }); window.location.href = '/' }}>
            Back to Dashboard
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
