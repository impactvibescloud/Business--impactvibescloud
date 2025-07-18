// Contact List Debug Script
// Run this in the browser console to debug contact fetching issues

console.log('🔍 Debugging Contact List Issues...')

// Test API endpoints
const testApiEndpoints = async () => {
  const token = localStorage.getItem('authToken')
  
  if (!token) {
    console.log('❌ No auth token found')
    return
  }
  
  console.log('✅ Auth token found:', token.substring(0, 20) + '...')
  
  // Test contacts endpoint
  console.log('🧪 Testing contacts endpoint...')
  try {
    const response = await fetch('/api/contacts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📊 Contacts API response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('📋 Contacts API response data:', data)
      
      // Check data structure
      if (data && data.success && Array.isArray(data.data)) {
        console.log('✅ Response format: { success: true, data: [...] }')
        console.log('📝 Contacts count:', data.data.length)
        if (data.data.length > 0) {
          console.log('👤 Sample contact:', data.data[0])
        }
      } else if (Array.isArray(data)) {
        console.log('✅ Response format: [...] (direct array)')
        console.log('📝 Contacts count:', data.length)
        if (data.length > 0) {
          console.log('👤 Sample contact:', data[0])
        }
      } else {
        console.log('⚠️ Unexpected response format:', typeof data)
      }
    } else {
      const errorText = await response.text()
      console.log('❌ Contacts API error:', errorText)
    }
  } catch (error) {
    console.log('❌ Contacts API fetch error:', error.message)
  }
  
  // Test contact lists endpoint
  console.log('🧪 Testing contact lists endpoint...')
  try {
    const response = await fetch('/api/contact-list', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📊 Contact Lists API response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('📋 Contact Lists API response data:', data)
    } else {
      const errorText = await response.text()
      console.log('❌ Contact Lists API error:', errorText)
    }
  } catch (error) {
    console.log('❌ Contact Lists API fetch error:', error.message)
  }
}

// Test mock data generation
const generateMockContacts = () => {
  console.log('🎭 Generating mock contacts for testing...')
  
  const mockContacts = [
    {
      id: 'mock-contact-1',
      name: 'Alice Johnson',
      phone: '+1234567890',
      email: 'alice.johnson@example.com',
      company: 'Tech Corp'
    },
    {
      id: 'mock-contact-2',
      name: 'Bob Smith',
      phone: '+0987654321',
      email: 'bob.smith@example.com',
      company: 'Business Solutions'
    },
    {
      id: 'mock-contact-3',
      name: 'Carol Wilson',
      phone: '+1122334455',
      email: 'carol.wilson@example.com',
      company: 'Marketing Agency'
    },
    {
      id: 'mock-contact-4',
      name: 'David Brown',
      phone: '+2233445566',
      email: 'david.brown@example.com',
      company: 'Consulting Firm'
    },
    {
      id: 'mock-contact-5',
      name: 'Eva Davis',
      phone: '+3344556677',
      email: 'eva.davis@example.com',
      company: 'Design Studio'
    }
  ]
  
  console.log('📝 Mock contacts generated:', mockContacts)
  
  // Store in localStorage for testing
  localStorage.setItem('mockContacts', JSON.stringify(mockContacts))
  console.log('💾 Mock contacts saved to localStorage')
  
  return mockContacts
}

// Test contact list component state
const testContactListState = () => {
  console.log('🔍 Checking ContactList component state...')
  
  // Check if React DevTools can find the component
  try {
    const reactFiber = document.querySelector('[data-reactroot]')
    if (reactFiber) {
      console.log('✅ React app found')
    } else {
      console.log('❌ React app not found')
    }
  } catch (error) {
    console.log('⚠️ Error checking React app:', error.message)
  }
  
  // Check localStorage for any contact-related data
  console.log('📦 Checking localStorage for contact data...')
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.toLowerCase().includes('contact')) {
      console.log(`📄 ${key}:`, localStorage.getItem(key))
    }
  }
}

// Main debug function
const debugContactList = async () => {
  console.log('🚀 Starting Contact List Debug...')
  
  await testApiEndpoints()
  generateMockContacts()
  testContactListState()
  
  console.log('✅ Debug complete!')
  console.log('💡 Tips:')
  console.log('   1. Check if the API endpoints are working')
  console.log('   2. Verify the auth token is valid')
  console.log('   3. Look for network errors in the Network tab')
  console.log('   4. Check if the component is properly mounted')
  console.log('   5. Use the mock contacts if API is not available')
}

// Run the debug
debugContactList()

export default debugContactList
