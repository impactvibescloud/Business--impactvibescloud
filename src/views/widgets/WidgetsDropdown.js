import React from "react";
import {
  CRow,
  CCol,
  CWidgetStatsA,
} from "@coreui/react";

function WidgetsDropdown({ agents }) {
  return (
    <>
      <CRow>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{agents || 0}</>}
            title="Total Agents"
          />
        </CCol>
      </CRow>
    </>
  );
}

export default WidgetsDropdown


