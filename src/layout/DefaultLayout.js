import React, { useState, useEffect } from "react";
import {
  AppContent,
  AppSidebar,
  AppFooter,
  AppHeader,
  MaintenanceAlert,
} from "../components/index";
import { getMaintenanceConfig, isInMaintenanceWindow } from "../config/maintenanceConfig";

const DefaultLayout = () => {
  const [maintenanceConfig, setMaintenanceConfig] = useState({
    active: false,
    title: "",
    message: "",
    scheduledAt: null,
    resolvedAt: null,
    severity: "warning"
  });
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check maintenance status initially and every minute
    const checkMaintenance = async () => {
      try {
        const config = await getMaintenanceConfig();
        console.log('Maintenance config:', config);
        setMaintenanceConfig(config);
        const shouldShow = config.active && isInMaintenanceWindow(config);
        console.log('Should show maintenance:', shouldShow);
        setShowMaintenance(shouldShow);
      } catch (error) {
        console.error('Error checking maintenance status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="main-layout">
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100 bg-light">
        <AppHeader />
        {loading ? (
          <div>Loading maintenance status...</div>
        ) : showMaintenance ? (
          <MaintenanceAlert
            title={maintenanceConfig.title}
            message={maintenanceConfig.message}
            scheduledAt={maintenanceConfig.scheduledAt}
            resolvedAt={maintenanceConfig.resolvedAt}
            severity={maintenanceConfig.severity}
            showCountdown={true}
            dismissible={true}
            onClose={() => setShowMaintenance(false)}
          />
        ) : null}
        <div className="body flex-grow-1 px-3">
          <AppContent />
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

export default DefaultLayout;
