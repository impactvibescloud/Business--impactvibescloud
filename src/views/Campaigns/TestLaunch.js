import React from "react";
import Button from "@mui/material/Button";
import { useState } from "react";
import toast from "react-hot-toast";
import { CFormInput, CFormLabel, CCol, CRow } from "@coreui/react";
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
  // const [recipients, setRecipients] = useState([{ name: "", phoneNumber: "" }]);
  console.log("data", data);

  const addRecord = () => {
    setData((prevData) => ({
      ...prevData,
      testRecipents: [
        ...prevData.testRecipents,
        { name: "", phoneNumber: "", email: "" },
      ],
    }));
  };

  const deleteRecipient = (index) => {
    const updatedRecipients = [...data.testRecipents];
    updatedRecipients.splice(index, 1);
    setData((prevData) => ({
      ...prevData,
      testRecipents: updatedRecipients,
    }));
  };

  const recipientNameChange = (e, index) => {
    const updatedRecipients = [...data.testRecipents];
    updatedRecipients[index] = {
      ...updatedRecipients[index],
      name: e.target.value,
    };
    setData((prevData) => ({
      ...prevData,
      testRecipents: updatedRecipients,
    }));
  };

  const recipientNumberChange = (e, index) => {
    const updatedRecipients = [...data.testRecipents];
    updatedRecipients[index] = {
      ...updatedRecipients[index],
      phoneNumber: e.target.value,
    };
    setData((prevData) => ({
      ...prevData,
      testRecipents: updatedRecipients,
    }));
  };

  const recipientEmailChange = (e, index) => {
    const updatedRecipients = [...data.testRecipents];
    updatedRecipients[index] = {
      ...updatedRecipients[index],
      email: e.target.value,
    };
    setData((prevData) => ({
      ...prevData,
      testRecipents: updatedRecipients,
    }));
  };

  const handleSubmit = () => {
    //     if (
    //       data?.testRecipents.every(
    //         (testRecipent) =>
    //           testRecipent.name !== "" &&
    //           (data?.campaignType !== "email"
    //             ? testRecipent.phoneNumber !== ""
    //             : testRecipent.email !== "")
    //       )
    //     ) {
    //       handleView(6);
    //     } else {
    //       toast.error("Fill all contact details");
    //     }
  };

  console.log(data);

  return (
    <div className="container">
      <div className="page-title-right d-flex align-items-center justify-content-end">
        <Button
          variant="contained"
          color="secondary"
          style={{
            fontWeight: "bold",
            marginBottom: "1rem",
            textTransform: "capitalize",
            marginRight: "5px",
          }}
          onClick={() => handleView(5)}
        >
          Prev
        </Button>
        <Button
          variant="contained"
          color="secondary"
          style={{
            fontWeight: "bold",
            marginBottom: "1rem",
            textTransform: "capitalize",
          }}
          onClick={() => handleView(7)}
        >
          Next
        </Button>
      </div>

      {/* <div className="row">
        <div className="col-md-12 my-3">
          <div className="card h-100">
            <div className="card-body px-5">
              <div style={{ fontSize: "22px" }} className="fw-bold">
                Test & Launch
              </div>
              {data?.testRecipents.map((testRecipent, index) => {
                return (
                  <div className="row mb-3 border p-3 rounded">
                    <div className="col-md-6 d-flex align-items-center">
                      <label htmlFor="title" className="form-label me-2">
                        Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name={`name-${index}`}
                        value={testRecipent?.name}
                        onChange={(e) => recipientNameChange(e, index)}
                        maxLength="50"
                      />
                    </div>
                    <div className="col-md-6 d-flex align-items-center">
                      <label htmlFor="title" className="form-label me-2">
                        {data?.campaignType === "rcs" ||
                        data?.campaignType === "whatsapp"
                          ? "Phone Number"
                          : "Email"}
                      </label>
                      <input
                        type={
                          data?.campaignType === "rcs" ||
                          data?.campaignType === "whatsapp"
                            ? "number"
                            : "email"
                        }
                        className="form-control"
                        id={`recipients-phone-number-${index}`}
                        maxLength="50"
                        name={`toPhoneNumber-${index}`}
                        value={
                          data?.campaignType === "rcs" ||
                          data?.campaignType === "whatsapp"
                            ? testRecipent?.phoneNumber
                            : testRecipent?.email
                        }
                        onChange={(e) =>
                          data?.campaignType === "rcs" ||
                          data?.campaignType === "whatsapp"
                            ? recipientNumberChange(e, index)
                            : recipientEmailChange(e, index)
                        }
                      />
                    </div>
                    {index !== 0 && (
                      <div className="col-12">
                        <button
                          onClick={() => {
                            deleteRecipient(index);
                          }}
                          className="btn btn-danger btn-sm rounded-5 fw-bold mt-2"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="col-md-12">
                <button
                  onClick={() => {
                    addRecord();
                  }}
                  className="btn btn-secondary"
                >
                  Add another record
                </button>
              </div>
            </div>
            <div className="col-md-12 d-flex justify-content-end p-3">
              <button className="btn btn-primary">Send</button>
            </div>
          </div>
          <div className="col-md-12">
            <button className="btn btn-primary">Launch</button>
          </div>
        </div>
      </div> */}
      {data && (
        <div>
          <CTable striped>
            <CTableHead>
              <CTableRow>
                <CTableDataCell scope="col">Video</CTableDataCell>
                <CTableDataCell scope="col">Name</CTableDataCell>
                <CTableDataCell scope="col">Contact</CTableDataCell>
                <CTableDataCell scope="col"></CTableDataCell>
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
                <CTableDataCell>
                  <CButton className="btn btn-primary">Send</CButton>
                </CTableDataCell>
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
                <CTableDataCell>
                  <CButton className="btn btn-primary">Send</CButton>
                </CTableDataCell>
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
                <CTableDataCell>
                  <CButton className="btn btn-primary">Send</CButton>
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
        </div>
      )}
    </div>
  );
};

export default TestLaunch;
