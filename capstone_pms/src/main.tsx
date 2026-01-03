import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
console.log('main.tsx loaded')

const rootEl = document.getElementById('root')
if (!rootEl) {
  console.error('Root element not found')
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}

if (import.meta.env.DEV) {
  console.warn = () => {};
}
