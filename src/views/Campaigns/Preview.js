import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import axios from "axios";
import { isAutheticated } from "src/auth";

const Preview = ({ props }) => {
  const token = isAutheticated();
  const { data, handleView, setData } = props;
  const [loading, setLoading] = useState(false);
  const [campaignData, setCampaignData] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      data?.recipients.every(
        (recipient) => recipient.name !== "" && recipient.contact !== ""
      )
    ) {
      handleView(4);
    } else {
      toast.error("Fill all contact details");
    }
  };

  const getCampaign = () => {
    axios
      .get(`/api/campaign/getAll`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setCampaignData(res.data?.campaigns);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    getCampaign();
  }, []);

  return (
    <React.Fragment>
      <div className="col-12">
        <div className="page-title-box d-flex align-items-center justify-content-between">
          <div style={{ fontSize: "22px" }} className="fw-bold">
            Campaign Details
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
              onClick={() => props.handleView(3)}
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

      {data && (
        <div>
          <table className="table table-striped">
            <tbody>
              <tr>
                <th scope="col">Campaign Name</th>
                <td>{campaignData.campaignName}</td>
              </tr>
              <tr>
                <th scope="col">Language</th>
                <td>{campaignData.language}</td>
              </tr>

              <tr>
                <th scope="col">Campaign Type</th>
                <td>{campaignData.campaignType}</td>
              </tr>
              <tr>
                <th scope="col">Video</th>
                <td>
                  <video
                    className="rounded"
                    autoPlay={true}
                    height={300}
                    width={250}
                    src={data?.video ? URL.createObjectURL(data?.video) : null}
                  ></video>
                </td>
              </tr>
              <tr>
                <th scope="col">Recipients</th>
                <td>{campaignData.recipients}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </React.Fragment>
  );
};

export default Preview;
