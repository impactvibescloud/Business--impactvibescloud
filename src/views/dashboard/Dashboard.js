import React from "react";
import axios from "axios";
import { useEffect, useState } from "react";
import { isAutheticated } from "../../auth.js";
// WidgetsDropdown no longer used in this layout
import { API_CONFIG, getBaseURL } from "../../config/api";
import { Box, Grid, Card, CardContent, Typography, Button, Paper, Chip, List, ListItem, ListItemText, IconButton } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import StorefrontIcon from '@mui/icons-material/Storefront'
import GroupIcon from '@mui/icons-material/Group'
import CallIcon from '@mui/icons-material/Call'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Helper function to get API URL
const getApiUrl = (path) => {
  const baseUrl = getBaseURL();
  // Remove any duplicate slashes between baseUrl and path
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const token = isAutheticated();

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [agents, setAgents] = useState(0);
  const [branches, setBranches] = useState([]);
  const [agentStatuses, setAgentStatuses] = useState({ active: 0, deactive: 0, break: 0, lunch: 0, offline: 0, online: 0 });
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
    rejectedCalls: 0
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
          setCallStats({
            totalCalls: totals.totalCalls || 0,
            totalDuration: totals.totalDuration || 0,
            answered: byStatus.answered || 0,
            successful: totals.successful || 0,
            failed: totals.failed || 0,
            outboundCalls: byType.outbound || 0,
            inboundCalls: byType.inbound || 0,
            missedCalls: totals.missed || 0,
            rejectedCalls: totals.rejected || 0,
            assignedNumbers: response.data.assignedNumbers || (Array.isArray(data.byNumber) ? data.byNumber.length : 0),
            perAgent: response.data.perAgent || [],
            byNumber: response.data.byNumber || [],
            trend: trend
          })
        } else {
          setCallLogs([])
          setCallStats({
            totalCalls: 0,
            liveCalls: 0,
            outboundCalls: 0,
            callsPerDay: 0,
            inboundCalls: 0,
            missedCalls: 0,
            rejectedCalls: 0
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
          rejectedCalls: 0
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
          outboundCalls: byType.outbound || 0,
          inboundCalls: byType.inbound || 0,
          missedCalls: totals.missed || 0,
          rejectedCalls: totals.rejected || 0,
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

  // Central polling: refresh dynamic dashboard data every 5 seconds
  useEffect(() => {
    if (!token || !user?.businessId) return;
    const refreshAll = () => {
      fetchAgents();
      refreshCallData();
      fetchBusinessActivities(user.businessId);
      refreshLiveCalls();
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
    // 1) If perAgent data exists, show agent-wise breakdown (Outbound/Inbound/Missed)
    if (callStats && Array.isArray(callStats.perAgent) && callStats.perAgent.length) {
      const labels = callStats.perAgent.map(a => a.name || a.agentId || 'Agent');
      const outbound = callStats.perAgent.map(a => pickNum(a, ['outbound', 'outboundCalls', 'outbound_calls', 'outbound_count', 'out']));
      const inbound = callStats.perAgent.map(a => pickNum(a, ['inbound', 'inboundCalls', 'inbound_calls', 'inbound_count', 'in']));
      const missed = callStats.perAgent.map(a => pickNum(a, ['missed', 'missedCalls', 'missed_calls', 'missed_count', 'miss']));
      return {
        labels,
        datasets: [
          { label: 'Outbound', data: outbound, backgroundColor: '#1976d2' },
          { label: 'Inbound', data: inbound, backgroundColor: '#388e3c' },
          { label: 'Missed', data: missed, backgroundColor: '#ff7043' }
        ]
      };
    }

    // 2) Next prefer the time-series trend from API
    if (callStats && callStats.trend && Array.isArray(callStats.trend.labels) && callStats.trend.labels.length) {
      // trend.* are arrays aligned with labels; attempt to use them, falling back to 0
      const outArr = Array.isArray(callStats.trend.outbound) ? callStats.trend.outbound.map(n => n || 0) : [];
      const inArr = Array.isArray(callStats.trend.inbound) ? callStats.trend.inbound.map(n => n || 0) : [];
      const missArr = Array.isArray(callStats.trend.missed) ? callStats.trend.missed.map(n => n || 0) : [];
      // If missed array is all zeros but total missedCalls exists, try alternative trend fields preserved on trend.raw (if any)
      return {
        labels: callStats.trend.labels,
        datasets: [
          { label: 'Outbound', data: outArr.length ? outArr : (callStats.trend.outbound || []), backgroundColor: '#1976d2' },
          { label: 'Inbound', data: inArr.length ? inArr : (callStats.trend.inbound || []), backgroundColor: '#388e3c' },
          { label: 'Missed', data: missArr.length ? missArr : (callStats.trend.missed || []), backgroundColor: '#ff7043' }
        ]
      };
    }

    // 3) Fallback sample data
    return fallbackChartData;
  })();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true }
    }
  };

  return (
    <>
      <Box sx={{ my: 2 }}>
            <Typography variant="h4" className="contact-list-title" sx={{ fontWeight: 700 }}>{greeting}, {user?.name || 'User'}</Typography>
          </Box>

      <Grid container spacing={2}>
        {/* Left main area */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2, position: 'relative', overflow: 'visible', color: '#fff', background: 'linear-gradient(135deg, #1976d2, #1565c0)', p: 2 }}>
                <CardContent sx={{ position: 'relative', zIndex: 2 }}>
                  <IconButton aria-label="redirect" onClick={() => navigate('/callogs')} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 3, pointerEvents: 'auto', bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', width: 40, height: 40, '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' }, boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CallIcon sx={{ color: '#fff' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>Total Calls</Typography>
                        <Typography variant="h2" sx={{ mt: 1, fontWeight: 900, fontSize: '2.4rem', lineHeight: 1 }}>{callStats?.totalCalls ?? 0}</Typography>
                        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>Calls today</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: 'right', pr: 6 }}>
                      <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>Answered Calls</Typography>
                      <Typography variant="h2" sx={{ mt: 1, fontWeight: 900, fontSize: '2.4rem', lineHeight: 1 }}>{callStats?.answered ?? 0}</Typography>
                      <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>Answered today</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 4, mt: 2, alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>Missed</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{callStats?.missedCalls ?? 0}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>Inbound</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{callStats?.inboundCalls ?? 0}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>Outbound</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{callStats?.outboundCalls ?? 0}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ position: 'absolute', right: -32, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', zIndex: 1, pointerEvents: 'none' }} />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Call Chart (Today)</Typography>
                  <Box sx={{ height: 340 }}>
                    {/* Stacked bar chart (uses API trend data when available) */}
                    <Bar
                      data={chartData}
                      options={chartOptions}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right side panel */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card sx={{ borderRadius: 2, position: 'relative', overflow: 'visible', color: '#fff', background: 'linear-gradient(90deg, #2e7d32, #43a047)', p: 2, minHeight: 120 }}>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GroupIcon sx={{ color: '#fff' }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.95)' }}>Total Agents</Typography>
                        <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 800 }}>{agents ?? 0}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: 'right', pr: 6 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.95)' }}>Active Agents</Typography>
                      <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 800 }}>{agentStatuses?.active ?? 0}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>Online</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{agentStatuses?.online ?? 0}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>Offline</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{agentStatuses?.offline ?? 0}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>Break</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{agentStatuses?.break ?? 0}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>Lunch</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{agentStatuses?.lunch ?? 0}</Typography>
                    </Box>
                  </Box>
                </CardContent>
                <IconButton aria-label="redirect" onClick={() => navigate('/branch')} sx={{ position: 'absolute', right: 12, top: 12, zIndex: 3, pointerEvents: 'auto', bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', width: 40, height: 40, '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' }, boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Card> 

            <Card sx={{ borderRadius: 2, position: 'relative', overflow: 'visible', color: '#fff', background: 'linear-gradient(90deg, var(--primary-500), var(--primary-600))', p: 2 }}>
              <CardContent sx={{ p: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AccountBalanceWalletIcon sx={{ color: '#fff' }} />
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800 }}>{liveCallsCount ?? 0}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>Live Calls</Typography>
                  </Box>
                </Box>
              </CardContent>

              <IconButton aria-label="redirect" onClick={() => navigate('/billing')} sx={{ position: 'absolute', right: 12, top: 12, zIndex: 3, pointerEvents: 'auto', bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', width: 40, height: 40, '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' }, boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Card>

            {/* Secondary white info card (matches reference image) */}
            <Card sx={{ borderRadius: 2, p: 1, bgcolor: '#fff', boxShadow: '0 6px 18px rgba(16,24,40,0.06)', position: 'relative' }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 1.5, bgcolor: '#fff8e6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.03)' }}>
                    <StorefrontIcon sx={{ color: '#f0b400' }} />
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{callStats?.assignedNumbers ?? (callStats?.byNumber?.length ?? 0)}</Typography>
                    <Typography variant="body2" color="text.secondary">Assigned Numbers</Typography>
                  </Box>
                </Box>
              </CardContent>

              <IconButton aria-label="redirect" onClick={() => navigate('/virtual-numbers')} sx={{ position: 'absolute', right: 12, top: 12, zIndex: 3, pointerEvents: 'auto', bgcolor: 'var(--primary-600)', color: '#fff', width: 40, height: 40, '&:hover': { bgcolor: 'var(--primary-500)' }, boxShadow: '0 6px 18px rgba(90,70,235,0.12)' }}>
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Card>

            <Card sx={{ borderRadius: 2, p: 2 }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">Most Handled Calls</Typography>
                  <IconButton size="small" sx={{ color: 'text.secondary' }}>
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'rgba(98,78,255,0.06)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{topNumber ? (topNumber.virtualNumber || topNumber.name) : '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{topNumber ? getAssignedName(topNumber) : ''}</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700 }}>{topNumber ? `${topNumber.totalCalls || 0} calls` : '—'}</Typography>
                  </Box>
                </Paper>

                <List dense sx={{ p: 0 }}>
                  {(numbersList || []).map((it, i) => (
                    <ListItem key={i} sx={{ px: 0, display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontWeight: 700 }}>{it.virtualNumber || it.name || `Number ${i+1}`}</Typography>
                        <Typography variant="caption" color="text.secondary">{getAssignedName(it)}</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 700, ml: 'auto' }}>{(it.totalCalls != null) ? `${it.totalCalls} calls` : '-'}</Typography>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default Dashboard;
