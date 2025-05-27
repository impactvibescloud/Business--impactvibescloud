import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { isAutheticated } from "src/auth";

function ReturnedOrders() {
  const token = isAutheticated();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(true);
  const [returnedOrdersData, setReturnedOrdersData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [showData, setShowData] = useState(returnedOrdersData);

  const handleShowEntries = (e) => {
    setCurrentPage(1);
    setItemPerPage(e.target.value);
  };

  useEffect(() => {
    function getProcessingOrder() {
      axios
        .get(`/api/order/list/returned`, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setReturnedOrdersData(res.data.data);
          setLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setLoading(false);
        });
    }
    getProcessingOrder();
  }, []);

  useEffect(() => {
    const loadData = () => {
      const indexOfLastPost = currentPage * itemPerPage;
      const indexOfFirstPost = indexOfLastPost - itemPerPage;
      setShowData(returnedOrdersData.slice(indexOfFirstPost, indexOfLastPost));
    };
    loadData();
  }, [currentPage, itemPerPage, returnedOrdersData]);

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
                  Returned Orders
                </div>
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
                        className="thead-light"
                        style={{ background: "#ecdddd" }}
                      >
                        <tr>
                          <th className="text-start">Order ID</th>
                          <th className="text-start">Parent Name</th>
                          <th className="text-start">Amount</th>
                          <th className="text-start">Placed On</th>
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
                                <td className="text-start">{order.order_id}</td>
                                <td className="text-start">
                                  {order.parent.name}
                                </td>
                                <td className="text-start">
                                  ₹{order?.total_amount}
                                </td>
                                <td className="text-start">
                                  {new Date(order?.placed_on).toLocaleString(
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
                                  <span className="badge text-bg-success text-white">
                                    {order?.status}
                                  </span>
                                </td>
                                <td className="text-start">
                                  <Link
                                    to={`/orders/${order.status}/${order._id}`}
                                  >
                                    <button
                                      style={{ color: "white" }}
                                      type="button"
                                      className="
                                      btn btn-primary btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    ms-2
                                  "
                                    >
                                      View
                                    </button>
                                  </Link>
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
                          returnedOrdersData.length
                        )}{" "}
                        of {returnedOrdersData.length} entries
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
                            returnedOrdersData.length - 1
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
                                returnedOrdersData.length - 1
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

export default ReturnedOrders;
