import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Pagination } from "@mui/material";
import { isAutheticated } from "src/auth";
const Coupons = () => {
  const token = isAutheticated();
  //Navigation
  const navigate = useNavigate();
  //pagination related
  const [loading, setLoading] = useState(true); //only for testing
  const [itemPerPage, setItemPerPage] = useState(10); //pagination
  const [page, setPage] = useState(1); //pagination
  const [apiData, setApiData] = useState([]);
  //Handel Suspend
  const handelSuspend = (id, active) => {
    axios
      .patch(
        "api/v1/coupon/suspend",
        {
          id: id,
          is_coupon_active: !active,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((res) => {
        // Fetch data again after updating
        getAllCoupon();
      })
      .catch((error) => {
        const message =
          error?.response?.data?.message || "Something went wrong!";
        console.log(message);
      });
  };
  //Get all Coupons from the api
  const getAllCoupon = () => {
    axios
      .get("/api/v1/coupon/getall", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
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
  //Calling api Onload of page
  useEffect(() => {
    getAllCoupon();
  }, []);
  //Create navigation
  const navigCreate = () => {
    navigate("/affiliate/coupons/create");
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
    return Math.max(1, Math.ceil(apiData?.length / itemPerPage));
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
                <div style={{ fontSize: "22px" }} className="fw-bold">
                  Coupons
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
                    Add New Coupon
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
                  <th> Coupon Code</th>
                  <th> Affiliate</th>
                  <th>Discount</th>
                  <th>Affilite Discount</th>
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
                        <td>
                          <p style={{ fontWeight: "bold" }}>
                            {item.coupon_code}
                          </p>
                        </td>
                        <td>
                          <p>{item.name}</p>
                        </td>
                        <td>
                          <p>₹{item.discount_amount}</p>
                        </td>
                        <td>
                          <p>₹{item.affiliate_discount_amount}</p>
                        </td>
                        <td>
                          {item.is_coupon_active ? (
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
                          ) : (
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
                          )}
                        </td>
                        <td>
                          <Link to={`/affiliate/coupons/edit/${item._id}`}>
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
                                item.is_coupon_active ? "red" : "green"
                              }`,
                            }}
                            onClick={() =>
                              handelSuspend(item._id, item.is_coupon_active)
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
                            {item.is_coupon_active ? "Suspend" : "Activate"}
                          </button>
                          <Link to={`/affiliate/coupons/history/${item._id}`}>
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

export default Coupons;
