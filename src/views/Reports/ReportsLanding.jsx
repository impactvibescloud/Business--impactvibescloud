import React from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PhoneIcon from '@mui/icons-material/Phone'
import PeopleIcon from '@mui/icons-material/People'
import StorageIcon from '@mui/icons-material/Storage'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import './ReportsLanding.css'

const ReportCard = ({ title, description, href, icon: Icon, badge }) => {
  const navigate = useNavigate()
  
  const handleClick = () => {
    if (href) navigate(href)
  }

  return (
    <Card 
      className="report-card-item"
      onClick={handleClick}
      sx={{ 
        cursor: 'pointer',
        height: '100%',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 8px 16px rgba(108, 92, 231, 0.12)',
          transform: 'translateY(-2px)',
        }
      }}
    >
      <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Icon sx={{ color: '#6c5ce7', fontSize: 28 }} />
          {badge && <Chip label={badge} size="small" className="custom-chip" />}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', color: '#222', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.4 }}>
            {description}
          </Typography>
        </Box>
        <Box sx={{ mt: 'auto', pt: 1 }}>
          <Button 
            endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
            size="small"
            sx={{ 
              color: '#6c5ce7',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              p: 0,
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#5a46eb',
              }
            }}
          >
            Explore
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

const ReportsLanding = () => {
  return (
    <Box className="page-container">
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#222', mb: 0.5 }}>
          Reports & Analytics
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          Monitor and analyze your business communications performance
        </Typography>
      </Box>

      {/* Real Time Reporting */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#333', mb: 1.5, fontSize: '0.95rem' }}>
          Real Time Reporting
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <ReportCard
              title="Active Calls"
              description="Displays active calls on Extensions"
              href="/callmonitor"
              icon={PhoneIcon}
              badge="Live"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ReportCard
              title="Agent Real Time"
              description="Monitor agents live performance and status"
              href="/agent-performance"
              icon={PeopleIcon}
              badge="Live"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ReportCard
              title="Department Wallboard"
              description="Display real-time departmental metrics"
              href="/department-performance"
              icon={DashboardIcon}
              badge="Live"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ReportCard
              title="Dialer Real Time"
              description="View real-time dialer performance metrics"
              href="/dialer-real-time"
              icon={TrendingUpIcon}
              badge="Live"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Call Details */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#333', mb: 1.5, fontSize: '0.95rem' }}>
          Call Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <ReportCard
              title="Call Detail Records"
              description="Get detailed information on all calls with recordings"
              href="/reports/cdr"
              icon={StorageIcon}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default ReportsLanding
