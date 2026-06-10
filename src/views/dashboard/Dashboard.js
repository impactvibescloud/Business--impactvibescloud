import React from "react";
import axios from "axios";
import { useEffect, useState } from "react";
import { isAutheticated } from "../../auth.js";
// WidgetsDropdown no longer used in this layout
import { API_CONFIG, getBaseURL } from "../../config/api";
import { Box, Grid, Card, CardContent, CardHeader, Typography, Button, Paper, Chip, List, ListItem, ListItemText, IconButton, Modal, Backdrop } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import StorefrontIcon from '@mui/icons-material/Storefront'
import GroupIcon from '@mui/icons-material/Group'
import CallIcon from '@mui/icons-material/Call'
import PhoneIcon from '@mui/icons-material/Phone'
import CallReceivedIcon from '@mui/icons-material/CallReceived'
import CallMadeIcon from '@mui/icons-material/CallMade'
import CallMissedIcon from '@mui/icons-material/CallMissed'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import '../Leads/CallLogsWebpage.css'
import './dashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Helper function to get API URL
const getApiUrl = (path) => {
  const baseUrl = getBaseURL();
  // Remove any duplicate slashes between baseUrl and path
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const token = isAutheticated();

const Dashboard = () => {
  const navigate = useNavigate();
  const onlineStatusRef = React.useRef(null);
  const offlineStatusRef = React.useRef(null);
  const closeTimeoutRef = React.useRef(null);
  const [user, setUser] = useState({});
  const [agents, setAgents] = useState(0);
  const [branches, setBranches] = useState([]);
  const [agentStatuses, setAgentStatuses] = useState({ active: 0, deactive: 0, break: 0, lunch: 0, offline: 0, online: 0 });
  const [agentSummary, setAgentSummary] = useState({ total: 0, online: 0, offline: 0, lunch: 0, break: 0 });
  const [agentsList, setAgentsList] = useState([]);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedAgentStatus, setSelectedAgentStatus] = useState('online');
  const [agentPopperAnchor, setAgentPopperAnchor] = useState(null);
  // Fetch agent/branch list and update agent stats
  useEffect(() => {
    if (!token || !user?.businessId) return;
    const fetchAgents = async () => {
      try {
        // Try to fetch branches (agents) for the business
        const response = await axios.get(getApiUrl(`/api/branch/${user.businessId}/branches`), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          const agentList = response.data.data;
          console.log('Fetched agent list:', agentList);
          setAgents(agentList.length);
          setBranches(agentList || []);
          // Count statuses using agent.user.status
          let active = 0, deactive = 0;
          agentList.forEach(agent => {
            const status = agent.user && agent.user.status ? agent.user.status.toLowerCase() : '';
            if (status === 'active') {
              active++;
            } else if (status === 'inactive') {
              deactive++;
            }
            // All other statuses are ignored for these counts
          });
          setAgentStatuses(prev => ({ ...prev, active, deactive }));
        } else {
          setAgents(0);
          setAgentStatuses(prev => ({ ...prev, active: 0, deactive: 0 }));
        }
      } catch (err) {
        setAgents(0);
        setAgentStatuses(prev => ({ ...prev, active: 0, deactive: 0 }));
      }
    };
    fetchAgents();
  }, [token, user?.businessId]);

  
  const [callStats, setCallStats] = useState({
    totalCalls: 0,
    liveCalls: 0,
    outboundCalls: 0,
    callsPerDay: 0,
    inboundCalls: 0,
    missedCalls: 0,
    busyCalls: 0,
    notAnsweredCalls: 0,
    answeredCalls: 0,
    rejectedCalls: 0,
    dialerCalls: 0
  });
  const [callLogs, setCallLogs] = useState([]);
  // Fetch call logs for the business and calculate stats
  useEffect(() => {
    const fetchCallLogsAndStats = async () => {
      if (!token || !user?.businessId) return;
      try {
        // Use the call-uses today endpoint for accurate statistics
        const response = await axios.get(getApiUrl(`/api/call-uses/today/business/${user.businessId}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.data && response.data.success) {
          const data = response.data
          const totals = data.totals || {}
          const byType = data.byType || {}
          const byStatus = data.byStatus || {}
          // Attempt to extract time-series trend data if present in response
          let trend = null
          if (Array.isArray(data.byTime) && data.byTime.length > 0) {
            const labels = data.byTime.map(t => t.label || t.time || t.hour || String(t.timestamp || ''))
            const outbound = data.byTime.map(t => t.outbound || 0)
            const inbound = data.byTime.map(t => t.inbound || 0)
            const missed = data.byTime.map(t => t.missed || 0)
            trend = { labels, outbound, inbound, missed }
          } else if (Array.isArray(data.byHour) && data.byHour.length > 0) {
            const labels = data.byHour.map(t => t.hour || t.label || String(t.timestamp || ''))
            const outbound = data.byHour.map(t => t.outbound || 0)
            const inbound = data.byHour.map(t => t.inbound || 0)
            const missed = data.byHour.map(t => t.missed || 0)
            trend = { labels, outbound, inbound, missed }
          } else if (data.timeSeries && Array.isArray(data.timeSeries)) {
            const labels = data.timeSeries.map(t => t.label || t.time || String(t.timestamp || ''))
            const outbound = data.timeSeries.map(t => t.outbound || 0)
            const inbound = data.timeSeries.map(t => t.inbound || 0)
            const missed = data.timeSeries.map(t => t.missed || 0)
            trend = { labels, outbound, inbound, missed }
          }
          setCallLogs([]) // dashboard widgets derive numbers from stats, not full logs
          const statsData = {
            totalCalls: totals.totalCalls || 0,
            totalDuration: totals.totalDuration || 0,
            answered: byStatus.answered || 0,
            answeredCalls: byStatus.answered || 0,
            busyCalls: byStatus.busy || 0,
            notAnsweredCalls: byStatus['not-answered'] || 0,
            successful: totals.successful || 0,
            failed: totals.failed || 0,
            // Prefer the API's direction-split fields. Fall back to byType
            // (which counts ALL inbound/outbound regardless of outcome).
            outboundCalls: totals.outboundCalls ?? byType.outbound ?? 0,
            inboundCalls: totals.inboundCalls ?? byType.inbound ?? 0,
            // Direction-split outcome metrics — what the cards actually need.
            // Without these the UI was showing total answered (all directions)
            // under "Incoming Answered" and hard-coding 0 for outgoing.
            inboundAnswered: totals.inboundAnswered ?? 0,
            inboundMissed: totals.inboundMissed ?? 0,
            outboundAnswered: totals.outboundAnswered ?? 0,
            outboundMissed: totals.outboundMissed ?? 0,
            missedCalls: byStatus.missed || totals.missed || 0,
            rejectedCalls: totals.rejected || 0,
            dialerCalls: totals.dialer || 0,
            assignedNumbers: response.data.assignedNumbers || (Array.isArray(data.byNumber) ? data.byNumber.length : 0),
            perAgent: response.data.perAgent || [],
            byNumber: response.data.byNumber || [],
            trend: trend
          }
          console.log('Setting callStats:', statsData)
          setCallStats(statsData)
        } else {
          setCallLogs([])
          setCallStats({
            totalCalls: 0,
            liveCalls: 0,
            outboundCalls: 0,
            callsPerDay: 0,
            inboundCalls: 0,
            missedCalls: 0,
            busyCalls: 0,
            notAnsweredCalls: 0,
            answeredCalls: 0,
            rejectedCalls: 0,
            dialerCalls: 0
          })
        }
      } catch (err) {
        setCallLogs([]);
        setCallStats({
          totalCalls: 0,
          liveCalls: 0,
          outboundCalls: 0,
          callsPerDay: 0,
          inboundCalls: 0,
          missedCalls: 0,
          busyCalls: 0,
          notAnsweredCalls: 0,
          answeredCalls: 0,
          rejectedCalls: 0,
          dialerCalls: 0
        });
      }
    };
    fetchCallLogsAndStats();
  }, [token, user?.businessId]);
  const [breakTimeAgents, setBreakTimeAgents] = useState(0);
  const [breakTimeAgentDetails, setBreakTimeAgentDetails] = useState([]);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const [callUses, setCallUses] = useState([]);
  const [liveCalls, setLiveCalls] = useState([]);
  const [liveCallsCount, setLiveCallsCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(callUses.length / pageSize);
  const paginatedCallUses = callUses.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  // --- Centralized refresh functions ---
  const fetchAgents = async () => {
    if (!token || !user?.businessId) return;
    try {
      const response = await axios.get(getApiUrl(`/api/branch/${user.businessId}/branches`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const agentList = response.data.data;
        setAgents(agentList.length);
        setBranches(agentList || []);
        let active = 0, deactive = 0;
        agentList.forEach(agent => {
          const status = agent.user && agent.user.status ? agent.user.status.toLowerCase() : '';
          if (status === 'active') active++;
          else if (status === 'inactive') deactive++;
        });
        setAgentStatuses(prev => ({ ...prev, active, deactive }));
      } else {
        setAgents(0);
        setAgentStatuses(prev => ({ ...prev, active: 0, deactive: 0 }));
      }
    } catch (err) {
      setAgents(0);
      setAgentStatuses(prev => ({ ...prev, active: 0, deactive: 0 }));
    }
  };

  const refreshCallData = async () => {
    if (!token || !user?.businessId) return;
    try {
      const response = await axios.get(getApiUrl(`/api/call-uses/today/business/${user.businessId}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        const data = response.data;
        const totals = data.totals || {};
        const byType = data.byType || {};
        const byStatus = data.byStatus || {};
        let trend = null;
        if (Array.isArray(data.byTime) && data.byTime.length > 0) {
          const labels = data.byTime.map(t => t.label || t.time || t.hour || String(t.timestamp || ''));
          const outbound = data.byTime.map(t => t.outbound || 0);
          const inbound = data.byTime.map(t => t.inbound || 0);
          const missed = data.byTime.map(t => t.missed || 0);
          trend = { labels, outbound, inbound, missed };
        } else if (Array.isArray(data.byHour) && data.byHour.length > 0) {
          const labels = data.byHour.map(t => t.hour || t.label || String(t.timestamp || ''));
          const outbound = data.byHour.map(t => t.outbound || 0);
          const inbound = data.byHour.map(t => t.inbound || 0);
          const missed = data.byHour.map(t => t.missed || 0);
          trend = { labels, outbound, inbound, missed };
        } else if (data.timeSeries && Array.isArray(data.timeSeries)) {
          const labels = data.timeSeries.map(t => t.label || t.time || String(t.timestamp || ''));
          const outbound = data.timeSeries.map(t => t.outbound || 0);
          const inbound = data.timeSeries.map(t => t.inbound || 0);
          const missed = data.timeSeries.map(t => t.missed || 0);
          trend = { labels, outbound, inbound, missed };
        }

        setCallLogs([]);
        setCallStats({
          totalCalls: totals.totalCalls || 0,
          totalDuration: totals.totalDuration || 0,
          answered: byStatus.answered || 0,
          successful: totals.successful || 0,
          failed: totals.failed || 0,
          outboundCalls: totals.outboundCalls ?? byType.outbound ?? 0,
          inboundCalls: totals.inboundCalls ?? byType.inbound ?? 0,
          inboundAnswered: totals.inboundAnswered ?? 0,
          inboundMissed: totals.inboundMissed ?? 0,
          outboundAnswered: totals.outboundAnswered ?? 0,
          outboundMissed: totals.outboundMissed ?? 0,
          missedCalls: byStatus.missed || totals.missed || 0,
          busyCalls: byStatus.busy || 0,
          notAnsweredCalls: byStatus['not-answered'] || 0,
          rejectedCalls: totals.rejected || 0,
          dialerCalls: totals.dialer || 0,
          assignedNumbers: response.data.assignedNumbers || (Array.isArray(data.byNumber) ? data.byNumber.length : 0),
          perAgent: response.data.perAgent || [],
          byNumber: response.data.byNumber || [],
          trend: trend
        });

        if (Array.isArray(response.data.byNumber)) {
          const dateRange = response.data.dateRange || {};
          const list = response.data.byNumber.map(item => ({ ...item, apiDate: dateRange.end || null }));
          setCallUses(list);
        } else {
          setCallUses([]);
        }
      } else {
        setCallLogs([]);
        setCallStats({
          totalCalls: 0,
          liveCalls: 0,
          outboundCalls: 0,
          callsPerDay: 0,
          inboundCalls: 0,
          missedCalls: 0,
          busyCalls: 0,
          notAnsweredCalls: 0,
          rejectedCalls: 0
        });
        setCallUses([]);
      }
    } catch (err) {
      console.error('refreshCallData err', err);
      setCallLogs([]);
      setCallStats({
        totalCalls: 0,
        liveCalls: 0,
        outboundCalls: 0,
        callsPerDay: 0,
        inboundCalls: 0,
        missedCalls: 0,
        busyCalls: 0,
        notAnsweredCalls: 0,
        rejectedCalls: 0
      });
      setCallUses([]);
    }
  };

  const refreshLiveCalls = async () => {
    if (!token || !user?.businessId) return;
    try {
      const response = await axios.get(getApiUrl(`/api/asterisk/livecalls/${user.businessId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
        }
      });
      if (response.data && response.data.success) {
        const live = response.data.liveCalls || response.data.logicalCalls || [];
        setLiveCalls(Array.isArray(live) ? live : []);
        setLiveCallsCount(Array.isArray(live) ? live.length : 0);
      } else {
        setLiveCalls([]);
        setLiveCallsCount(0);
      }
    } catch (err) {
      console.error('refreshLiveCalls err', err);
      setLiveCalls([]);
      setLiveCallsCount(0);
    }
  };

  const refreshAgentStatus = async () => {
    if (!token || !user?.businessId) return;
    try {
      const response = await axios.get(getApiUrl('/api/business/agents/status'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.data && response.data.success && response.data.data && response.data.data.summary) {
        const summary = response.data.data.summary;
        const agents = response.data.data.agents || [];
        
        setAgentSummary({
          total: summary.total || 0,
          online: summary.online || 0,
          offline: summary.offline || 0,
          lunch: summary.lunch || 0,
          break: summary.break || 0
        });
        
        // Store the full agents list for modal display
        setAgentsList(agents);
      }
    } catch (err) {
      console.error('refreshAgentStatus err', err);
      // Keep previous values on error
    }
  };

  // Central polling: refresh dynamic dashboard data every 5 seconds
  useEffect(() => {
    if (!token || !user?.businessId) return;
    const refreshAll = () => {
      fetchAgents();
      refreshCallData();
      fetchBusinessActivities(user.businessId);
      refreshLiveCalls();
      refreshAgentStatus();
    };
    refreshAll();
    const iv = setInterval(refreshAll, 5000);
    return () => clearInterval(iv);
  }, [token, user?.businessId]);
  // (token already declared above)
  // Fetch call uses for the business
  useEffect(() => {
    const fetchCallUses = async () => {
      if (!token || !user?.businessId) return;
      try {
        // Use the call-uses today endpoint for accurate data
        const response = await axios.get(getApiUrl(`/api/call-uses/today/business/${user.businessId}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        // Expecting response.byNumber as an array (per virtual number usage)
        if (response.data && response.data.success && Array.isArray(response.data.byNumber)) {
          const dateRange = response.data.dateRange || {};
          const list = response.data.byNumber.map(item => ({ ...item, apiDate: dateRange.end || null }));
          setCallUses(list);
        } else {
          setCallUses([]);
        }
      } catch (err) {
        setCallUses([]);
      }
    };
    fetchCallUses();
  }, [token, user?.businessId]);

  // Compute a dynamic greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const greeting = getGreeting();

  useEffect(() => {
    if (!token) return;
    
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(getApiUrl('/api/v1/user/details'), {
          headers: {
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache,no-store',
            'Connection': 'keep-alive',
            'Expires': '0',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
          },
        });
        if (response.data && response.data.user) {
          setUser(response.data.user);
        } else {
          // Fallback user data if API doesn't return expected structure
          setUser({ role: 'business_admin', name: 'Admin' });
        }
      } catch (error) {
        console.warn("User API failed, using fallback:", error.message);
        // Set fallback user data so dashboard still works
        setUser({ role: 'business_admin', name: 'Admin' });
      }
    };

    fetchUserDetails();
  }, [token]);

  // Fetch agent status summary from the new API
  useEffect(() => {
    if (!token || !user?.businessId) return;
    
    const fetchAgentStatus = async () => {
      try {
        const response = await axios.get(getApiUrl('/api/business/agents/status'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.data && response.data.success && response.data.data && response.data.data.summary) {
          const summary = response.data.data.summary;
          const agents = response.data.data.agents || [];
          
          setAgentSummary({
            total: summary.total || 0,
            online: summary.online || 0,
            offline: summary.offline || 0,
            lunch: summary.lunch || 0,
            break: summary.break || 0
          });
          
          // Store the full agents list for modal display
          setAgentsList(agents);
          console.log('Agent status summary updated:', summary);
        }
      } catch (error) {
        console.warn("Agent status API failed:", error.message);
        // Keep previous values on error
      }
    };

    fetchAgentStatus();
  }, [token, user?.businessId]);

  // Fetch break/lunch/offline states when business id is available
  useEffect(() => {
    if (!token || !user?.businessId) return;
    fetchBusinessActivities(user.businessId);
  }, [token, user?.businessId]);
  
  // Fetch business activities to calculate break time
  const fetchBusinessActivities = async (businessId) => {
    try {
      const response = await axios.get(getApiUrl(`/api/v1/business/${businessId}/activities`), {
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache,no-store',
          'Connection': 'keep-alive',
          'Expires': '0',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin'
        },
      });
      
      console.log('Activities API response:', response.data);
      if (response.data && Array.isArray(response.data.data)) {
        console.log('Fetched activity user list:', response.data.data);
      }
      
      // Initialize variables
      let breakCount = 0;
      let breakTimeAgents = [];
      let lunchCount = 0;
      let lunchAgents = [];
      let offlineCount = 0;
      
      // Check if we have a valid response with data
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // Each entry in the data array represents a user with their activities
        const usersData = response.data.data;
        
        // Find users who are currently on break
        const usersOnBreak = usersData.filter(userData => {
          // Check if user has activities
          if (userData.activities && Array.isArray(userData.activities) && userData.activities.length > 0) {
            // Get the most recent activity (first in the array)
            const latestActivity = userData.activities[0];
            
            // Check if the latest activity is a break and has not ended
            return (
              latestActivity.status?.toLowerCase() === 'break' && 
              latestActivity.start_time && 
              !latestActivity.end_time
            );
          }
          return false;
        });
        
        breakCount = usersOnBreak.length;

        // Find users currently on lunch
        const usersOnLunch = usersData.filter(userData => {
          if (userData.activities && Array.isArray(userData.activities) && userData.activities.length > 0) {
            const latestActivity = userData.activities[0];
            return (
              latestActivity.status?.toLowerCase() === 'lunch' &&
              latestActivity.start_time &&
              !latestActivity.end_time
            );
          }
          return false;
        });

        lunchCount = usersOnLunch.length;
        lunchAgents = usersOnLunch.map(u => ({ id: u.user?._id, name: u.user?.name }));

        // Create detailed information for each user on break
        breakTimeAgents = usersOnBreak.map(userData => {
          const latestActivity = userData.activities[0];
          const startTime = new Date(latestActivity.start_time);
          const now = new Date();
          const durationMinutes = Math.floor((now - startTime) / 60000); // Calculate duration in minutes
          
          return {
            id: userData.user?._id || 'unknown',
            name: userData.user?.name || 'Unknown User',
            startTime: latestActivity.start_time,
            duration: durationMinutes,
            status: latestActivity.status
          };
        });
        
        console.log(`Found ${breakCount} users currently on break`);
        console.log(`Found ${lunchCount} users currently on lunch`);

        // Find users currently online (activity-first, fallback to user.status)
        const usersOnline = usersData.filter(userData => {
          if (userData.activities && Array.isArray(userData.activities) && userData.activities.length > 0) {
            const latestActivity = userData.activities[0];
            return latestActivity.status?.toLowerCase() === 'online' && latestActivity.start_time && !latestActivity.end_time;
          }
          const userStatus = (userData.user && userData.user.status) ? userData.user.status.toLowerCase() : '';
          return userStatus === 'active' || userStatus === 'online';
        });

        const onlineCount = usersOnline.length;

        // Derive offline count: prefer activity-based detection, otherwise estimate from total agents
        const offlineByActivity = usersData.filter(userData => {
          const userStatus = (userData.user && userData.user.status) ? userData.user.status.toLowerCase() : '';
          if (userStatus === 'inactive' || userStatus === 'offline') return true;
          if (userData.activities && Array.isArray(userData.activities) && userData.activities.length > 0) {
            const latestActivity = userData.activities[0];
            const s = (latestActivity.status || '').toLowerCase();
            return (s === 'offline' || s === 'logged_out' || s === 'away');
          }
          return false;
        }).length;

        // Fallback offline estimation subtracts known online/break/lunch counts from total agents
        offlineCount = offlineByActivity || Math.max(0, (agents || 0) - onlineCount - breakCount - lunchCount);

        // Ensure we update online status below
        setAgentStatuses(prevStatus => ({ ...prevStatus, online: onlineCount }));
      } 
      
      // Update states
      setBreakTimeAgents(breakCount);
      setBreakTimeAgentDetails(breakTimeAgents);
      
      // Calculate total break time in minutes (sum of all individual break durations)
      const totalMinutes = breakTimeAgents.reduce((total, agent) => total + (agent.duration || 0), 0);
      setTotalBreakTime(totalMinutes);
      
      // Update agent statuses with the accurate break/lunch/offline/online counts
      setAgentStatuses(prevStatus => ({
        ...prevStatus,
        break: breakCount,
        lunch: lunchCount,
        offline: offlineCount,
        online: prevStatus.online || 0
      }));
      
      console.log(`Updated break time agents count to ${breakCount} with ${breakTimeAgents.length} detailed records`);
      
    } catch (error) {
      console.error("Error fetching business activities:", error.message);
      console.error("Error details:", error);
      // Don't update break time agents on error to preserve previous value
    }
  };  // Function to fetch call statistics with optional time filter

  // Prepare numbers list for the right-side panel (prefer API-byNumber, fallback to callUses)
  const numbersList = (callStats?.byNumber && callStats.byNumber.length) ? callStats.byNumber : callUses;
  const topNumber = (numbersList && numbersList.length) ? numbersList[0] : null;

  // Resolve an assigned branch/agent name for a given number item (by virtual number or extension)
  const getAssignedName = (item) => {
    if (!item) return '';
    // Prefer explicit name if the API already provides one
    if (item.name && item.name !== item.virtualNumber) return item.name;

    // Try to match by virtualNumber / number / didNumber
    const did = item.virtualNumber || item.number || item.didNumber || null;
    if (did && Array.isArray(branches) && branches.length) {
      const matchByDid = branches.find(b => Array.isArray(b.didNumbers) && b.didNumbers.map(String).includes(String(did)));
      if (matchByDid) return matchByDid.branchName || (matchByDid.user && matchByDid.user.name) || '';
    }

    // Try to match by extension field against branch extensionShifts or shifts
    const ext = item.extension || item.ext || null;
    if (ext && Array.isArray(branches) && branches.length) {
      const matchByExt = branches.find(b => {
        if (Array.isArray(b.extensionShifts) && b.extensionShifts.some(s => String(s.extension) === String(ext))) return true;
        if (Array.isArray(b.shifts) && b.shifts.some(s => String(s.extension) === String(ext))) return true;
        // Also check department members for a matching didNumber or phone
        if (b.department && Array.isArray(b.department.members)) {
          if (b.department.members.some(m => String(m.didNumber) === String(did) || String(m.phone) === String(did) || String(m.didNumber) === String(ext) || String(m.phone) === String(ext))) return true;
        }
        return false;
      });
      if (matchByExt) return matchByExt.branchName || (matchByExt.user && matchByExt.user.name) || '';
    }

    // Fallback: show extension label if present
    if (item.extension) return `Ext ${item.extension}`;
    return '';
  };

  // Prepare chart data: prioritize per-agent breakdown, fallback to trend or sample
  // Helper: pick first numeric field present in an object from a list of keys
  const pickNum = (obj, keys) => {
    if (!obj) return 0;
    for (const k of keys) {
      if (obj[k] != null) return obj[k];
    }
    return 0;
  };

  const fallbackChartData = {
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    datasets: [
      { label: 'Outbound', data: [30,80,40,60,90,120,70,50,80,60,70,90], backgroundColor: '#1976d2' },
      { label: 'Inbound', data: [10,20,30,10,20,40,10,20,30,10,20,30], backgroundColor: '#388e3c' },
      { label: 'Missed', data: [20,60,10,40,30,60,30,20,40,30,50,60], backgroundColor: '#ff7043' }
    ]
  };

  const chartData = (() => {
    // Check if there are any calls today
    const hasCalls = callStats?.totalCalls && callStats.totalCalls > 0;
    
    // If no calls, return null (don't show dummy data)
    if (!hasCalls) {
      return null;
    }

    // Show status breakdown (Answered, Missed, Busy, Not Answered)
    return {
      labels: ['Call Status Breakdown'],
      datasets: [
        { label: 'Answered', data: [callStats?.answered ?? 0], backgroundColor: '#388e3c' },
        { label: 'Missed', data: [callStats?.missedCalls ?? 0], backgroundColor: '#d32f2f' },
        { label: 'Busy', data: [callStats?.busyCalls ?? 0], backgroundColor: '#1976d2' },
        { label: 'Not Answered', data: [callStats?.notAnsweredCalls ?? 0], backgroundColor: '#f57c00' }
      ]
    };
  })();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: { stacked: false, grid: { display: false } },
      y: { stacked: false, beginAtZero: true }
    }
  };

  return (
    <Box className="page-container" sx={{ p: 2 }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          {greeting}, {user?.name || 'User'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
          Monitor your business communication metrics and agent status
        </Typography>
      </Box>

      {/* Legacy top stats cards removed in favor of consolidated metric cards below */}

      {/* Additional Metric Cards (as small cards matching requested fields) */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {(() => {
          const today = getTodayDateString();
          const cards = [
            { key: 'active', title: 'Active Calls', value: liveCallsCount ?? 0, icon: <PhoneIcon />, onClick: () => navigate('/callmonitor') },
            { key: 'today', title: 'Calls Today', value: callStats?.totalCalls ?? 0, icon: <CallIcon />, onClick: () => navigate(`/callogs?from=${today}&to=${today}`) },
            { key: 'incoming', title: 'Incoming Calls', value: callStats?.inboundCalls ?? 0, icon: <CallReceivedIcon />, onClick: () => navigate(`/callogs?type=Inbound&from=${today}&to=${today}`) },
            { key: 'inc_answered', title: 'Incoming Answered', value: callStats?.inboundAnswered ?? 0, icon: <CallReceivedIcon />, onClick: () => navigate(`/callogs?type=Inbound&filter=Answered&from=${today}&to=${today}`) },
            { key: 'inc_missed', title: 'Incoming Missed', value: callStats?.inboundMissed ?? 0, icon: <CallMissedIcon />, onClick: () => navigate(`/callogs?type=Inbound&filter=Missed&from=${today}&to=${today}`) },
            { key: 'outgoing', title: 'Outgoing Calls', value: callStats?.outboundCalls ?? 0, icon: <CallMadeIcon />, onClick: () => navigate(`/callogs?type=Outbound&from=${today}&to=${today}`) },
            { key: 'out_ans', title: 'Outgoing Answered', value: callStats?.outboundAnswered ?? 0, icon: <CallMadeIcon />, onClick: () => navigate(`/callogs?type=Outbound&filter=Answered&from=${today}&to=${today}`) },
            { key: 'out_missed', title: 'Outgoing Missed', value: callStats?.outboundMissed ?? 0, icon: <CallMissedIcon />, onClick: () => navigate(`/callogs?type=Outbound&filter=Missed&from=${today}&to=${today}`) },
            { key: 'total_agents', title: 'Total Agents', value: agentSummary?.total ?? agents ?? 0, icon: <GroupIcon />, onClick: () => navigate('/branch') },
            // Note: this card counts BUSY CALLS today (status == busy), not
            // busy agents. The label is "Busy Calls" to match the metric.
            { key: 'busy_calls', title: 'Busy Calls', value: callStats?.busyCalls ?? 0, icon: <CallIcon />, onClick: () => navigate(`/callogs?filter=Busy&from=${today}&to=${today}`) },
            { key: 'agents_offline', title: 'Agents Offline', value: agentSummary?.offline ?? agentStatuses.offline ?? 0, icon: <GroupIcon />, onClick: (e) => { setSelectedAgentStatus('offline'); setAgentPopperAnchor(e.currentTarget); } },
            { key: 'agents_available', title: 'Agents Available', value: agentSummary?.online ?? agentStatuses.online ?? 0, icon: <GroupIcon />, onClick: (e) => { setSelectedAgentStatus('online'); setAgentPopperAnchor(e.currentTarget); } }
          ];

          return cards.map((c, i) => (
            <Grid item xs={12} sm={6} md={3} key={c.key}>
              <Card
                onClick={c.onClick}
                sx={{ borderRadius: 2, height: '100%', cursor: c.onClick ? 'pointer' : 'default', transition: 'all 0.2s ease', '&:hover': { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)', transform: c.onClick ? 'translateY(-2px)' : 'none' } }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{c.title}</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{c.value}</Typography>
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(108, 92, 231, 0.1)' }}>
                      {React.cloneElement(c.icon, { sx: { color: 'var(--primary-500)', fontSize: 24 } })}
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>{c.title}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ));
        })()}
      </Grid>
      {/* Main Content Grid */}
      <Grid container spacing={2}>
        {/* Left Section - Chart and Calls */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={2}>
            {/* Chart Card */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardHeader
                  title={
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Call Statistics Today</Typography>
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>Answered, missed, busy, and not answered calls breakdown</Typography>
                    </Box>
                  }
                  action={
                    <Button
                      size="small"
                      startIcon={<OpenInNewIcon fontSize="small" />}
                      onClick={() => navigate('/callogs')}
                      sx={{ textTransform: 'none' }}
                    >
                      View All Calls
                    </Button>
                  }
                />
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Answered</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#388e3c', mt: 0.5 }}>
                        {callStats?.answered ?? 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Missed</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#d32f2f', mt: 0.5 }}>
                        {callStats?.missedCalls ?? 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Busy</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', mt: 0.5 }}>
                        {callStats?.busyCalls ?? 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Not Answered</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#f57c00', mt: 0.5 }}>
                        {callStats?.notAnsweredCalls ?? 0}
                      </Typography>
                    </Box>
                  </Box>
                  {chartData ? (
                    <Box sx={{ height: 340, className: 'dashboard-chart-container' }}>
                      <Bar data={chartData} options={chartOptions} />
                    </Box>
                  ) : (
                    <Box sx={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f9fafb', borderRadius: 1, border: '1px dashed #e5e7eb' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <CallIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                          No calls today
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mt: 0.5 }}>
                          Call data will appear here when calls are made
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Most Handled Numbers Card */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardHeader
                  title={
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Most Handled Numbers</Typography>
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>Top virtual numbers by call volume</Typography>
                    </Box>
                  }
                  action={
                    <Button
                      size="small"
                      startIcon={<OpenInNewIcon fontSize="small" />}
                      onClick={() => navigate('/virtual-numbers')}
                      sx={{ textTransform: 'none' }}
                    >
                      Manage Numbers
                    </Button>
                  }
                />
                <CardContent>
                  {topNumber ? (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1.5, bgcolor: 'rgba(108, 92, 231, 0.05)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography sx={{ fontWeight: 700 }}>{topNumber.virtualNumber || topNumber.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{getAssignedName(topNumber)}</Typography>
                        </Box>
                        <Chip label={`${topNumber.totalCalls || 0} calls`} color="primary" variant="outlined" />
                      </Box>
                    </Paper>
                  ) : null}
                  <List dense sx={{ p: 0 }}>
                    {(numbersList || []).slice(0, 5).map((it, i) => (
                      <ListItem key={i} sx={{ px: 0, py: 1, display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{it.virtualNumber || it.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{getAssignedName(it)}</Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 600 }}>{it.totalCalls || 0}</Typography>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Section - Agent Status & Info */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2}>
            {/* Agent Status Card */}
            <Grid item xs={12} sm={6} lg={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardHeader
                  title={
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Agent Status</Typography>
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>Real-time agent availability</Typography>
                    </Box>
                  }
                  action={
                    <Button
                      size="small"
                      startIcon={<OpenInNewIcon fontSize="small" />}
                      onClick={() => navigate('/branch')}
                      sx={{ textTransform: 'none' }}
                    >
                      Manage
                    </Button>
                  }
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(108, 92, 231, 0.1)' }}>
                        <GroupIcon sx={{ color: 'var(--primary-500)', fontSize: 24 }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Total Agents</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{agentSummary?.total ?? agents ?? 0}</Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box
                      ref={onlineStatusRef}
                      onClick={(e) => {
                        setSelectedAgentStatus('online');
                        setAgentPopperAnchor(e.currentTarget);
                      }}
                      sx={{
                        flex: 1,
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: 'rgba(0, 184, 148, 0.05)',
                        border: '1px solid rgba(0, 184, 148, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: 'rgba(0, 184, 148, 0.1)', borderColor: 'rgba(0, 184, 148, 0.4)', transform: 'translateY(-2px)' }
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Online</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--completed)' }}>
                        {agentSummary?.online ?? 0}
                      </Typography>
                    </Box>

                    <Box
                      ref={offlineStatusRef}
                      onClick={(e) => {
                        setSelectedAgentStatus('offline');
                        setAgentPopperAnchor(e.currentTarget);
                      }}
                      sx={{
                        flex: 1,
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: 'rgba(85, 163, 255, 0.05)',
                        border: '1px solid rgba(85, 163, 255, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: 'rgba(85, 163, 255, 0.1)', borderColor: 'rgba(85, 163, 255, 0.4)', transform: 'translateY(-2px)' }
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Offline</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--incoming)' }}>
                        {agentSummary?.offline ?? 0}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box 
                      onClick={(e) => {
                        setSelectedAgentStatus('break');
                        setAgentPopperAnchor(e.currentTarget);
                      }}
                      sx={{ 
                        flex: 1, 
                        p: 1.5, 
                        borderRadius: 1.5, 
                        bgcolor: 'rgba(249, 115, 22, 0.05)',
                        border: '1px solid rgba(249, 115, 22, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          bgcolor: 'rgba(249, 115, 22, 0.1)', 
                          borderColor: 'rgba(249, 115, 22, 0.4)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Break</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#f59e0b' }}>{agentSummary?.break ?? 0}</Typography>
                    </Box>

                    <Box 
                      onClick={(e) => {
                        setSelectedAgentStatus('lunch');
                        setAgentPopperAnchor(e.currentTarget);
                      }}
                      sx={{ 
                        flex: 1, 
                        p: 1.5, 
                        borderRadius: 1.5, 
                        bgcolor: 'rgba(59, 130, 246, 0.05)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          bgcolor: 'rgba(59, 130, 246, 0.1)', 
                          borderColor: 'rgba(59, 130, 246, 0.4)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Lunch</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#3b82f6' }}>{agentSummary?.lunch ?? 0}</Typography>
                    </Box>

                    <Box
                      onClick={(e) => {
                        setSelectedAgentStatus('bio_break');
                        setAgentPopperAnchor(e.currentTarget);
                      }}
                      sx={{
                        flex: 1,
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: 'rgba(0, 188, 212, 0.05)',
                        border: '1px solid rgba(0, 188, 212, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(0, 188, 212, 0.1)',
                          borderColor: 'rgba(0, 188, 212, 0.4)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Bio Break</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#00bcd4' }}>{agentSummary?.bio_break ?? 0}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Assigned Numbers Card */}
            <Grid item xs={12} sm={6} lg={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(240, 180, 0, 0.1)' }}>
                        <StorefrontIcon sx={{ color: '#f0b400', fontSize: 24 }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Assigned Numbers</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{callStats?.assignedNumbers ?? (callStats?.byNumber?.length ?? 0)}</Typography>
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => navigate('/virtual-numbers')}
                      sx={{ textTransform: 'none' }}
                    >
                      View
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Agent Modal - Centered */}
      <Modal
        open={Boolean(agentPopperAnchor)}
        onClose={() => setAgentPopperAnchor(null)}
        BackdropComponent={Backdrop}
        BackdropProps={{
          sx: { 
            backdropFilter: 'blur(3px)', 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1300
          }
        }}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1300
        }}
      >
        <Card 
          sx={{ 
            width: '90%',
            maxWidth: 450,
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            borderRadius: 3,
            animation: 'fadeInScale 0.3s ease-out',
            position: 'relative',
            zIndex: 1350,
            backgroundColor: '#ffffff'
          }}
        >
          <CardHeader
            title={
              <Typography variant="h6" sx={{ fontWeight: 700, textTransform: 'capitalize', color: '#1f2937' }}>
                {selectedAgentStatus === 'online' ? '🟢 Online Agents' :
                 selectedAgentStatus === 'offline' ? '🔴 Offline Agents' :
                 selectedAgentStatus === 'break' ? '⏸️ Agents on Break' :
                 selectedAgentStatus === 'lunch' ? '🍽️ Agents on Lunch' :
                 selectedAgentStatus === 'bio_break' ? '🚻 Agents on Bio Break' : 'Agents'}
              </Typography>
            }
            sx={{ 
              backgroundColor: 
                selectedAgentStatus === 'online' ? 'rgba(0, 184, 148, 0.05)' :
                selectedAgentStatus === 'offline' ? 'rgba(229, 231, 235, 0.5)' :
                selectedAgentStatus === 'break' ? 'rgba(249, 115, 22, 0.05)' :
                selectedAgentStatus === 'lunch' ? 'rgba(59, 130, 246, 0.05)' :
                selectedAgentStatus === 'bio_break' ? 'rgba(0, 188, 212, 0.05)' : 'rgba(229, 231, 235, 0.5)',
              borderBottom: '1px solid #e5e7eb'
            }}
          />
          <CardContent sx={{ p: 2 }}>
            <List sx={{ p: 0 }}>
              {agentsList
                .filter(agent => agent.status?.toLowerCase() === selectedAgentStatus)
                .map((agent, index) => (
                  <ListItem
                    key={agent.id || index}
                    sx={{
                      px: 1.5,
                      py: 1.5,
                      borderBottom: '1px solid #e5e7eb',
                      '&:last-child': { borderBottom: 'none' },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      transition: 'all 0.2s ease',
                      '&:hover': { 
                        bgcolor: 'rgba(108, 92, 231, 0.08)',
                        paddingLeft: 2.5
                      }
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 0.5, color: '#1f2937' }}>
                      {agent.name || 'Unknown Agent'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      📧 {agent.email || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      📱 {agent.phone || 'N/A'}
                    </Typography>
                    {selectedAgentStatus === 'offline' && agent.lastSeen && (
                      <Typography variant="caption" sx={{ mt: 0.5, color: '#999', fontSize: '0.8rem' }}>
                        Last seen: {new Date(agent.lastSeen).toLocaleString()}
                      </Typography>
                    )}
                  </ListItem>
                ))}
              {agentsList.filter(agent => agent.status?.toLowerCase() === selectedAgentStatus).length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3, fontStyle: 'italic', fontSize: '0.9rem' }}>
                  No {selectedAgentStatus} agents at the moment
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      </Modal>
    </Box>
  );
};

export default Dashboard;
