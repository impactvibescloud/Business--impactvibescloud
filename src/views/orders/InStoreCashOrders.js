import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { isAutheticated } from "src/auth";
import Button from "@mui/material/Button";

function InStoreCashOrders() {
  const token = isAutheticated();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(true);
  const [newOrdersData, setNewOrdersData] = useState([]);
  console.log(newOrdersData);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [showData, setShowData] = useState(newOrdersData);

  const handleShowEntries = (e) => {
    setCurrentPage(1);
    setItemPerPage(e.target.value);
  };

  useEffect(() => {
    function getNewOrder() {
      axios
        .get(`/api/order/getAll/new`, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          const filteredOrders = res.data.order.filter(
            (order) => order.orderType === "PointOfSale" && order.paymentMode === "cod"
          );
  
          // Set the filtered orders data
          setNewOrdersData(filteredOrders);
          setLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setLoading(false);
        });
    }
    getNewOrder();
  }, [success]);
  

  useEffect(() => {
    const loadData = () => {
      const indexOfLastPost = currentPage * itemPerPage;
      const indexOfFirstPost = indexOfLastPost - itemPerPage;
      setShowData(newOrdersData.slice(indexOfFirstPost, indexOfLastPost));
    };
    loadData();
  }, [currentPage, itemPerPage, newOrdersData]);

  const handleDelete = (id) => {
    console.log(id);
    swal({
      title: "Are you sure?",
      icon: "error",
      buttons: {
        Yes: { text: "Yes", value: true },
        Cancel: { text: "Cancel", value: "cancel" },
      },
    }).then((value) => {
      if (value === true) {
        axios
          .delete(`/api/order/delete/${id}`, {
            headers: {
              "Access-Control-Allow-Origin": "*",
              Authorization: `Bearer ${token}`,
            },
          })
          .then((res) => {
            setSuccess((prev) => !prev);
          })
          .catch((err) => {
            swal({
              title: "Warning",
              text: err.response.data.message
                ? err.response.data.message
                : "Something went wrong!",
              icon: "error",
              button: "Retry",
              dangerMode: true,
            });
          });
      }
    });
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
                  New Orders
                </div>

                {/* <div className="page-title-right">
                  <Link to="/order/add">
                    <Button
                      variant="contained"
                      color="primary"
                      style={{
                        fontWeight: "bold",
                        marginBottom: "1rem",
                        textTransform: "capitalize",
                      }}
                    >
                      Add Order
                    </Button>
                  </Link>
                </div> */}
              </div>
            </div>
          </div>
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
                        className="thead"
                        style={{ background: "rgb(140, 213, 213)" }}
                      >
                        <tr>
                          <th className="text-start">Order ID</th>
                          <th className="text-start">Customer</th>
                          <th className="text-start">Order value</th>
                          <th className="text-start">Order At</th>
                          <th className="text-start">Status</th>
                          <th className="text-start">Actions</th>
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
                          showData.map((order, i) => {
                            return (
                              <tr key={i}>
                                <td className="text-start">{order?.orderID}</td>
                                <td className="text-start">
                                  {order?.user?.name}
                                </td>
                                <td className="text-start">
                                  ₹{order?.total_amount}
                                </td>
                                <td className="text-start">
                                  {new Date(order?.createdAt).toLocaleString(
                                    "en-IN",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "numeric",
                                      hour12: true,
                                    }
                                  )}
                                </td>
                                <td className="text-start">
                                  <span className="badge text-bg-primary text-white">
                                    {order?.orderStatus}
                                  </span>
                                </td>
                                <td className="text-start">
                                  {/* <Link to={`/orders/${order.orderStatus}/${order._id}`}> */}
                                  <Link
                                    to={`/inStoreOrders/${order.orderStatus}/${order._id}`}
                                  >
                                    <button
                                      style={{ color: "white" }}
                                      type="button"
                                      className="
                                      btn btn-primary btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    ms-2 mt-1
                                  "
                                    >
                                      View
                                    </button>
                                  </Link>
                                  {/* <Link to={`/orders/edit/${order._id}`}>
                                    <button
                                      style={{ color: "white" }}
                                      type="button"
                                      className="
                                      btn btn-info btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    ms-2  mt-1
                                  "
                                    >
                                      Edit
                                    </button>
                                  </Link> */}

                                  {/* <button
                                    style={{ color: "white" }}
                                    type="button"
                                    className="
                                      btn btn-danger btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    ms-2  mt-1
                                  "
                                    onClick={() => handleDelete(order._id)}
                                  >
                                    Delete
                                  </button> */}
                                </td>
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
                        {Math.min(
                          currentPage * itemPerPage,
                          newOrdersData.length
                        )}{" "}
                        of {newOrdersData.length} entries
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
                            newOrdersData.length - 1
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
                                newOrdersData.length - 1
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
}

export default InStoreCashOrders;
