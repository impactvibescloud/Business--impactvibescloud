import React from "react";
import axios from "axios";
import { useEffect, useState } from "react";
import { isAutheticated } from "../../auth.js";
import WidgetsDropdown from "../widgets/WidgetsDropdown.js";

const Dashboard = () => {
  const [agents, setAgents] = useState(0);
  const [agentStatuses, setAgentStatuses] = useState({ active: 0, deactive: 0, break: 0 });
  const [user, setUser] = useState({});
  const token = isAutheticated();

  useEffect(() => {
    if (!token) return;
    
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get("/api/v1/user/details", {
          headers: {
            Authorization: `Bearer ${token}`,
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

  useEffect(() => {
    if (user?.businessId) {
      const fetchAgentsData = async () => {
        try {
          const response = await axios.get(`/api/branch/${user.businessId}/branches`, {
            headers: {
              Authorization: `Bearer ${token}`,
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
          
          setAgentStatuses(statusCounts);
        } catch (error) {
          console.warn("Agents API failed:", error.message);
          setAgents(0);
          setAgentStatuses({ active: 0, deactive: 0, break: 0 });
        }
      };

      fetchAgentsData();
    }
  }, [user, token]);
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
  return (
    <>
            <WidgetsDropdown
        agents={agents}
        agentStatuses={agentStatuses}
      />
    </>
  );
};

export default Dashboard;
