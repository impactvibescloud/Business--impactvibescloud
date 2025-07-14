import React, { useEffect, useState } from "react";
import { CFooter } from "@coreui/react";
import { isAutheticated } from "src/auth";
import axios from "axios";

const AppFooter = () => {
  const token = isAutheticated();

  const [copyright, setCopyright] = useState("");

  useEffect(() => {
    async function getConfiguration() {
      try {
        const configDetails = await axios.get(`/api/config`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Safely check if result exists and is an array
        if (configDetails.data && configDetails.data.result && Array.isArray(configDetails.data.result)) {
          configDetails.data.result.map((item) => {
            setCopyright(item?.copyrightMessage || "ImpactVibes Cloud");
          });
        } else {
          setCopyright("ImpactVibes Cloud");
        }
      } catch (error) {
        console.warn('Config API failed, using default copyright:', error.message);
        setCopyright("ImpactVibes Cloud");
      }
    }
    getConfiguration();
  }, []);

  return (
    <CFooter>
      <div>
        <span className="ms-1">
          {/* {new Date().getFullYear()} &copy; {copyright ? copyright : ""} . */}
        </span>
      </div>
    </CFooter>
  );
};

export default React.memo(AppFooter);
