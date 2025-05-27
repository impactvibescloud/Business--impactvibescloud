import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Pagination } from "@mui/material";
import { isAutheticated } from "src/auth";

const AffiliateHistory = () => {
  const id = useParams().id;
  const token = isAutheticated();
  //Navigation
  const navigate = useNavigate();
  const [apiData, setApiData] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  //Date format change function
  const dateFormat = (inputDate) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const parts = inputDate.split("-");
    const rearrangedDate = `${parts[2]}-${months[parseInt(parts[1]) - 1]}-${
      parts[0]
    }`;
    // console.log(rearrangedDate); // Output: 11-Mar-2024
    return rearrangedDate;
  };
  //Extract time from mongodb
  const extractTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    const seconds = date.getUTCSeconds().toString().padStart(2, "0");
    const time = `${hours}:${minutes}:${seconds}`;
    // console.log(time);
    return time;
  };
  //Func to get all Affiliate data
  const fetchHistoryData = () => {
    axios
      .get(`/api/v1/affiliate/history/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        console.log(response.data);
        setApiData(response.data.message.affiliate_pay_history);
        setName(response.data.message.name);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        const message =
          error?.response?.data?.message || "Something went wrong!";
        console.log(message);
      });
  };
  //Call api onLoad of page
  useEffect(() => {
    fetchHistoryData();
  }, []);

  //pagination related
  const [itemPerPage, setItemPerPage] = useState(10); //pagination
  const [page, setPage] = useState(1); //pagination

  const getPageCount = () => {
    return Math.max(1, Math.ceil(apiData.length / itemPerPage));
  };

  return (
    <div className="main-content">
      <div className="my-3 page-content">
        <div className="container-fluid">
          {/* Coupon header start */}
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
                <div
                  style={{ fontSize: "22px", fontWeight: "bold" }}
                  className="fw-bold"
                >
                  <p>Payment History :{name}</p>
                </div>

                <div className="page-title-right">
                  <Link to="/affiliate/affiliates">
                    <Button
                      variant="contained"
                      color="secondary"
                      style={{
                        fontWeight: "bold",
                        marginBottom: "1rem",
                        textTransform: "capitalize",
                        marginRight: "1rem",
                      }}
                    >
                      Back
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {/* Coupon header End */}
          {/* Coupon main body Start*/}
          <div className="row">
            <div className="col-lg-12">
              <div className="card">
                <div className="card-body">
                  <div className="row ml-0 mr-0 mb-10">
                    <div className="col-sm-12 col-md-12">
                      <div className="dataTables_length">
                        <label className="w-100">
                          Show
                          <select
                            style={{ width: "10%" }}
                            onChange={(e) => setItemPerPage(e.target.value)}
                            className="
                                select-w
                                custom-select custom-select-sm
                                form-control form-control-sm
                              "
                          >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>
                          entries
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Table Start */}
          <div className="table-responsive table-shoot mt-3">
            <table
              className="table table-centered table-nowrap"
              style={{ border: "1px solid" }}
            >
              <thead
                className="thead-info"
                style={{ background: "rgb(140, 213, 213)" }}
              >
                <tr>
                  <th>Transection ID</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {!loading && apiData.length === 0 && (
                  <tr className="text-center">
                    <td>
                      <h5>No Data Available</h5>
                    </td>
                  </tr>
                )}
                {loading ? (
                  <tr>
                    <td className="text-center">Loading...</td>
                  </tr>
                ) : (
                  apiData &&
                  apiData
                    .slice(
                      (`${page}` - 1) * itemPerPage,
                      `${page}` * itemPerPage
                    )
                    .map((item, i) => (
                      <tr key={i}>
                        <td>{item.transecId}</td>
                        <td>₹{item.amount}</td>
                        <td>{dateFormat(item.date)}</td>
                        <td>{item.time}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          {/* Table End */}
          {/* Pagination div Start*/}
          <div style={{ display: "flex", justifyContent: "right" }}>
            <Pagination
              style={{ margin: "2rem" }}
              variant="outlined"
              size="large"
              count={getPageCount()}
              color="primary"
              onChange={(event, value) => setPage(value)}
            />
          </div>
          {/* Pagination div End*/}
          {/* Coupon main body End */}
        </div>
      </div>
    </div>
  );
};

export default AffiliateHistory;
