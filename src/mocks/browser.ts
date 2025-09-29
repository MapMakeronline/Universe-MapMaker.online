/**
 * MSW Browser Setup
 * Configures service worker for mocking API calls in development
 */

// Conditional setup to avoid SSR issues
let worker: any = null

if (typeof window !== 'undefined') {
  const { setupWorker } = require('msw/browser')
  const { handlers } = require('./handlers')

  worker = setupWorker(...handlers)

  // Start the worker only in development
  if (process.env.NODE_ENV === 'development') {
    worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js'
      }
    }).catch((error: any) => {
      console.warn('MSW worker failed to start:', error)
    })
  }
}

export { worker }