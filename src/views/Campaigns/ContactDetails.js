import React from "react";
import Button from "@mui/material/Button";
import { useState } from "react";
import toast from "react-hot-toast";
import { CFormInput, CFormLabel, CCol, CRow } from "@coreui/react";
import axios from "axios";
import { isAutheticated } from "src/auth";

const ContactDetails = ({ props }) => {
  const token = isAutheticated();
  const { data, setData, handleView } = props;
  const [dataEntryMethod, setDataEntryMethod] = useState("manual");
  const [csvData, setCsvData] = useState([]);

  const addRecord = () => {
    setData((prevData) => ({
      ...prevData,
      recipients: [...prevData.recipients, { name: "", contact: "" }],
    }));
  };

  const handleSpreadSheet = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (event) => {
        const csvData = event.target.result;
        const rows = csvData.split("\n");
        const extractedData = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i].split(",");
          if (row.length >= 2) {
            const name = row[0].trim();
            const contact = row[1].trim();
            if (name && contact) {
              extractedData.push({ name, contact });
            }
          }
        }
        setCsvData(extractedData);
        setData((prevData) => ({
          ...prevData,
          recipients: extractedData,
          spreadSheet: file.name,
        }));
      };
      reader.readAsText(file);
    }
  };

  const deleteRecipient = (index) => {
    const updatedRecipients = [...data.recipients];
    updatedRecipients.splice(index, 1);
    setData((prevData) => ({
      ...prevData,
      recipients: updatedRecipients,
    }));
  };

  const recipientNameChange = (e, index) => {
    const updatedRecipients = [...data.recipients];
    updatedRecipients[index] = {
      ...updatedRecipients[index],
      name: e.target.value,
    };
    setData((prevData) => ({
      ...prevData,
      recipients: updatedRecipients,
    }));
  };

  const recipientContactChange = (e, index) => {
    const updatedRecipients = [...data.recipients];
    updatedRecipients[index] = {
      ...updatedRecipients[index],
      contact: e.target.value,
    };
    setData((prevData) => ({
      ...prevData,
      recipients: updatedRecipients,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const hasEmptyRecipients = data.recipients.some((recipient) => {
      return !recipient.name || !recipient.contact;
    });

    if (hasEmptyRecipients) {
      toast.error("Please fill Conatct details");
      return;
    }

    const formattedRecipients = data.recipients.map((recipient) => ({
      name: recipient.name,
      contact: recipient.contact,
    }));

    const campaignData = {
      campaignType: data.campaignType,
      campaignName: data.campaignName,
      language: data.language,
      recipients: formattedRecipients,
    };

    axios
      .post(`/api/campaign/create`, campaignData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Access-Control-Allow-Origin": "*",
        },
      })
      .then((res) => {
        // console.log(res);
        handleView(4);
        toast.success("Campaign added successfully!");
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        const message = err.response?.data?.message || "Something went wrong!";
        // console.log(message);
        toast.error(message);
      });

    //   if (
    //     data?.recipients.every(
    //       (recipient) => recipient.name !== "" && recipient.contact !== ""
    //     )
    //   ) {
    //     handleView(4);
    //   } else {
    //     toast.error("Fill all contact details");
    //   }
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-flex align-items-center justify-content-between">
            <div className="form-group">
              <label htmlFor="dataEntryMethod">
                Data Entry Method:
                <select
                  className="form-control"
                  id="dataEntryMethod"
                  value={dataEntryMethod}
                  onChange={(e) => setDataEntryMethod(e.target.value)}
                >
                  <option value="manual">Manually</option>
                  <option value="spreadsheet">Using Spreadsheet</option>
                </select>
              </label>
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
                onClick={() => handleView(2)}
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
                onClick={handleSubmit}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div>
        {dataEntryMethod === "manual" && (
          <div className="row">
            <div className="col-md-12 my-1">
              <div className="card h-100">
                <div className="card-body px-5">
                  {data?.recipients.map((recipient, index) => {
                    return (
                      <div className="row mb-3 border p-3 rounded" key={index}>
                        <div className="col-md-6 d-flex align-items-center">
                          <label
                            htmlFor={`name-${index}`}
                            className="form-label me-2"
                          >
                            Name
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id={`name-${index}`}
                            value={recipient?.name}
                            onChange={(e) => recipientNameChange(e, index)}
                            maxLength="50"
                          />
                        </div>
                        <div className="col-md-6 d-flex align-items-center">
                          <label
                            htmlFor={`contact-${index}`}
                            className="form-label me-2"
                          >
                            {data?.campaignType === "email"
                              ? "Email"
                              : "Phone Number"}
                          </label>
                          <input
                            type={
                              data?.campaignType === "email"
                                ? "email"
                                : "number"
                            }
                            className="form-control"
                            id={`contact-${index}`}
                            maxLength="50"
                            value={recipient?.contact}
                            onChange={(e) => recipientContactChange(e, index)}
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
              </div>
            </div>
          </div>
        )}

        {dataEntryMethod === "spreadsheet" && (
          <div className="row">
            <div className="col-md-12 my-1">
              {/* Spreadsheet data entry form */}
              <div className="card h-100">
                <div className="card-body px-5">
                  <div className="row mb-3 border p-3 rounded">
                    <div className="mb-3">
                      <label htmlFor="spreadsheet" className="form-label">
                        Upload Spreadsheet
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        id="spreadsheet"
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        onChange={(e) => handleSpreadSheet(e)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactDetails;
