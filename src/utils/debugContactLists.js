// Debug utility for ContactLists component
export const debugContactLists = {
  // Log contact dropdown state
  logDropdownState: (contacts, isLoading, selectedContacts) => {
    console.group('🔍 Contact Dropdown Debug')
    console.log('Total contacts available:', contacts?.length || 0)
    console.log('Is loading:', isLoading)
    console.log('Selected contacts:', selectedContacts?.length || 0)
    console.log('Contacts data:', contacts)
    console.groupEnd()
  },

  // Check API endpoint configuration
  checkApiConfig: () => {
    try {
      const { ENDPOINTS } = require('../config/api')
      console.group('⚙️ API Configuration Check')
      console.log('CONTACTS endpoint:', ENDPOINTS?.CONTACTS)
      console.log('API base configured:', !!ENDPOINTS)
      console.groupEnd()
      return !!ENDPOINTS?.CONTACTS
    } catch (error) {
      console.error('❌ API configuration error:', error)
      return false
    }
  },

  // Test contact fetching manually
  testContactFetch: async () => {
    try {
      console.log('🧪 Testing contact fetch...')
      const { apiCall } = require('../utils/apiCall') // Adjust path as needed
      const { ENDPOINTS } = require('../config/api')
      
      const response = await apiCall(ENDPOINTS.CONTACTS)
      console.log('✅ Contact fetch test result:', response)
      return response
    } catch (error) {
      console.error('❌ Contact fetch test failed:', error)
      return null
    }
  },

  // Validate contact data structure
  validateContactData: (contact, index) => {
    const issues = []
    
    if (!contact.id) issues.push(`Contact ${index}: Missing ID`)
    if (!contact.name) issues.push(`Contact ${index}: Missing name`)
    
    if (issues.length > 0) {
      console.warn('⚠️ Contact validation issues:', issues)
    }
    
    return issues.length === 0
  },

  // Monitor modal state
  logModalState: (showModal, editingList, newListName) => {
    console.group('📋 Modal State Debug')
    console.log('Show new list modal:', showModal)
    console.log('Editing existing list:', !!editingList)
    console.log('New list name:', newListName || '(empty)')
    console.groupEnd()
  }
}

// Make it available globally for easy debugging
if (typeof window !== 'undefined') {
  window.debugContactLists = debugContactLists
}
