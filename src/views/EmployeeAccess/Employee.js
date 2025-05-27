import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { isAutheticated } from "src/auth";
import swal from "sweetalert";
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Fuse from "fuse.js";
import { Typography } from "@mui/material";
// import OrderDetails from "./orderDetails";
const Employee = () => {
  const token = isAutheticated();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loading1, setLoading1] = useState(true);
  const [success, setSuccess] = useState(true);
  const [employee, setemployee] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [showData, setShowData] = useState(employee);

  const handleShowEntries = (e) => {
    setCurrentPage(1);
    setItemPerPage(e.target.value);
  };
  useEffect(() => {
    const loadData = () => {
      const indexOfLastPost = currentPage * itemPerPage;
      const indexOfFirstPost = indexOfLastPost - itemPerPage;
      setShowData(employee.slice(indexOfFirstPost, indexOfLastPost));
    };
    loadData();
  }, [currentPage, itemPerPage, employee]);
  console.log(employee);

  //   const getemployee = async () => {
  //     axios
  //       .get(`/api/v1/admin/employee`, {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       })
  //       .then((res) => {
  //         setemployee(res.data.employee);
  //         setLoading(false);
  //       })
  //       .catch((error) => {
  //         swal({
  //           title: error,
  //           text: "please login to access the resource or refresh the page  ",
  //           icon: "error",
  //           button: "Retry",
  //           dangerMode: true,
  //         });
  //         setLoading(false);
  //       });
  //   };

  //   useEffect(() => {
  //     getemployee();
  //   }, [success]);
  //   console.log(employee);

  //   useEffect(() => {
  //     const loadData = () => {
  //       const indexOfLastPost = currentPage * itemPerPage;
  //       const indexOfFirstPost = indexOfLastPost - itemPerPage;
  //       setShowData(employee.slice(indexOfFirstPost, indexOfLastPost));
  //     };
  //     loadData();
  //   }, [currentPage, itemPerPage, employee]);
  //   console.log(employee);

  // const handleDelete = (id) => {
  //   swal({
  //     title: "Are you sure?",
  //     icon: "error",
  //     buttons: {
  //       Yes: { text: "Yes", value: true },
  //       Cancel: { text: "Cancel", value: "cancel" },
  //     },
  //   }).then((value) => {
  //     if (value === true) {
  //       axios
  //         .delete(`/api/user-address/deleteAddress/${id}`, {
  //           headers: {
  //             "Access-Control-Allow-Origin": "*",
  //             Authorization: `Bearer ${token}`,
  //           },
  //         })
  //         .then((res) => {
  //           swal({
  //             title: "Deleted",
  //             text: "Address Deleted successfully!",
  //             icon: "success",
  //             button: "ok",
  //           });
  //           setSuccess((prev) => !prev);
  //         })
  //         .catch((err) => {
  //           swal({
  //             title: "Warning",
  //             text: "Something went wrong!",
  //             icon: "error",
  //             button: "Retry",
  //             dangerMode: true,
  //           });
  //         });
  //     }
  //   });
  // };

  // get All employee
  const getemployee = async () => {
    axios
      .get(`/api/v1/admin/employee`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setemployee(res.data.employee);
        setLoading(false);
      })
      .catch((error) => {
        swal({
          title: error,
          text: "please login to access the resource or refresh the page  ",
          icon: "error",
          button: "Retry",
          dangerMode: true,
        });
        setLoading(false);
      });
  };
  useEffect(() => {
    getemployee();
  }, [success]);
  console.log(employee);
  console.log("showdata", showData);
  // const trueEntries = Object.entries(showData.).filter(
  //   ([key, value]) => value === true
  // );
  const renderAccessTo = (accessTo) => {
    return Object.entries(accessTo)
      .filter(([key, value]) => value === true)
      .map(([key, value]) => key)
      .join(", ");
  };
  const handleDelete = async (id) => {
    try {
      // Send a DELETE request to your API to delete the employee by ID
      const res = await axios.delete(`/api/v1/admin/delete-employee/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // If deletion is successful, update the employee list
      swal({
        title: "Congratulations!!",
        text: res?.data?.message,
        icon: "success",
        buttons: "OK",
      });
      setemployee(employee.filter((employee) => employee._id !== id));
    } catch (error) {
      console.error("Error deleting employee:", error);
      swal({
        title: "",
        text: "Something went wrong!",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
    }
  };
  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
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
                  All Employees
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
                      navigate("/add-employee");
                    }}
                  >
                    Add Employee
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-12">
              <div className="card">
                <div className="card-body">
                  <div className="row ml-0 mr-0 mb-10 ">
                    <div className="col-sm-12 col-md-12">
                      <div className="dataTables_length">
                        <label className="w-100">
                          Show
                          <select
                            style={{ width: "10%" }}
                            name=""
                            onChange={(e) => handleShowEntries(e)}
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
                          <th>Employee Name</th>
                          <th>Email</th>

                          <th>Access to </th>

                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!loading && showData.length === 0 && (
                          <tr className="text-center">
                            <td colSpan="6">
                              <h5>No Data Available</h5>
                            </td>
                          </tr>
                        )}
                        {loading ? (
                          <tr>
                            <td className="text-center" colSpan="6">
                              Loading...
                            </td>
                          </tr>
                        ) : (
                          showData.map((employee, i) => {
                            return (
                              <tr key={i}>
                                <td className="text-start">{employee.name}</td>
                                <td>{employee.email}</td>

                                <td
                                  style={{ maxWidth: "200px" }}
                                  className="text-start"
                                >
                                  {renderAccessTo(employee.accessTo)}
                                </td>

                                <th>
                                  <button
                                    onClick={() =>
                                      navigate(`/edit-employee/${employee._id}`)
                                    }
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
                                  <button
                                    style={{
                                      color: "white",
                                      marginRight: "1rem",
                                    }}
                                    onClick={() => handleDelete(employee._id)}
                                    type="button"
                                    className="
                                      btn btn-primary btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mx-1
                                    mt-1
                                  "
                                  >
                                    Delete
                                  </button>
                                </th>
                              </tr>
                            );
                          })
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
                        {Math.min(currentPage * itemPerPage, employee.length)}{" "}
                        of {employee.length} entries
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
                              style={{ cursor: "pointer" }}
                              onClick={() => setCurrentPage((prev) => prev - 1)}
                            >
                              Previous
                            </span>
                          </li>

                          {!(currentPage - 1 < 1) && (
                            <li className="paginate_button page-item">
                              <span
                                className="page-link"
                                style={{ cursor: "pointer" }}
                                onClick={(e) =>
                                  setCurrentPage((prev) => prev - 1)
                                }
                              >
                                {currentPage - 1}
                              </span>
                            </li>
                          )}

                          <li className="paginate_button page-item active">
                            <span
                              className="page-link"
                              style={{ cursor: "pointer" }}
                            >
                              {currentPage}
                            </span>
                          </li>

                          {!(
                            (currentPage + 1) * itemPerPage - itemPerPage >
                            employee.length - 1
                          ) && (
                            <li className="paginate_button page-item ">
                              <span
                                className="page-link"
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                  setCurrentPage((prev) => prev + 1);
                                }}
                              >
                                {currentPage + 1}
                              </span>
                            </li>
                          )}

                          <li
                            className={
                              !(
                                (currentPage + 1) * itemPerPage - itemPerPage >
                                employee.length - 1
                              )
                                ? "paginate_button page-item next"
                                : "paginate_button page-item next disabled"
                            }
                          >
                            <span
                              className="page-link"
                              style={{ cursor: "pointer" }}
                              onClick={() => setCurrentPage((prev) => prev + 1)}
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

export default Employee;
