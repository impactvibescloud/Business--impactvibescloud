import React from "react";
import axios from "axios";
import { useEffect, useState } from "react";
import { isAutheticated } from "../../auth.js";
import WidgetsDropdown from "../widgets/WidgetsDropdown.js";
import { API_CONFIG, getBaseURL } from "../../config/api";

// Helper function to get API URL
const getApiUrl = (path) => {
  const baseUrl = getBaseURL();
  // Remove any duplicate slashes between baseUrl and path
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const token = isAutheticated();

const Dashboard = () => {
  const [user, setUser] = useState({});
  const [agents, setAgents] = useState(0);
  const [agentStatuses, setAgentStatuses] = useState({ active: 0, deactive: 0, break: 0 });
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
        // Use the dedicated today endpoint to fetch daily statistics from the server
        const response = await axios.get(getApiUrl(`/api/call-logs/today?businessId=${user.businessId}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.data && response.data.success && response.data.statistics) {
          const stats = response.data.statistics || {}
          setCallLogs([]) // dashboard widgets derive numbers from stats, not full logs
          setCallStats({
            totalCalls: stats.totalCalls || 0,
            liveCalls: 0,
            outboundCalls: (stats.callsByType && stats.callsByType.outbound) || 0,
            callsPerDay: stats.totalCalls || 0,
            inboundCalls: (stats.callsByType && stats.callsByType.inbound) || 0,
            missedCalls: (stats.callsByStatus && stats.callsByStatus.missed) || 0,
            rejectedCalls: (stats.callsByStatus && stats.callsByStatus.rejected) || 0
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(callUses.length / pageSize);
  const paginatedCallUses = callUses.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  // (token already declared above)
  // Fetch call uses for the business
  useEffect(() => {
    const fetchCallUses = async () => {
      if (!token || !user?.businessId) return;
      try {
        // Use the dedicated today endpoint to get daily call uses
        const response = await axios.get(getApiUrl(`/api/call-uses/today?businessId=${user.businessId}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        // Expecting response.perUserNumber as an array (per-day usage per virtual number/user)
        if (response.data && response.data.success && Array.isArray(response.data.perUserNumber)) {
          // keep the raw perUserNumber list; add response date for display if present
          const date = response.data.date || null;
          const list = response.data.perUserNumber.map(item => ({ ...item, apiDate: date }));
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
      } 
      
      // Update states
      setBreakTimeAgents(breakCount);
      setBreakTimeAgentDetails(breakTimeAgents);
      
      // Calculate total break time in minutes (sum of all individual break durations)
      const totalMinutes = breakTimeAgents.reduce((total, agent) => total + (agent.duration || 0), 0);
      setTotalBreakTime(totalMinutes);
      
      // Update agent statuses with the accurate break count
      setAgentStatuses(prevStatus => ({
        ...prevStatus,
        break: breakCount
      }));
      
      console.log(`Updated break time agents count to ${breakCount} with ${breakTimeAgents.length} detailed records`);
      
    } catch (error) {
      console.error("Error fetching business activities:", error.message);
      console.error("Error details:", error);
      // Don't update break time agents on error to preserve previous value
    }
  };  // Function to fetch call statistics with optional time filter


  return (
    <>
      <WidgetsDropdown
        agents={agents}
        agentStatuses={agentStatuses}
        callStats={callStats}
        breakTimeAgentDetails={breakTimeAgentDetails}
        totalBreakTime={totalBreakTime}
      />
      {/* Call Uses Table */}
      <div style={{ margin: '2rem 0' }}>
        <h4>Call Uses</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #e5e7eb' }}>
            <thead style={{ background: '#f3f4f6' }}>
                <tr>
                <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Agent</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Number</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Outbound</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Inbound</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Missed</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Hang</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCallUses.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>No call usage data found.</td></tr>
              ) : (
                paginatedCallUses.map((item, idx) => (
                  <tr key={item.numberId?.toString() || item.userId || idx}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{item.name || item.userEmail || item.userId || '-'}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{item.virtualNumber || (item.numberId && item.numberId.number) || '-'}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{(item.callsByType && item.callsByType.outbound) ?? item.totalCalls ?? 0}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{(item.callsByType && item.callsByType.inbound) ?? 0}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{/* not provided per user in this endpoint */ 0}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{/* hang calls not provided */ 0}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{item.apiDate ? new Date(item.apiDate).toLocaleString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 8 }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid #e5e7eb', background: currentPage === 1 ? '#f3f4f6' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 4,
                  border: '1px solid #e5e7eb',
                  background: currentPage === i + 1 ? '#2563eb' : '#fff',
                  color: currentPage === i + 1 ? '#fff' : '#222',
                  fontWeight: currentPage === i + 1 ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid #e5e7eb', background: currentPage === totalPages ? '#f3f4f6' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
