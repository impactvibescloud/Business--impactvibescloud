import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { isAutheticated } from "src/auth";
import swal from "sweetalert";

const TodayLeave = () => {
  const token = isAutheticated();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [salescoordinatorsData, setSalesCoOrdinatorsData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [totalData, setTotalData] = useState(0);

  const getTodayLeaveData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/v1/leave/today`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
          show: itemPerPage,
        },
      });
      // console.log(res.data);
      setSalesCoOrdinatorsData(res.data?.leave);
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
    getTodayLeaveData();
  }, [itemPerPage, currentPage]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-flex align-items-center justify-content-between">
                <div style={{ fontSize: "22px" }} className="fw-bold">
                  Today's Leave
                  <div
                    style={{
                      fontSize: "20px",
                      marginTop: "5px",
                      marginBottom: "3px",
                    }}
                  >
                    Date : {today}
                  </div>
                </div>
                <div className="d-flex">
                  <Button
                    variant="contained"
                    color="primary"
                    style={{
                      fontWeight: "bold",
                      marginRight: "1rem",
                      textTransform: "capitalize",
                    }}
                    onClick={() => {
                      navigate("/salescoordinator/leave", {
                        replace: true,
                      });
                    }}
                  >
                    Show Sales Coordinator Leave
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    style={{
                      fontWeight: "bold",
                      textTransform: "capitalize",
                    }}
                    onClick={() => {
                      navigate("/territorymanager/leave", {
                        replace: true,
                      });
                    }}
                  >
                    Show Territory Manager Leave
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
                          <th className="text-start">ID</th>
                          <th className="text-start">Name</th>
                          <th className="text-start">Email</th>
                          <th className="text-start">Designation</th>
                          <th className="text-start">Time</th>
                          <th className="text-start">Leave Type</th>
                          <th className="text-start">Reason</th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr>
                            <td className="text-center" colSpan="7">
                              Loading...
                            </td>
                          </tr>
                        ) : salescoordinatorsData?.length > 0 ? (
                          salescoordinatorsData?.map((leave, i) => {
                            return (
                              <tr key={i}>
                                <td className="text-start">
                                  {leave?.user?.uniqueId}
                                </td>
                                <td className="text-start">
                                  {leave?.user?.name}
                                </td>
                                <td className="text-start">
                                  {leave?.user?.email ? (
                                    leave?.user?.email
                                  ) : (
                                    <small className="m-0 text-secondary">
                                      No Email Added!
                                    </small>
                                  )}
                                </td>
                                <td className="text-start">
                                  {leave?.user?.userType === "SalesCoOrdinator"? "Sales Coordinator" : "Territory Manager"}
                                </td>
                                <td className="text-start">
                                  {leave?.time || (
                                    <small className="m-0 text-secondary">
                                      No Time Added!
                                    </small>
                                  )}
                                </td>
                                <td className="text-start">
                                  {leave?.leaveType || (
                                    <small className="m-0 text-secondary">
                                      No Leave Type Added!
                                    </small>
                                  )}
                                </td>
                                <td className="text-start">
                                  {leave?.reason ? (
                                    leave?.reason
                                  ) : (
                                    <small className="m-0 text-secondary">
                                      No Reason Added!
                                    </small>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr className="text-center">
                            <td colSpan="7">
                              <h5>No Leave Records Available...</h5>
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

export default TodayLeave;
