import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[App Error Boundary]', error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-app flex items-center justify-center p-6">
          <div className="max-w-xl w-full rounded-2xl border border-red-500/40 bg-[var(--surface-elevated)] p-6 shadow-xl">
            <p className="text-sm uppercase tracking-[0.2em] text-red-400 font-semibold">Something went wrong</p>
            <h1 className="mt-3 text-2xl font-bold text-main">The page could not be loaded</h1>
            <p className="mt-3 text-sm text-muted">
              We hit a frontend error while rendering this page. Refreshing will retry the page load.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={this.handleRetry}>Refresh page</button>
              <a href="/" className="btn-secondary">Go to dashboard</a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
