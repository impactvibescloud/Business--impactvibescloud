// Simple event bus implementation for cross-component communication
const eventBus = {
  events: {},
  
  // Subscribe to an event
  subscribe: function(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = []
    }
    this.events[eventName].push(callback)
    
    // Return an unsubscribe function
    return () => {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback)
    }
  },
  
  // Publish an event with data
  publish: function(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => {
        callback(data)
      })
    }
  }
}

export default eventBus
