import React from "react";
import Button from "@mui/material/Button";
import {
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableRow,
} from "@coreui/react";

const TestLaunch = ({ props }) => {
  const { data, setData, handleView } = props;

  console.log(data);

  const renderTableRows = () => {
    return data.testRecipents.map((recipient, index) => (
      <CTableRow key={index}>
        <CTableDataCell>
          <video
            className="rounded"
            style={{ height: "100px" }}
            autoPlay={true}
            height={300}
            width={250}
            src={data.video}
          ></video>
        </CTableDataCell>
        <CTableDataCell>{recipient.name}</CTableDataCell>
        <CTableDataCell>
          {data.campaignType === "email"
            ? recipient.email
            : recipient.phoneNumber}
        </CTableDataCell>
        <CTableDataCell>{recipient.status}</CTableDataCell>
      </CTableRow>
    ));
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <div
            className="
                page-title-box
                d-flex
                align-items-center
                justify-content-between
              "
          >
            <div style={{ fontSize: "22px" }} className="fw-bold">
              Status
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <h4 className="mb-0"></h4>
            </div>
            <div className="page-title-right">
              <Button
                variant="contained"
                color="secondary"
                style={{
                  fontWeight: "bold",
                  marginBottom: "1rem",
                  textTransform: "capitalize",
                  marginRight: "5px",
                }}
                onClick={() => handleView(6)}
              >
                Prev
              </Button>
            </div>
          </div>
        </div>
      </div>

      {data && (
        <div>
          <CTable striped>
            <CTableHead>
              <CTableRow>
                <CTableDataCell scope="col">Video</CTableDataCell>
                <CTableDataCell scope="col">Name</CTableDataCell>
                <CTableDataCell scope="col">Contact</CTableDataCell>
                <CTableDataCell scope="col">Status</CTableDataCell>
              </CTableRow>
            </CTableHead>
            {/* <CTableBody>{renderTableRows()}</CTableBody> */}
            <CTableBody>
              <CTableRow>
                <CTableDataCell>
                  <video
                    className="rounded"
                    style={{ height: "100px" }}
                    autoPlay={true}
                    height={300}
                    width={250}
                    src={data.video}
                  ></video>
                </CTableDataCell>
                <CTableDataCell>test</CTableDataCell>
                <CTableDataCell>test@gmail.com</CTableDataCell>
                <CTableDataCell>delivered</CTableDataCell>
              </CTableRow>
              <CTableRow>
                <CTableDataCell>
                  <video
                    className="rounded"
                    style={{ height: "100px" }}
                    autoPlay={true}
                    height={300}
                    width={250}
                    src={data.video}
                  ></video>
                </CTableDataCell>
                <CTableDataCell>test</CTableDataCell>
                <CTableDataCell>test@gmail.com</CTableDataCell>
                <CTableDataCell>sent</CTableDataCell>
              </CTableRow>
              <CTableRow>
                <CTableDataCell>
                  <video
                    className="rounded"
                    style={{ height: "100px" }}
                    autoPlay={true}
                    height={300}
                    width={250}
                    src={data.video}
                  ></video>
                </CTableDataCell>
                <CTableDataCell>test</CTableDataCell>
                <CTableDataCell>test@gmail.com</CTableDataCell>
                <CTableDataCell>read</CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
        </div>
      )}
    </div>
  );
};

export default TestLaunch;
