import React, { useState, useEffect } from 'react'
import { apiCall } from '../../config/api'
import { isAutheticated } from '../../auth'
import {
  Box,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress,
  Tooltip,
  Pagination,
  Typography,
  Alert
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import PhoneIcon from '@mui/icons-material/Phone'
import DeleteIcon from '@mui/icons-material/Delete'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import '../Leads/CallLogsWebpage.css'

function VirtualNumbers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('All Numbers')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [assignedNumbers, setAssignedNumbers] = useState([])
  const [releasingNumber, setReleasingNumber] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [user, setUser] = useState(null)
  const token = isAutheticated()

  // Fetch user details first
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (!token && !localStorage.getItem('authToken')) {
          setError('Authentication required. Please login again.');
          return;
        }
        const userData = await apiCall('/v1/user/details', 'GET');
        // Get businessId from API response or fall back to localStorage
        const businessId = userData?.user?.businessId || localStorage.getItem('businessId');
        if (!businessId) {
          setError('Business ID not found. Please login again.');
          return;
        }
        setUser({ ...userData.user, businessId });
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to fetch user details');
      }
    };
    if (token) {
      fetchUserDetails();
    }
  }, [token]);
  
  // Fetch assigned numbers
  useEffect(() => {
    const fetchAssignedNumbers = async (retryCount = 0) => {
      if (!token) {
        setError("Authentication token not found. Please log in again.")
        return
      }
      
      setIsLoading(true)
      setError(null)
      
      if (!user?.businessId) {
        setError("Business ID not found. Please try again later.")
        return
      }

      try {
        console.log('Fetching virtual numbers for business:', user.businessId)
        
        // Use centralized apiCall with a relative endpoint so axios uses the
        // configured baseURL from src/config/api.js (which handles dev/prod)
  const response = await apiCall(`/numbers/assigned-to/${user.businessId}`, 'GET', null, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response) {
          throw new Error('No data received from API')
        }
        
        console.log('Virtual numbers fetched:', response)
        console.log('Response data type:', typeof response)
        
        // Detailed inspection of response
        if (typeof response.data === 'object') {
          console.log('Response data keys:', Object.keys(response.data))
        }
        
        // Ensure response is an array
        let numbersArray = []
        
        if (Array.isArray(response)) {
          console.log('Response is already an array')
          numbersArray = response.filter(num => num.status === 'assigned')
        } else if (typeof response === 'object') {
          // Check for common API response patterns
          if (Array.isArray(response.data)) {
            console.log('Using response.data array')
            numbersArray = response.data.filter(num => num.status === 'assigned')
          } else if (Array.isArray(response.numbers)) {
            console.log('Using response.numbers array')
            numbersArray = response.numbers.filter(num => num.status === 'assigned')
          } else if (Array.isArray(response.results)) {
            console.log('Using response.results array')
            numbersArray = response.results.filter(num => num.status === 'assigned')
          } else if (Array.isArray(response.items)) {
            console.log('Using response.items array')
            numbersArray = response.items.filter(num => num.status === 'assigned')
          } else {
            console.log('No array found in response, creating empty array')
          }
        } else {
          console.log('Response data is not an object or array')
        }
        
        console.log('Final numbers array:', numbersArray)
        
        // Verify if we got valid data
        if (numbersArray.length === 0 && typeof response === 'object' && !Array.isArray(response)) {
          // If response isn't an array and we couldn't extract an array,
          // try to create an array from response as a fallback
          console.log('Attempting to create array from object data')
          
          // Check if response itself could be a single number object
          if (response.number || response._id || response.extension) {
            console.log('Treating response as a single item')
            numbersArray = [response]
          } else {
            // Last resort: try to extract objects from response that look like number records
            const possibleNumbers = Object.values(response)
              .filter(item => 
                item && typeof item === 'object' && 
                (item.number || item.extension || item._id || item.status)
              )
            
            if (possibleNumbers.length > 0) {
              console.log('Created array from object values:', possibleNumbers)
              numbersArray = possibleNumbers
            }
          }
        }
        
        setAssignedNumbers(numbersArray)
      } catch (err) {
        console.error('Error fetching virtual numbers:', err)
        
        let errorMessage = 'Unknown error occurred';
        
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response:', err.response.status, err.response.data);
          
          if (err.response.status === 403) {
            errorMessage = 'Access denied. Please check your authentication or contact support.';
            // Clear token and redirect to login if 403
            localStorage.removeItem('authToken');
            window.location.href = '/';
            return;
          } else if (err.response.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
            localStorage.removeItem('authToken');
            window.location.href = '/';
            return;
          } else {
            errorMessage = `Server error: ${err.response.status} - ${err.response.data?.message || 'Unknown server error'}`;
          }
        } else if (err.request) {
          // The request was made but no response was received
          errorMessage = 'No response received from server. Please check your network connection.';
          console.error('Error request:', err.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          errorMessage = err.message || 'Failed to make request';
          console.error('Error message:', err.message);
        }
        
        // Implement retry logic (max 2 retries)
        if (retryCount < 2) {
          console.log(`Retrying API call (attempt ${retryCount + 1})...`)
          setTimeout(() => fetchAssignedNumbers(retryCount + 1), 1500) // Slightly longer delay between retries
          return
        }
        
        setError(`Error fetching assigned numbers: ${errorMessage}`)
        setAssignedNumbers([])
      } finally {
        setIsLoading(false)
      }
    }
    
    if (user?.businessId) {
      fetchAssignedNumbers(0)
    }
  }, [token, user?.businessId])
  
  // Filter assigned numbers by search term and active filter
  const filteredAssignedNumbers = Array.isArray(assignedNumbers) ? assignedNumbers.filter(num => {
    if (!num) return false

    // Filter by search term
    if (searchTerm.trim()) {
      const matchesSearch =
        (num.number && num.number.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        (num.extension && num.extension.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        (num.city && num.city.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        (num.type && num.type.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        (Array.isArray(num.tag) && num.tag.some(tag =>
          tag && tag.toString().toLowerCase().includes(searchTerm.toLowerCase())
        ))

      if (!matchesSearch) return false
    }

    // If 'All Numbers' is selected, return all numbers (no additional filtering)
    if (activeFilter === 'All Numbers') {
      return true
    }

    // Filter by number type - check both num.type and num.tag array
    const filterLower = activeFilter.toLowerCase()
    
    // Check if the filter matches the direct type field
    if (num.type && num.type.toString().toLowerCase() === filterLower) {
      return true
    }
    
    // Check if the filter matches any tag in the tag array
    if (Array.isArray(num.tag) && num.tag.some(tag =>
      tag && tag.toString().toLowerCase() === filterLower
    )) {
      return true
    }
    
    // Handle special filter mappings
    if (filterLower === 'toll-free' && num.type && 
        (num.type.toString().toLowerCase().includes('toll') || 
         num.type.toString().toLowerCase().includes('free'))) {
      return true
    }
    
    if (filterLower === 'local' && num.type && 
        num.type.toString().toLowerCase().includes('local')) {
      return true
    }
    
    if (filterLower === 'international' && num.type && 
        (num.type.toString().toLowerCase().includes('international') || 
         num.type.toString().toLowerCase().includes('global'))) {
      return true
    }

    return false
  }) : []
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentNumbers = filteredAssignedNumbers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredAssignedNumbers.length / itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setActiveFilter('All Numbers')
    setCurrentPage(1)
  }
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }
  
  // Handle filter selection
  const handleFilterSelect = (filter) => {
    setActiveFilter(filter)
    setCurrentPage(1)
  }
  
  // Release number function
  const releaseNumber = async (numberId) => {
    if (!token) {
      setError("Authentication token not found. Please log in again.")
      return
    }
    
    if (!numberId) {
      setError("Number ID is required to release a number")
      return
    }
    
    // Set the number being released to show spinner
    setReleasingNumber(numberId)
    setError(null)
    
    try {
      console.log('Releasing number via proxy API')
      
  const response = await apiCall(`/numbers/${numberId}`, 'PUT', { status: 'available' }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Number released response:', response.data)
      
      // Update the UI by removing the released number from the list
      setAssignedNumbers(prevNumbers => 
        prevNumbers.filter(num => num._id !== numberId)
      )
      
      // Show success message
      setSuccessMessage(`Virtual number has been successfully released.`)
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      console.error('Error releasing number:', err)
      
      let errorMessage = 'Unknown error occurred';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', err.response.status, err.response.data);
        
        if (err.response.status === 403) {
          errorMessage = 'Access denied. You do not have permission to release this number.';
        } else if (err.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
          localStorage.removeItem('authToken');
          window.location.href = '/';
          return;
        } else {
          errorMessage = `Server error: ${err.response.status} - ${err.response.data?.message || 'Unknown server error'}`;
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = 'No response received from server. Please check your network connection.';
        console.error('Error request:', err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = err.message || 'Failed to make request';
        console.error('Error message:', err.message);
      }
      
      setError(`Failed to release number: ${errorMessage}`)
    } finally {
      setReleasingNumber(null)
    }
  }
  
  return (
    <Box className="page-container contact-list-container">
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>{successMessage}</Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h5" className="contact-list-title">Virtual Numbers</Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" startIcon={<DeleteSweepIcon />} onClick={handleClearFilters} className="filter-btn">Clear Filters</Button>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search numbers..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small"><SearchIcon /></IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Filter</InputLabel>
              <Select label="Filter" value={activeFilter} onChange={(e) => handleFilterSelect(e.target.value)}>
                <MenuItem value="All Numbers">All Numbers</MenuItem>
                <MenuItem value="Toll-Free">Toll-Free</MenuItem>
                <MenuItem value="Local">Local</MenuItem>
                <MenuItem value="International">International</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box className="calllogs-table-container">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>S.NO</TableCell>
                    <TableCell>NUMBER</TableCell>
                    <TableCell>LOCATION</TableCell>
                    <TableCell>TYPE</TableCell>
                    <TableCell>TAGS</TableCell>
                    <TableCell>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={24} />
                        <Box sx={{ mt: 2 }}>Loading virtual numbers...</Box>
                      </TableCell>
                    </TableRow>
                  ) : currentNumbers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Box className="empty-state">
                          <Box className="empty-state-icon"><PhoneIcon sx={{ fontSize: 48 }} /></Box>
                          <Typography variant="h6">No virtual numbers found</Typography>
                          <Typography variant="body2">No virtual numbers are currently assigned to your account.</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentNumbers.map((num, index) => (
                      <TableRow key={num._id || `num-${num.number}`}>
                        <TableCell>{indexOfFirstItem + index + 1}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon fontSize="small" />
                            <span>{num.number || '-'}</span>
                          </Box>
                        </TableCell>
                        <TableCell>{num.city || '-'}</TableCell>
                        <TableCell>
                          <Chip label={num.type || (Array.isArray(num.tag) && num.tag.length > 0 ? num.tag[0] : 'Standard')} size="small" sx={{ backgroundColor: 'var(--primary-500)', color: '#fff' }} />
                        </TableCell>
                        <TableCell>
                          {Array.isArray(num.tag) && num.tag.length > 0 ? (
                            num.tag.map((tag, tagIndex) => (
                              <Chip key={tagIndex} label={tag} size="small" className="custom-chip" sx={{ mr: 0.5 }} />
                            ))
                          ) : (
                            <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}><em>No tags</em></Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Release this number">
                            <span>
                              <IconButton color="error" size="small" onClick={() => releaseNumber(num._id)} disabled={releasingNumber === num._id}>
                                {releasingNumber === num._id ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination count={totalPages} page={currentPage} onChange={(e, p) => handlePageChange(p)} color="primary" />
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default VirtualNumbers
