import React, { useEffect, useState } from "react";
import { CFooter } from "@coreui/react";
import { isAutheticated } from "src/auth";
import axios from "axios";

const AppFooter = () => {
  const token = isAutheticated();

  const [copyright, setCopyright] = useState("");

  useEffect(() => {
    async function getConfiguration() {
      const configDetails = await axios.get(`/api/config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      configDetails.data.result.map((item) => {
        setCopyright(item?.copyrightMessage);
      });
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
