import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "@mui/material/Button";
import { isAutheticated } from "src/auth";
import swal from "sweetalert";

const SingleUserleave = () => {
  const { id } = useParams();
  const token = isAutheticated();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setuser] = useState({});
  const [leaveData, setleaveData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [totalData, setTotalData] = useState(0);
const [userType, setUserType] = useState("");
  const getSingleuserleave = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/v1/leave/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
          show: itemPerPage,
        },
      });
      setuser(res.data?.user);
      setleaveData(res.data?.leave);
      setUserType(res.data?.userType);
      // console.log(res.data);
      setTotalData(res.data?.total_data);
    } catch (err) {
      const msg = err?.response?.data?.message || "Something went wrong!";
      swal({
        title: "Error",
        text: msg,
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSingleuserleave();
  }, [itemPerPage, currentPage]);

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-flex align-items-center justify-content-between">
                <div style={{ fontSize: "22px" }} className="fw-bold">
                  {userType === "SalesCoOrdinator"?"Sales Coordinator":"Territory Manager"} Leave
                  <div style={{ fontSize: "16px", marginTop: "5px" }}>
                    {user.name} ({user.email})
                  </div>
                </div>
                <div className="page-title-right">
                  <Button
                    variant="contained"
                    color="primary"
                    style={{
                      fontWeight: "bold",
                      marginBottom: "1rem",
                      textTransform: "capitalize",
                    }}
                    onClick={() => {
                      navigate("/leaves/today", {
                        replace: true,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-12">
              <div className="card">
                <div className="card-body">
                  <div className="row ml-0 mr-0 mb-10">
                    <div className="col-lg-1">
                      <div className="dataTables_length">
                        <label className="w-100">
                          Show
                          <select
                            onChange={(e) => {
                              setItemPerPage(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="form-control"
                            disabled={loading}
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

                  <div className="table-responsive table-shoot mt-3">
                    <table className="table table-centered table-nowrap">
                      <thead
                        className="thead-light"
                        style={{ background: "#ecdddd" }}
                      >
                        <tr>
                          <th className="text-start">Date</th>
                          <th className="text-start">Time</th>
                          <th className="text-start">Location</th>
                          <th className="text-start">Note</th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr>
                            <td className="text-center" colSpan="4">
                              Loading...
                            </td>
                          </tr>
                        ) : leaveData?.length > 0 ? (
                          leaveData?.map((leave, i) => {
                            return (
                              <tr key={i}>
                                <td className="text-start">
                                  {new Date(
                                    leave?.date
                                  ).toLocaleDateString("en-IN", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </td>
                                <td className="text-start">
                                  {leave?.time || (
                                    <small className="m-0 text-secondary">
                                      No Time Added!
                                    </small>
                                  )}
                                </td>
                                <td className="text-start">
                                  {leave?.location || (
                                    <small className="m-0 text-secondary">
                                      No Location Added!
                                    </small>
                                  )}
                                </td>
                                <td className="text-start">
                                  {leave?.notes || (
                                    <small className="m-0 text-secondary">
                                      No Note Added!
                                    </small>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr className="text-center">
                            <td colSpan="4">
                              <h5>No leave Records Available...</h5>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="row mt-20">
                    <div className="col-sm-12 col-md-6 mb-20">
                      <div
                        className="dataTables_info"
                        id="datatable_info"
                        role="status"
                        aria-live="polite"
                      >
                        Showing {currentPage * itemPerPage - itemPerPage + 1} to{" "}
                        {Math.min(currentPage * itemPerPage, totalData)} of{" "}
                        {totalData} entries
                      </div>
                    </div>

                    <div className="col-sm-12 col-md-6">
                      <div className="d-flex">
                        <ul className="pagination ms-auto">
                          <li
                            className={
                              currentPage === 1
                                ? "paginate_button page-item previous disabled"
                                : "paginate_button page-item previous"
                            }
                          >
                            <span
                              className="page-link"
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  prev > 1 ? prev - 1 : prev
                                )
                              }
                            >
                              Previous
                            </span>
                          </li>
                          <li
                            className={
                              currentPage * itemPerPage >= totalData
                                ? "paginate_button page-item next disabled"
                                : "paginate_button page-item next"
                            }
                          >
                            <span
                              className="page-link"
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  prev * itemPerPage < totalData
                                    ? prev + 1
                                    : prev
                                )
                              }
                            >
                              Next
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleUserleave;
