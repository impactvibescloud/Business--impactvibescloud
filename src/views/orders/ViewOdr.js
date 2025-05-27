import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import ReactToPrint from "react-to-print";
import { isAutheticated } from "src/auth";

import PrintOrderDetails from "./PrintOrderDetails.js";

function ViewOdr() {
  const { status, id } = useParams();
  const navigate = useNavigate();
  const printOrderRef = useRef();
  const token = isAutheticated();
  const [orderData, setOrderData] = useState({});
  const [loading, setLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState("");
  const [data, setData] = useState({
    courier_name: "",
    tracking_id: "",
  });

  useEffect(() => {
    function getOrderDetails() {
      setLoading(true);
      axios
        .get(`/api/order/${id}`, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setLoading(false);
          console.log(res.data);
          setOrderData(res.data.data);
        })
        .catch((err) => {
          setLoading(false);
          getBack();
        });
    }
    getOrderDetails();
  }, []);

  const handleChange = (e) => {
    if (e.target.type === "text") {
      setData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    } else {
      setOrderStatus(e.target.value);
    }
  };

  function handleSubmit() {
    if (orderStatus === "") return;
    if (orderData.status === "processing") {
      if (data.courier_name.trim() === "" || data.tracking_id.trim() === "") {
        swal({
          title: "Warning",
          text: "Enter Courier Name And Tracking ID!",
          icon: "error",
          button: "Retry",
          dangerMode: true,
        });
        return;
      }
    }
    setLoading(true);
    axios
      .patch(
        `/api/order/${id}`,
        { ...data, status: orderStatus },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((res) => {
        swal({
          title: "Updated",
          text: "Order updated!",
          icon: "success",
          button: "Return",
        });
        setLoading(false);
        getBack();
      })
      .catch((err) => {
        setLoading(false);
        swal({
          title: "Warning",
          text: "Something went wrong!",
          icon: "error",
          button: "Retry",
          dangerMode: true,
        });
      });
  }

  function getBack() {
    navigate(`/orders/${status}`, { replace: true });
  }

  return (
    <>
      {" "}
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
                    Order Details
                  </div>
                  <div className="page-title-right">
                    {(orderData?.status === "new" ||
                      orderData?.status === "processing") && (
                      <ReactToPrint
                        trigger={() => (
                          <button className="btn btn-info text-white me-2">
                            Print
                          </button>
                        )}
                        content={() => printOrderRef.current}
                      />
                    )}

                    {orderData?.status !== "cancelled" &&
                      orderData?.status !== "returned" &&
                      orderData?.status !== "delivered" && (
                        <button
                          className="btn btn-success text-white me-2"
                          onClick={() => handleSubmit()}
                          disabled={loading}
                        >
                          {loading ? "Loading" : "Update"}
                        </button>
                      )}
                    <button
                      className="btn btn-primary"
                      onClick={() => getBack()}
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-7 mt-3">
                <div className="card">
                  <div className="card-body">
                    <div className="mt-1">
                      <label>
                        <span className="fw-bold">
                          Order ID: {orderData?.order_id}
                        </span>
                      </label>
                    </div>
                    <div className="mt-1">
                      <label>
                        <span className="fw-bold">
                          Parent Name: {orderData?.parent?.name}
                        </span>
                      </label>
                    </div>
                    <div className="mt-1">
                      <label>
                        <span className="fw-bold">
                          School Name: {orderData?.parent?.school?.name}
                        </span>
                      </label>
                    </div>
                    <div className="mt-1">
                      <label className="fw-bold">Items :</label>
                      {orderData?.items &&
                        orderData?.items?.length > 0 &&
                        orderData.items.map((e, i) => (
                          <div key={i} className="my-2">
                            <div className="row" style={{ fontSize: "14px" }}>
                              <div className="col-sm-4">
                                <img
                                  src={e.product?.images[0]?.url}
                                  alt={e.product.name}
                                  style={{
                                    width: "100%",
                                    objectFit: "contain",
                                    maxHeight: "150px",
                                  }}
                                />
                              </div>
                              <div className="col-sm-8">
                                <h6 className="m-0">{e.product.name}</h6>
                                <div className="row">
                                  <div className="col-sm-6">
                                    <p className="m-0">
                                      <span>SKU</span>: {e.product?.sku}
                                    </p>
                                    <p className="m-0">
                                      <span>Variant</span>: {e.variant.size}
                                    </p>
                                    <p className="m-0">
                                      <span>Quantity:</span> {e.quantity}
                                    </p>
                                  </div>
                                  <div className="col-sm-6">
                                    {" "}
                                    <p className="m-0">
                                      <span>Price:</span> Rs.{e.price}
                                    </p>
                                    {e?.igst && (
                                      <p className="m-0">
                                        <span>IGST:</span> {e.igst}%
                                      </p>
                                    )}
                                    {e?.cgst && (
                                      <p className="m-0">
                                        <span>CGST:</span> {e.cgst}%
                                      </p>
                                    )}
                                    {e?.sgst && (
                                      <p className="m-0">
                                        <span>SGST:</span> {e.sgst}%
                                      </p>
                                    )}
                                    <p className="m-0">
                                      <span>Total:</span> Rs.{e.amount}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <hr />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-5 mt-3">
                <div className="card">
                  <div className="card-body">
                    {status !== "cancelled" &&
                      status !== "returned" &&
                      status !== "delivered" && (
                        <div className="mt-1">
                          <label className="fw-bold">Status :</label>
                          <select
                            className="form-control"
                            onChange={handleChange}
                            value={orderStatus}
                          >
                            {orderData.status === "new" && (
                              <>
                                <option value="">New</option>
                                <option value="processing">Processing</option>
                                <option value="cancelled">Cancelled</option>
                              </>
                            )}
                            {orderData.status === "processing" && (
                              <>
                                <option value="">Processing</option>
                                <option value="dispatched">Dispatch</option>
                              </>
                            )}
                            {orderData.status === "dispatched" && (
                              <>
                                <option value="">Dispatch</option>
                                <option value="delivered">Delivered</option>
                              </>
                            )}
                          </select>
                        </div>
                      )}
                    <div className="mt-3">
                      {orderData?.order_id && (
                        <div className="d-flex">
                          <p className="fw-bold me-3">Order ID QR Code:</p>
                          <QRCode
                            value={JSON.stringify({
                              order_id: orderData?.order_id,
                            })}
                            size={256}
                            style={{ height: "150px", width: "150px" }}
                          />
                        </div>
                      )}
                    </div>
                    {orderData.status === "processing" && (
                      <>
                        <div className="mt-3">
                          <label className="fw-bold">Courier Name* :</label>
                          <input
                            type="text"
                            className="form-control"
                            id="courier_name"
                            value={data.courier_name}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="mt-3">
                          <label className="fw-bold">Tracking ID* :</label>
                          <input
                            type="text"
                            className="form-control"
                            id="tracking_id"
                            value={data.tracking_id}
                            onChange={handleChange}
                          />
                        </div>
                      </>
                    )}
                    <div className="mt-3">
                      <label>
                        <span className="fw-bold">Amount Paid : </span>Rs.
                        {orderData?.total_amount}
                      </label>
                    </div>
                    {orderData?.address && (
                      <>
                        <div className="mt-1">
                          <label>
                            <span className="fw-bold">Address : </span>
                            {`${orderData.address?.full_name}, ${
                              orderData.address?.flat_house_no_apartment
                            }, ${
                              orderData.address?.area_street_sector_village
                            }, ${
                              orderData.address?.landmark &&
                              orderData.address?.landmark + ", "
                            }${
                              orderData.address?.address_line &&
                              orderData.address?.address_line + ", "
                            }${orderData.address?.city}, ${
                              orderData.address?.state
                            }, ${orderData.address?.pincode}`}
                          </label>
                        </div>
                        <div className="mt-1">
                          <label>
                            {" "}
                            <span className="fw-bold">Contact Number : </span>
                            {orderData.address?.mobile_number}
                          </label>
                        </div>
                      </>
                    )}
                    {orderData?.courier_name && (
                      <div className="mt-1">
                        <label>
                          <span className="fw-bold">Courier Name : </span>
                          {orderData?.courier_name}
                        </label>
                      </div>
                    )}
                    {orderData?.tracking_id && (
                      <div className="mt-1">
                        <label>
                          <span className="fw-bold">Tracking ID : </span>
                          {orderData?.tracking_id}
                        </label>
                      </div>
                    )}
                    {/* <div className="mt-1">
                    <label>
                      <span className="fw-bold">Order Placed On : </span>
                      {new Date(orderData?.placed_on).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: 'numeric',
                        hour12: true,
                      })}
                    </label>
                  </div> */}
                    <div className="mt-1">
                      <label>
                        <span className="fw-bold">Razorpay Order ID : </span>
                        {orderData?.razorpay_order_id}
                      </label>
                    </div>{" "}
                    <div className="mt-1">
                      <label>
                        <span className="fw-bold">Razorpay Payment ID : </span>
                        {orderData?.razorpay_payment_id}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="card my-1">
                  <div className="card-body">
                    <label className="fw-bold">Status Timeline :</label>
                    <table
                      className="table table-info table-sm m-0"
                      style={{
                        borderRadius: "8px",
                        borderCollapse: "collapse",
                        overflow: "hidden",
                      }}
                    >
                      <tbody>
                        <tr className="text-center">
                          <th scope="row">Order Placed On</th>
                          <td> : </td>
                          <td>
                            {orderData?.status_timeline?.new
                              ? new Date(
                                  orderData?.status_timeline?.new
                                ).toLocaleString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "numeric",
                                  hour12: true,
                                })
                              : new Date(orderData?.placed_on).toLocaleString(
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
                        </tr>
                        <tr className="text-center">
                          <th scope="row">Processing Started</th>
                          <td> : </td>
                          <td>
                            {orderData?.status_timeline?.processing
                              ? new Date(
                                  orderData?.status_timeline?.processing
                                ).toLocaleString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "numeric",
                                  hour12: true,
                                })
                              : "-"}
                          </td>
                        </tr>
                        <tr className="text-center">
                          <th scope="row">Dispatched On</th>
                          <td> : </td>
                          <td>
                            {orderData?.status_timeline?.dispatched
                              ? new Date(
                                  orderData?.status_timeline?.dispatched
                                ).toLocaleString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "numeric",
                                  hour12: true,
                                })
                              : "-"}
                          </td>
                        </tr>
                        <tr className="text-center">
                          <th scope="row">Delivered On</th>
                          <td> : </td>
                          <td>
                            {orderData?.status_timeline?.delivered
                              ? new Date(
                                  orderData?.status_timeline?.delivered
                                ).toLocaleString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "numeric",
                                  hour12: true,
                                })
                              : "-"}
                          </td>
                        </tr>
                        <tr className="text-center">
                          <th scope="row">Cancelled On</th>
                          <td> : </td>
                          <td>
                            {orderData?.status_timeline?.cancelled
                              ? new Date(
                                  orderData?.status_timeline?.cancelled
                                ).toLocaleString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "numeric",
                                  hour12: true,
                                })
                              : "-"}
                          </td>
                        </tr>
                        <tr className="text-center">
                          <th scope="row">Returned On</th>
                          <td> : </td>
                          <td>
                            {orderData?.status_timeline?.returned
                              ? new Date(
                                  orderData?.status_timeline?.returned
                                ).toLocaleString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "numeric",
                                  hour12: true,
                                })
                              : "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "none" }}>
        <PrintOrderDetails orderData={orderData} ref={printOrderRef} />
      </div>
    </>
  );
}

export default ViewOdr;
