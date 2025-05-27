import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { isAutheticated } from "src/auth";
import swal from "sweetalert";

const TodayTask = () => {
  const token = isAutheticated();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userData, setuserData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [totalData, setTotalData] = useState(0);

  const getTodayTaskData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/task/today`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
          show: itemPerPage,
        },
      });
      // console.log(res.data);
      setuserData(res.data?.tasks);
      setTotalData(res.data?.totalTasks);
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
    getTodayTaskData();
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
                  Today's Task Report
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
                    // onClick={() => {
                    //   navigate("/salescoordinator/task", {
                    //     replace: true,
                    //   });
                    // }}
                  >
                    Show Sales Coordinator Task
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    style={{
                      fontWeight: "bold",
                      textTransform: "capitalize",
                    }}
                    // onClick={() => {
                    //   navigate("/territorymanager/task", {
                    //     replace: true,
                    //   });
                    // }}
                  >
                    Show Territory Manager Task
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
                          <th className="text-start" style={{ width: "15%" }}>
                            Employee ID
                          </th>
                          <th className="text-start" style={{ width: "20%" }}>
                            Name
                          </th>
                          <th className="text-start" style={{ width: "20%" }}>
                            Email
                          </th>
                          <th className="text-start" style={{ width: "15%" }}>
                            Designation
                          </th>
                          <th className="text-start" style={{ width: "20%" }}>
                            Task
                          </th>
                          <th className="text-start" style={{ width: "10%" }}>
                            Task Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr>
                            <td className="text-center" colSpan="7">
                              Loading...
                            </td>
                          </tr>
                        ) : userData?.length > 0 ? (
                          userData?.map((task, i) => {
                            return (
                              <tr key={i}>
                                <td className="text-start">
                                  {task?.taskAssignedTo?.uniqueId}
                                </td>
                                <td className="text-start">
                                  {task?.taskAssignedTo?.name}
                                </td>
                                <td className="text-start">
                                  {task?.taskAssignedTo?.email ? (
                                    task?.taskAssignedTo?.email
                                  ) : (
                                    <small className="m-0 text-secondary">
                                      No Email Added!
                                    </small>
                                  )}
                                </td>
                                <td className="text-start">
                                  {task?.taskAssignedTo?.designation}
                                </td>
                                <td className="text-start">
                                  {task?.task || (
                                    <small className="m-0 text-secondary">
                                      No Task Added!
                                    </small>
                                  )}
                                </td>
                                <td className="text-start">
                                  {task?.taskStatus}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr className="text-center">
                            <td colSpan="6">
                              <h5>No Task Records Available...</h5>
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

export default TodayTask;
