// API debouncer utility to prevent excessive API calls
import { debounce } from 'lodash'

// Create a debounced version of API calls
const createDebouncedApiCall = (delay = 300) => {
  return debounce(async (apiFunction, ...args) => {
    try {
      return await apiFunction(...args)
    } catch (error) {
      console.error('Debounced API call failed:', error)
      throw error
    }
  }, delay)
}

// Default debounced API call with 300ms delay
export const debouncedApiCall = createDebouncedApiCall(300)

// Create debounced API calls with custom delays
export const createDebouncer = (delay) => createDebouncedApiCall(delay)

// Export default
export default debouncedApiCall
