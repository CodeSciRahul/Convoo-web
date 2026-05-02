import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import { store } from './Redux/Store.ts'
import { ErrorBoundary } from 'react-error-boundary'
import FallbackUI from './components/fallbackUI.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={FallbackUI}>
  <Provider store={store}>
  <QueryClientProvider client={queryClient}>
  <HelmetProvider>
  <StrictMode>
    <App />
  </StrictMode>
  </HelmetProvider>
  </QueryClientProvider>
  </ Provider>
  </ErrorBoundary>
)
