import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { isAutheticated } from "src/auth";
import swal from "sweetalert";
import OrderDetails from "./orderDetails";
import debounce from "lodash.debounce";
const principalDistributor = () => {
  const token = isAutheticated();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loading1, setLoading1] = useState(true);
  const [success, setSuccess] = useState(true);
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [totalData, setTotalData] = useState(0);
  const nameRef = useRef();

  const getUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/v1/admin/pd`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
          show: itemPerPage,
          name: nameRef.current.value,
        },
      });
      // console.log(res.data);
      setUsers(res.data.users);
      setTotalData(res.data?.total_data);
      setTotalPages(res.data?.total_pages);
    } catch (error) {
      swal({
        title: error,
        text: "please login to access the resource or refresh the page  ",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
  }, [itemPerPage, currentPage]);

  const debouncedSearch = useCallback(
    debounce(() => {
      setCurrentPage(1);
      getUsers();
    }, 500),
    []
  );

  const handleSearchChange = () => {
    debouncedSearch();
  };
  // console.log(users);

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
                  All Outlets
                </div>

                <div className="page-title-right">
                  <Button
                    variant="contained"
                    color="primary"
                    className="font-bold mb-2 capitalize mr-2"
                    onClick={() => {
                      navigate("/add-principal-distributor");
                    }}
                  >
                    Add Outlet
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
                    <div className="col-lg-1">
                      <div className="dataTables_length">
                        <label className="w-100">
                          Show
                          <select
                            onChange={(e) => {
                              setItemPerPage(Number(e.target.value));
                              setCurrentPage(1); // Reset to first page when changing items per page
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
                      <label>Name:</label>
                      <input
                        type="text"
                        name="searchTerm"
                        placeholder="Name"
                        className="form-control"
                        ref={nameRef}
                        onChange={handleSearchChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div
                    className="table-responsive table-shoot mt-3"
                    style={{ overflowX: "auto" }}
                  >
                    <table
                      className="table table-centered table-nowrap"
                      style={{
                        border: "1px solid",
                        tableLayout: "fixed", // Keeps columns fixed width
                        width: "100%", // Ensures table takes full width
                        minWidth: "1000px", // Prevents the table from shrinking too much
                      }}
                    >
                      <thead
                        className="thead-info"
                        style={{ background: "rgb(140, 213, 213)" }}
                      >
                        <tr>
                          {/* <th style={{ width: "10%" }}>Unique Id</th> */}

                          <th style={{ width: "10%" }}>Name</th>
                          <th style={{ width: "13%" }}>Email</th>
                          <th style={{ width: "12%" }}>Date Registered</th>
                          <th style={{ width: "12%" }}>Last Purchase</th>
                          <th style={{ width: "7%" }}>Orders</th>

                          <th className="text-center" style={{ width: "20%" }}>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr className="text-center">
                            <td colSpan="9">
                              <h5>Loading....</h5>
                            </td>
                          </tr>
                        ) : users.length > 0 ? (
                          users.map((user, i) => (
                            <tr key={i}>
                              {/* <td>{user._id}</td> */}

                              <td className="text-start">{user.name}</td>
                              <td className="text-start">{user.email}</td>
                              <td className="text-center">
                                {new Date(user.createdAt).toLocaleString(
                                  "en-IN",
                                  {
                                    // weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    // hour: "numeric",
                                    // minute: "numeric",
                                    // hour12: true,
                                  }
                                )}
                              </td>
                              <td className="text-start">
                                {user.lastOrderDate
                                  ? new Date(user.lastOrderDate).toLocaleString(
                                      "en-IN",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      }
                                    )
                                  : "No purchase"}
                              </td>
                              <td className="text-start">
                                {/* <Link
                                  to={`/principaldistributor/orders/${user?._id}`}
                                > */}
                                  <button
                                    style={{
                                      color: "black",
                                      width: "50px",
                                      textAlign: "center",
                                    }}
                                    type="button"
                                    className="btn btn-warning btn-sm waves-effect waves-light btn-table"
                                  >
                                    {user.totalOrders}
                                  </button>
                                {/* </Link> */}
                              </td>
                              {/* {loading1 && (
                                <>
                                  <td className="text-start">loading...</td>
                                  <td className="text-start">loading...</td>
                                </>
                              )}

                              <OrderDetails
                                _id={user?._id}
                                setLoading1={setLoading1}
                              /> */}

                              <td className="text-end">
                                <Link to={`/franchisee/${user?._id}`}>
                                  <button
                                    type="button"
                                    className=" btn btn-info btn-sm  waves-effect waves-light btn-table"
                                  >
                                    View
                                  </button>
                                </Link>
                                <Link to={`/franchisee/products/${user?._id}`}>
                                  <button
                                    type="button"
                                    className="ml-2 btn btn-success btn-sm  waves-effect waves-light btn-table"
                                  >
                                  Add Products
                                  </button>
                                </Link>
                                <Link to={`/franchisee/equipment/${user?._id}`}>
                                  <button
                                    type="button"
                                    className="ml-2 btn btn-success btn-sm  waves-effect waves-light btn-table"
                                  >
                                  Add Equipment
                                  </button>
                                </Link>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center">
                              <h5>No Outlet found!</h5>
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
                        Showing {users?.length} of {totalData} entries
                      </div>
                    </div>

                    <div className="col-sm-12 col-md-6">
                      <div className="dataTables_paginate paging_simple_numbers">
                        <ul className="pagination">
                          <li
                            className={`paginate_button page-item previous ${
                              currentPage === 1 ? "disabled" : ""
                            }`}
                          >
                            <a
                              className="page-link"
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                              }
                              aria-controls="datatable"
                            >
                              Previous
                            </a>
                          </li>
                          {Array.from({ length: totalPages }, (_, index) => (
                            <li
                              key={index}
                              className={`paginate_button page-item ${
                                currentPage === index + 1 ? "active" : ""
                              }`}
                            >
                              <a
                                className="page-link"
                                onClick={() => setCurrentPage(index + 1)}
                                aria-controls="datatable"
                              >
                                {index + 1}
                              </a>
                            </li>
                          ))}
                          <li
                            className={`paginate_button page-item next ${
                              currentPage === totalPages ? "disabled" : ""
                            }`}
                          >
                            <a
                              className="page-link"
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(prev + 1, totalPages)
                                )
                              }
                              aria-controls="datatable"
                            >
                              Next
                            </a>
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

export default principalDistributor;
