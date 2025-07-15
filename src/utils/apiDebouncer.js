// API debouncer to prevent rapid successive API calls
// This helps reduce 429 errors by throttling requests

const pendingRequests = new Map()
const debounceTimers = new Map()
const DEBOUNCE_DELAY = 500 // 500ms delay

export const debouncedApiCall = (key, apiFunction, delay = DEBOUNCE_DELAY) => {
  return new Promise((resolve, reject) => {
    // Clear existing timer for this key
    const existingTimer = debounceTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    
    // Check if there's already a pending request for this key
    const existingRequest = pendingRequests.get(key)
    if (existingRequest) {
      // Return the existing promise
      return existingRequest.then(resolve).catch(reject)
    }
    
    // Create new debounced timer
    const timer = setTimeout(async () => {
      try {
        // Create and store the promise
        const requestPromise = apiFunction()
        pendingRequests.set(key, requestPromise)
        
        // Execute the API call
        const result = await requestPromise
        
        // Clean up
        pendingRequests.delete(key)
        debounceTimers.delete(key)
        
        resolve(result)
      } catch (error) {
        // Clean up on error
        pendingRequests.delete(key)
        debounceTimers.delete(key)
        
        reject(error)
      }
    }, delay)
    
    debounceTimers.set(key, timer)
  })
}

// Clear all pending requests and timers
export const clearAllDebounced = () => {
  debounceTimers.forEach(timer => clearTimeout(timer))
  debounceTimers.clear()
  pendingRequests.clear()
}

export default debouncedApiCall
