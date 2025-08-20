import axiosInstance from './axiosConfig';

// Default configuration
const defaultConfig = {
  active: false,
  message: "System maintenance is scheduled",
  title: "",
  scheduledAt: null,
  resolvedAt: null,
  severity: "warning",
};

export const getMaintenanceConfig = async () => {
  try {
    const { data } = await axiosInstance.get('/maintenance');
    
    if (data.success && data.maintenances && data.maintenances.length > 0) {
      // Filter active maintenance alerts for business platform
      const activeMaintenances = data.maintenances.filter(maintenance => 
        maintenance.status === "scheduled" && 
        maintenance.targetPlatforms.includes("business") &&
        !maintenance.resolvedAt
      );

      // Sort by scheduledAt to get the most recent
      activeMaintenances.sort((a, b) => 
        new Date(b.scheduledAt) - new Date(a.scheduledAt)
      );

      // Get the most recent active maintenance
      const currentMaintenance = activeMaintenances[0];

      if (currentMaintenance) {
        console.log('Found current maintenance:', currentMaintenance);
        const config = {
          active: currentMaintenance.status === "scheduled",
          title: currentMaintenance.title,
          message: currentMaintenance.description,
          scheduledAt: currentMaintenance.scheduledAt,
          resolvedAt: currentMaintenance.resolvedAt,
          severity: "warning",
          id: currentMaintenance._id
        };
        console.log('Transformed config:', config);
        return config;
      }
    }
    return defaultConfig;
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return defaultConfig;
  }
};

export const isInMaintenanceWindow = (config) => {
  console.log('Checking maintenance window for config:', config);
  
  if (!config) {
    console.log('No config provided');
    return false;
  }
  
  if (!config.active) {
    console.log('Maintenance not active');
    return false;
  }
  
  const now = new Date().getTime();
  console.log('Current time:', new Date(now).toISOString());
  
  if (!config.scheduledAt) {
    console.log('No scheduled time, considering active since status is scheduled');
    return true;
  }
  
  const scheduled = new Date(config.scheduledAt).getTime();
  console.log('Scheduled time:', new Date(scheduled).toISOString());
  
  // If there's no resolvedAt time, consider it active if scheduled
  if (!config.resolvedAt) {
    const isActive = now >= (scheduled - (5 * 60 * 1000)); // Show 5 minutes before scheduled time
    console.log('No resolved time, showing based on schedule. Is active:', isActive);
    return isActive;
  }
  
  const resolved = new Date(config.resolvedAt).getTime();
  console.log('Resolved time:', new Date(resolved).toISOString());
  
  const isActive = now >= (scheduled - (5 * 60 * 1000)) && now <= resolved;
  console.log('Checking against schedule and resolution. Is active:', isActive);
  return isActive;
};

export default {
  getMaintenanceConfig,
  isInMaintenanceWindow
};
