import React, { useState, useEffect, useRef,useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { isAutheticated } from "src/auth";
import swal from "sweetalert";
import debounce from 'lodash.debounce';

const AttendanceSalesCoordinator = () => {
  const token = isAutheticated();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(true);
  const [salescoordinatorsData, setSalesCoOrdinatorsData] = useState([]);

  const nameRef = useRef();
  const mobileRef = useRef();
  const VerifySalesCoOrdinatorRef = useRef();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [totalData, setTotalData] = useState(0);

  const getSalesCoOrdinatorsData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/salescoordinator/getAll/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
          show: itemPerPage,
          name: nameRef.current.value,
          mobileNumber: mobileRef.current.value,
          isVerified: VerifySalesCoOrdinatorRef.current.value,
        },
      });
      setSalesCoOrdinatorsData(res.data?.salesCoOrinators);
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
    getSalesCoOrdinatorsData();
  }, [success, itemPerPage, currentPage]);
  const debouncedSearch = useCallback(debounce(() => {
    setCurrentPage(1);
    getSalesCoOrdinatorsData();
  }, 500), []);

  const handleSearchChange = () => {
    debouncedSearch();
  };
  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-flex align-items-center justify-content-between">
                <div style={{ fontSize: "22px" }} className="fw-bold">
                  Sales Coordinators Attendance
                </div>
                <div className="page-title-right">
                  <Button
                    variant="contained"
                    color="secondary"
                    style={{
                      fontWeight: "bold",
                      marginBottom: "1rem",
                      textTransform: "capitalize",
                    }}
                    onClick={() => {
                      navigate("/attendance/today", { replace: true });
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
                    <div className="col-lg-3">
                      <label>Sales Coordinator Name:</label>
                      <input
                        type="text"
                        placeholder="SalesCoOrdinator name"
                        className="form-control"
                        ref={nameRef}
                        onChange={handleSearchChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="col-lg-3">
                      <label>Mobile Number:</label>
                      <input
                        type="text"
                        placeholder="Mobile Number"
                        className="form-control"
                        ref={mobileRef}
                        onChange={handleSearchChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="col-lg-3">
                      <label>Filter by Verify:</label>
                      <select
                        className="form-control"
                        ref={VerifySalesCoOrdinatorRef}
                        onChange={handleSearchChange}
                        disabled={loading}
                      >
                        <option value="">----Select----</option>
                        <option value="true">YES</option>
                        <option value="false">NO</option>
                      </select>
                    </div>
                  </div>

                  <div className="table-responsive table-shoot mt-3">
                    <table className="table table-centered table-nowrap">
                      <thead
                        className="thead-light"
                        style={{ background: "#ecdddd" }}
                      >
                        <tr>
                          <th className="text-start">Name</th>
                          <th className="text-start">Mobile No.</th>
                          <th className="text-start">Email</th>
                          <th className="text-start">Verify</th>
                          <th className="text-start">Register On</th>
                          <th className="text-start">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr>
                            <td className="text-center" colSpan="6">
                              Loading...
                            </td>
                          </tr>
                        ) : salescoordinatorsData?.length > 0 ? (
                          salescoordinatorsData?.map((salescoordinator, i) => {
                            return (
                              <tr key={i}>
                                <td className="text-start">
                                  {salescoordinator?.name}
                                </td>
                                <td className="text-start">
                                  {salescoordinator?.mobileNumber}
                                </td>
                                <td className="text-start">
                                  {salescoordinator?.email ? (
                                    salescoordinator?.email
                                  ) : (
                                    <small className="m-0 text-secondary">
                                      No Email Added!
                                    </small>
                                  )}
                                </td>
                                <td className="text-start">
                                  <span
                                    className={`badge text-white ${
                                      salescoordinator?.isVerified === true
                                        ? "text-bg-success"
                                        : "text-bg-danger"
                                    }`}
                                  >
                                    {salescoordinator?.isVerified
                                      ? "YES"
                                      : "NO"}
                                  </span>
                                </td>
                                <td className="text-start">
                                  {new Date(
                                    salescoordinator.createdAt
                                  ).toLocaleString("en-IN", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "numeric",
                                    hour12: true,
                                  })}
                                </td>
                                <td className="text-start">
                                  <Link
                                    to={`/attendance/view/${salescoordinator._id}`}
                                  >
                                    <button
                                      style={{
                                        color: "white",
                                        marginRight: "1rem",
                                      }}
                                      type="button"
                                      className="btn btn-primary btn-sm waves-effect waves-light btn-table mt-1 mx-1"
                                    >
                                      View Attendance
                                    </button>
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr className="text-center">
                            <td colSpan="6">
                              <h5>No Sales Coordinator Available...</h5>
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

export default AttendanceSalesCoordinator;
