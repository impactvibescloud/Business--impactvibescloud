import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, isChunkLoadError: false }
  }

  static getDerivedStateFromError(error) {
    const isChunk = !!(
      (error && error.message && error.message.indexOf('Loading chunk') !== -1) ||
      (error && error.name === 'ChunkLoadError')
    )
    return { hasError: true, error, isChunkLoadError: isChunk }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    // If this is a chunk load error, attempt a single cache-bypassing reload
    try {
      if (this.state.isChunkLoadError) {
        const key = `chunkReload:${window.location.pathname}`
        // Only attempt once per path to avoid reload loops
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, Date.now())
          // Add a cache-busting query param and replace location
          const sep = window.location.search ? '&' : '?'
          const newUrl = window.location.pathname + window.location.search + sep + 'r=' + Date.now()
          // Use replace so back button doesn't go to the broken URL
          window.location.replace(newUrl)
        }
      }
    } catch (e) {
      // ignore any errors in the recovery logic
      console.warn('ErrorBoundary recovery failed', e)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <h4>Something went wrong</h4>
            <p className="text-muted">Please refresh the page or try again later.</p>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
