// Save credits to localStorage
export function saveCredits(amount) {
  try {
    // Get current credits
    const currentCredits = getCredits()
    
    // Add new credits
    const updatedCredits = currentCredits + amount
    
    // Save to localStorage
    localStorage.setItem('userCredits', JSON.stringify(updatedCredits))
    
    // Add to transaction history
    addCreditTransaction(amount, 'added')
    
    // Dispatch a custom event that credits have changed
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
    // Get current credits
    const currentCredits = getCredits()
    
    // Check if enough credits
    if (currentCredits < amount) {
      return { success: false, message: 'Insufficient credits', balance: currentCredits }
    }
    
    // Subtract credits
    const updatedCredits = currentCredits - amount
    
    // Save to localStorage
    localStorage.setItem('userCredits', JSON.stringify(updatedCredits))
    
    // Dispatch a custom event that credits have changed
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('creditsUpdated', { detail: { credits: updatedCredits } })
      window.dispatchEvent(event)
    }
    
    // Add to transaction history
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
    // Get current transaction history
    const historyString = localStorage.getItem('creditTransactions')
    const history = historyString ? JSON.parse(historyString) : []
    
    // Add new transaction
    const transaction = {
      id: Date.now(),
      amount,
      type,
      timestamp: new Date().toISOString()
    }
    
    // Save updated history
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
