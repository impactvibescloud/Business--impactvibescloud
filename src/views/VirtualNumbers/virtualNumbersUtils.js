// Save purchased number to localStorage
export function savePurchasedNumber(numberData) {
  // Get existing purchased numbers
  const existingNumbers = getPurchasedNumbers()
  
  // Add new number with timestamp
  const numberWithTimestamp = {
    ...numberData,
    purchaseDate: new Date().toISOString()
  }
  
  // Add to array and save back to localStorage
  const updatedNumbers = [...existingNumbers, numberWithTimestamp]
  localStorage.setItem('purchasedNumbers', JSON.stringify(updatedNumbers))
  
  return updatedNumbers
}

// Get all purchased numbers
export function getPurchasedNumbers() {
  try {
    const numbers = localStorage.getItem('purchasedNumbers')
    return numbers ? JSON.parse(numbers) : []
  } catch (error) {
    console.error('Error retrieving purchased numbers:', error)
    return []
  }
}

// Get purchased numbers by country
export function getPurchasedNumbersByCountry() {
  const allNumbers = getPurchasedNumbers()
  
  // Group numbers by country/location
  return allNumbers.reduce((acc, number) => {
    const location = number.location || 'Other'
    
    if (!acc[location]) {
      acc[location] = []
    }
    
    acc[location].push(number)
    return acc
  }, {})
}

// Clear all purchased numbers (for testing)
export function clearPurchasedNumbers() {
  localStorage.removeItem('purchasedNumbers')
}

// Remove a specific purchased number by ID
export function removePurchasedNumber(numberId) {
  const numbers = getPurchasedNumbers()
  const updatedNumbers = numbers.filter(num => num.id !== numberId)
  localStorage.setItem('purchasedNumbers', JSON.stringify(updatedNumbers))
  return updatedNumbers
}
