import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Button, Pagination } from "@mui/material";
import { isAutheticated } from "src/auth";

const Affiliates = () => {
  const token = isAutheticated();
  //Navigation
  const navigate = useNavigate();
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(true);

  const handelSuspend = (id, active) => {
    axios
      .patch(
        "api/v1/affiliate/suspend",
        {
          id: id,
          is_affiliate_active: !active,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((res) => {
        // Fetch data again after updating kind of updating page
        fetchAffiliateData();
      })
      .catch((error) => {
        const message =
          error?.response?.data?.message || "Something went wrong!";
        console.log(message);
      });
  };

  //Func to get all Affiliate data
  const fetchAffiliateData = () => {
    axios
      .get("/api/v1/affiliate/getall", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        console.log(response?.data);
        setLoading(false);
        setApiData(response.data.message);
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
    fetchAffiliateData();
  }, []);

  //pagination related
  const [itemPerPage, setItemPerPage] = useState(10); //pagination
  const [page, setPage] = useState(1); //pagination

  //Create navigation
  const navigCreate = () => {
    navigate("/affiliate/affiliates/create");
  };
  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    borderRadius: "0.5rem",
    boxShadow: 24,
    width: "500px",
    padding: "1rem",
  };
  const InputSpace = {
    marginBottom: "1rem",
  };

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
                  Affiliates
                </div>

                <div className="page-title-right">
                  <Button
                    onClick={navigCreate}
                    variant="contained"
                    color="primary"
                    style={{
                      fontWeight: "bold",
                      marginBottom: "1rem",
                      textTransform: "capitalize",
                    }}
                  >
                    Add New Affiliate
                  </Button>
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
                  <th> Affiliate</th>
                  <th> Coupon Code</th>
                  <th>Coupon Claimed</th>
                  <th>Total Amount Earned</th>
                  <th>Amount to be Paid</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {" "}
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
                        <td>{item.name}</td>
                        {item.coupon_code ? (
                          <td>{item.coupon_code}</td>
                        ) : (
                          <td>NONE</td>
                        )}
                        {item.coupon_claimed ? (
                          <td>{item.coupon_claimed}</td>
                        ) : (
                          <td>0</td>
                        )}
                        {item.total_earning ? (
                          <td>₹{item.total_earning}</td>
                        ) : (
                          <td>₹0</td>
                        )}
                        {item.total_earning ? (
                          <td>₹{item.total_earning - item.paid_amount}</td>
                        ) : (
                          <td>₹0</td>
                        )}
                        {item.is_affiliate_active ? (
                          <td>
                            <p
                              style={{
                                backgroundColor: "green",
                                color: "white",
                                display: "inline-block",
                                padding: "2px",
                                width: "65px",
                                borderRadius: "8px",
                                textAlign: "center",
                              }}
                            >
                              {" "}
                              active
                            </p>
                          </td>
                        ) : (
                          <td>
                            <p
                              style={{
                                backgroundColor: "red",
                                color: "white",
                                display: "inline-block",
                                padding: "2px",
                                width: "65px",
                                textAlign: "center",
                                borderRadius: "8px",
                              }}
                            >
                              {" "}
                              unactive
                            </p>
                          </td>
                        )}
                        <td>
                          <Link to={`/affiliate/affiliates/edit/${item._id}`}>
                            <button
                              style={{
                                color: "white",
                                marginRight: "1rem",
                              }}
                              type="button"
                              className="
                                      btn btn-primary btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mx-1
                                    mt-1
                                  "
                            >
                              Edit
                            </button>
                          </Link>
                          <button
                            style={{
                              color: "white",
                              marginRight: "1rem",
                              background: `${
                                item.is_affiliate_active ? "red" : "green"
                              }`,
                            }}
                            onClick={() =>
                              handelSuspend(item._id, item.is_affiliate_active)
                            }
                            type="button"
                            className="
                                      btn  btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mx-1
                                    mt-1
                                  "
                          >
                            {item.is_affiliate_active ? "Suspend" : "Activate"}
                          </button>
                          {item.total_earning - item.paid_amount != 0 ? (
                            <Link to={`/affiliate/affiliates/pay/${item._id}`}>
                              <button
                                style={{
                                  color: "white",
                                  marginRight: "1rem",
                                  background: "green",
                                }}
                                type="button"
                                className="
                                      btn  btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mx-1
                                    mt-1
                                  "
                              >
                                Pay
                              </button>
                            </Link>
                          ) : (
                            <button
                              disabled
                              style={{
                                color: "white",
                                marginRight: "1rem",
                                background: "green",
                              }}
                              type="button"
                              className="
                                      btn  btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mx-1
                                    mt-1
                                  "
                            >
                              Pay
                            </button>
                          )}
                          <Link
                            to={`/affiliate/affiliates/history/${item._id}`}
                          >
                            <button
                              style={{
                                color: "white",
                                marginRight: "1rem",
                                background: "grey",
                              }}
                              type="button"
                              className="
                                      btn  btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mx-1
                                    mt-1
                                  "
                            >
                              History
                            </button>
                          </Link>
                        </td>
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

export default Affiliates;
