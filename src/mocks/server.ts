/**
 * MSW Server Setup
 * Configures Node.js server for mocking API calls in testing
 * Note: Only for testing environment
 */

// Conditional import to avoid build errors
let server: any = null

if (typeof window === 'undefined' && process.env.NODE_ENV === 'test') {
  try {
    const { setupServer } = require('msw/node')
    const { handlers } = require('./handlers')
    server = setupServer(...handlers)
  } catch (error) {
    console.warn('MSW server not available:', error)
  }
}

export { server }