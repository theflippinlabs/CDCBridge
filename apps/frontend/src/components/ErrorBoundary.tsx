import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
  info: string;
}

/**
 * Catches render-time errors anywhere in the tree and shows the message on
 * screen instead of a blank page. Makes production issues diagnosable without
 * a desktop debugger.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, info: '' };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: '' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info: info.componentStack ?? '' });
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-obsidian-950 p-6 text-platinum-100">
          <div className="mx-auto max-w-lg space-y-4">
            <h1 className="text-lg font-semibold text-red-300">Something went wrong</h1>
            <p className="text-sm text-platinum-300">
              The app hit an unexpected error. Details below (screenshot this):
            </p>
            <pre className="overflow-auto whitespace-pre-wrap rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
              {this.state.error.name}: {this.state.error.message}
            </pre>
            {this.state.info && (
              <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-lg border border-obsidian-700 bg-obsidian-900 p-3 text-[10px] text-platinum-400">
                {this.state.info}
              </pre>
            )}
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
