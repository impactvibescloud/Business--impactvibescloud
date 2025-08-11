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

const Dashboard = () => {
  const [agents, setAgents] = useState(0);
  const [agentStatuses, setAgentStatuses] = useState({ active: 0, deactive: 0, break: 0 });
  const [user, setUser] = useState({});
  const [callStats, setCallStats] = useState({
    totalCalls: 250,
    liveCalls: 8,
    outboundCalls: 120,
    callsPerDay: 80,
    inboundCalls: 130,
    missedCalls: 15,
    rejectedCalls: 5
  });
  const [breakTimeAgents, setBreakTimeAgents] = useState(0);
  const [breakTimeAgentDetails, setBreakTimeAgentDetails] = useState([]);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const token = isAutheticated();

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
  const fetchCallStatistics = async (timeFilter = 'today', startDate = null, endDate = null) => {
    if (!token || !user?.businessId) return;
    
    try {
      // Use the business ID from the user object
      const response = await axios.get(getApiUrl(`/api/call-uses/business/${user.businessId}`), {
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
      
      console.log('Call usage API response:', response.data);
      
      // Handle business call usage response
      if (response.data && response.data.success && response.data.callUses && response.data.callUses.length > 0) {
        const callUsage = response.data.callUses[0]; // Get the first call usage record
        
        // Update call stats directly from the API response
        const stats = {
          totalCalls: (callUsage.inboundCalls || 0) + (callUsage.outboundCalls || 0) + (callUsage.missedCalls || 0),
          liveCalls: 0, // API doesn't provide live calls
          outboundCalls: callUsage.outboundCalls || 0,
          inboundCalls: callUsage.inboundCalls || 0,
          missedCalls: callUsage.missedCalls || 0,
          rejectedCalls: callUsage.hangCalls || 0,
          callsPerDay: 0 // We can calculate this if needed
        };
        
        setCallStats(stats);
        return stats;
      }
      
      // If no valid response, return empty stats
      const emptyStats = {
        totalCalls: 0,
        liveCalls: 0,
        outboundCalls: 0,
        inboundCalls: 0,
        missedCalls: 0,
        rejectedCalls: 0,
        callsPerDay: 0
      };
      
      setCallStats(emptyStats);
      return emptyStats;
    } catch (error) {
      console.warn("Call statistics API failed:", error.message);
      const emptyStats = {
        totalCalls: 0,
        liveCalls: 0,
        outboundCalls: 0,
        inboundCalls: 0,
        missedCalls: 0,
        rejectedCalls: 0,
        callsPerDay: 0
      };
      setCallStats(emptyStats);
      return emptyStats;
    }
  };
  
  // Helper function to calculate call statistics from API response
  const calculateCallStats = (response) => {
    if (response?.data?.success && response?.data?.callUses?.[0]) {
      const callUsage = response.data.callUses[0];
      return {
        totalCalls: (callUsage.inboundCalls || 0) + (callUsage.outboundCalls || 0) + (callUsage.missedCalls || 0),
        liveCalls: 0, // API doesn't provide live calls
        outboundCalls: callUsage.outboundCalls || 0,
        inboundCalls: callUsage.inboundCalls || 0,
        missedCalls: callUsage.missedCalls || 0,
        rejectedCalls: callUsage.hangCalls || 0,
        callsPerDay: 0
      };
    }
    
    return {
      totalCalls: 0,
      liveCalls: 0,
      outboundCalls: 0,
      inboundCalls: 0,
      missedCalls: 0,
      rejectedCalls: 0,
      callsPerDay: 0
    };
  };

  useEffect(() => {
    if (user?.businessId) {
      const fetchAgentsData = async () => {
        try {
          const response = await axios.get(getApiUrl(`/api/branch/${user.businessId}/branches`), {
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
          const branchesData = response.data.data || [];
          setAgents(branchesData.length);
          
          // Calculate agent statuses
          const statusCounts = { active: 0, deactive: 0, break: 0 };
          branchesData.forEach(branch => {
            if (branch.isSuspended) {
              statusCounts.deactive++;
            } else {
              // Check call status or other indicators for break/active
              const callStatus = branch.callStatus || 'active';
              if (callStatus.toLowerCase().includes('break') || callStatus.toLowerCase().includes('pause')) {
                statusCounts.break++;
              } else {
                statusCounts.active++;
              }
            }
          });
          
          // Set initial agent statuses (will be updated by activities API)
          setAgentStatuses(statusCounts);
          
          // Fetch business activities to get users on break
          const businessId = user.businessId;
          if (businessId) {
            fetchBusinessActivities(businessId);
          }
        } catch (error) {
          console.warn("Agents API failed:", error.message);
          setAgents(0);
          setAgentStatuses({ active: 0, deactive: 0, break: 0 });
        }
      };

      fetchAgentsData();
      
      // Set up interval to refresh break time data every minute
      const businessId = user.businessId;
      if (businessId) {
        // Initial fetch is done in fetchAgentsData, this is just for the interval
        const intervalId = setInterval(() => {
          fetchBusinessActivities(businessId);
        }, 60000); // every minute
        
        return () => clearInterval(intervalId);
      }
      
      // Fetch initial call statistics (default to 'today')
      fetchCallStatistics('today');
    }
  }, [user, token]);
  
  // Fetch call statistics when component mounts or user/token changes
  useEffect(() => {
    if (token && user?.businessId) {
      fetchCallStatistics('today');
    }
  }, [token, user?.businessId]);
  // const [Brand, setBrand] = useState(null);
  // const getAllBrands = async () => {
  //   let res = await axios.get(`/api/brand/getBrands`, {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   });
  //   // console.log(res.data);
  //   setBrand(res?.data?.total_data);
  // };
  // // 3rd
  // const [Requests, setRequests] = useState([]);
  // const getAllRequests = async () => {
  //   let res = await axios.get(`/api/contact/request/getAll/`, {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   });
  //   // console.log(res.data);
  //   setRequests(res.data.contactRequest);
  // };

  // //3 requiment
  // const [requirement, setRequirement] = useState([])
  // // console.log(token)
  // const getRequirement = useCallback(async () => {
  //   let res = await axios.get(
  //     `/api/requirement/getAll`,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     }
  //   );

  //   setRequirement(res.data.Requirement)

  // }, [token]);
  // //4 news
  // const [news, setNews] = useState([])

  // const getNews = useCallback(async () => {
  //   let res = await axios.get(
  //     `/api/news/getAll`,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     }
  //   );

  //   setNews(res.data.news)

  // }, [token]);
  // //5 offers
  // const [offer, setOffer] = useState([])

  // const getOffer = useCallback(async () => {
  //   let res = await axios.get(
  //     `/api/offer/getAll`,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     }
  //   );
  //   // console.log(res.data)
  //   setOffer(res.data.offer)

  // }, [token]);
  // //6 event
  // const [event, setEvent] = useState([])
  // const getEvent = useCallback(async () => {
  //   let res = await axios.get(
  //     `/api/event/getAll`,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     }
  //   );
  //   // console.log(res.data)
  //   setEvent(res.data.Event)

  // }, [token]);
  useEffect(() => {
    // Expose fetchCallStatistics to window object for the WidgetsDropdown component
    window.fetchCallStatistics = fetchCallStatistics;
    
    // Cleanup function to remove the reference when component unmounts
    return () => {
      delete window.fetchCallStatistics;
    };
  }, [token]); // Re-expose when token changes

  return (
    <>
      <WidgetsDropdown
        agents={agents}
        agentStatuses={agentStatuses}
        callStats={callStats}
        breakTimeAgentDetails={breakTimeAgentDetails}
        totalBreakTime={totalBreakTime}
      />
    </>
  );
};

export default Dashboard;
