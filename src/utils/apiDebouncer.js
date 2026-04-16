// API debouncer utility to prevent excessive API calls
import { debounce } from 'lodash'

// Create a debounced version of API calls (shorter default for snappier UX)
const createDebouncedApiCall = (delay = 100) => {
  return debounce(async (apiFunction, ...args) => {
    try {
      return await apiFunction(...args)
    } catch (error) {
      console.error('Debounced API call failed:', error)
      throw error
    }
  }, delay)
}

// Default debounced API call with 100ms delay
export const debouncedApiCall = createDebouncedApiCall(100)

// Create debounced API calls with custom delays
export const createDebouncer = (delay) => createDebouncedApiCall(delay)

// Export default
export default debouncedApiCall
