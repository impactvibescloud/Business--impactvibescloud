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
    const stored = localStorage.getItem('purchasedNumbers')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error retrieving purchased numbers:', error)
    return []
  }
}

// Get purchased numbers filtered by country
export function getPurchasedNumbersByCountry(country) {
  const allNumbers = getPurchasedNumbers()
  
  if (country) {
    return allNumbers.filter(num => num.country === country)
  }
  
  // Group numbers by country/location
  const groupedNumbers = {}
  
  allNumbers.forEach(num => {
    const location = num.country || num.location || 'Unknown'
    if (!groupedNumbers[location]) {
      groupedNumbers[location] = []
    }
    groupedNumbers[location].push(num)
  })
  
  return groupedNumbers
}
