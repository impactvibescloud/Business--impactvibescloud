import { apiCall } from '../../config/api'

// Fetch credits from API
export async function fetchCreditsFromAPI(businessId = '684fe39da8254e8906e99aad') {
  try {
    const response = await apiCall(`/api/business/get_one/${businessId}`, 'GET')
    
    console.log('API Response for credits:', response)
    
    // Handle different response structures
    let businessData = response
    if (response.data) {
      businessData = response.data
    }
    
    // Extract credits from various possible fields
    const credits = businessData.credits || 
                   businessData.balance || 
                   businessData.creditBalance || 
                   businessData.credit_balance ||
                   businessData.account_balance ||
                   0
    
    console.log('Extracted credits:', credits)
    
    // Update localStorage with API data
    localStorage.setItem('userCredits', JSON.stringify(credits))
    
    // Dispatch event to notify other components
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('creditsUpdated', { detail: { credits } })
      window.dispatchEvent(event)
    }
    
    return credits
  } catch (error) {
    console.error('Error fetching credits from API:', error)
    return getCredits() // fallback to localStorage
  }
}

// Save credits to localStorage
export function saveCredits(amount) {
  try {
    const currentCredits = getCredits()
    const updatedCredits = currentCredits + amount
    localStorage.setItem('userCredits', JSON.stringify(updatedCredits))
    addCreditTransaction(amount, 'added')
    
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('creditsUpdated', { detail: { credits: updatedCredits } })
      window.dispatchEvent(event)
    }
    
    return updatedCredits
  } catch (error) {
    console.error('Error saving credits:', error)
    return 0
  }
}

// Get credits from localStorage
export function getCredits() {
  try {
    const credits = localStorage.getItem('userCredits')
    return credits ? JSON.parse(credits) : 0
  } catch (error) {
    console.error('Error retrieving credits:', error)
    return 0
  }
}

// Use credits (subtract from balance)
export function useCredits(amount) {
  try {
    const currentCredits = getCredits()
    
    if (currentCredits < amount) {
      return { success: false, message: 'Insufficient credits', balance: currentCredits }
    }
    
    const updatedCredits = currentCredits - amount
    localStorage.setItem('userCredits', JSON.stringify(updatedCredits))
    
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('creditsUpdated', { detail: { credits: updatedCredits } })
      window.dispatchEvent(event)
    }
    
    addCreditTransaction(amount, 'used')
    
    return { 
      success: true, 
      message: 'Credits used successfully', 
      balance: updatedCredits 
    }
  } catch (error) {
    console.error('Error using credits:', error)
    return { 
      success: false, 
      message: 'Error processing credits', 
      balance: getCredits() 
    }
  }
}

// Add credit transaction to history
function addCreditTransaction(amount, type) {
  try {
    const historyString = localStorage.getItem('creditTransactions')
    const history = historyString ? JSON.parse(historyString) : []
    
    const transaction = {
      id: Date.now(),
      amount,
      type,
      timestamp: new Date().toISOString()
    }
    
    localStorage.setItem('creditTransactions', JSON.stringify([...history, transaction]))
  } catch (error) {
    console.error('Error adding credit transaction:', error)
  }
}

// Get credit transaction history
export function getCreditHistory() {
  try {
    const historyString = localStorage.getItem('creditTransactions')
    return historyString ? JSON.parse(historyString) : []
  } catch (error) {
    console.error('Error retrieving credit history:', error)
    return []
  }
}

// Clear all credits and history (for testing)
export function clearCredits() {
  localStorage.removeItem('userCredits')
  localStorage.removeItem('creditTransactions')
}