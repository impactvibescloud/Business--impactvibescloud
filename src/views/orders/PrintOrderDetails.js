import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import axios from "axios";
import { isAutheticated } from "src/auth";

const PrintOrderDetails = React.forwardRef(({ orderData }, ref) => {
  const token = isAutheticated();
  const [company, setCompany] = useState({});
  const [logo, setLogo] = useState("");

  useEffect(() => {
    function getConfig() {
      axios
        .get(`/api/config`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setCompany(res.data?.result[0]?.address[0]);
          setLogo(res.data?.result[0]?.logo[0]?.Headerlogo);
        });
    }
    getConfig();
  }, []);

  return (
    <div className="container" ref={ref}>
      <div
        className="mx-5 my-5"
        style={{ border: "0.3px solid grey", height: "100%" }}
      >
        <div className="text-center">
          <h4 className="m-0">Order Confirmation</h4>
        </div>
        <hr className="my-1" />
        <table
          className="table table-sm mt-2 table-borderless"
          style={{ fontSize: "12px" }}
        >
          <tbody>
            <tr>
              <td rowSpan={6}>
                {logo && (
                  <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ height: "100%" }}
                  >
                    <img
                      src={logo}
                      alt={company?.company}
                      style={{ width: "150px" }}
                    />
                  </div>
                )}
              </td>
              <th
                style={{ whiteSpace: "nowrap", fontSize: "15px" }}
                className="fw-bold"
              >
                {company?.company}
              </th>
            </tr>
            <tr>
              <td>
                {company?.address}
                <br />
                {company?.city + " " + company?.state + " " + company?.pincode}
                <br />
                {company?.country}
                <br />
                GSTIN {company?.gstin}
              </td>
            </tr>
          </tbody>
        </table>
        <hr className="m-0" />
        <div className="row" style={{ fontSize: "12px" }}>
          <div className="col-6">
            <label className="ms-1">
              Order ID: <span className="fw-bold">{orderData?.order_id}</span>
            </label>
            <label className="ms-1">
              Razorpay Order ID:{" "}
              <span className="fw-bold">{orderData?.razorpay_order_id}</span>
            </label>
          </div>
          <div className="col-6">
            <label>
              Order Placed On:{" "}
              <span className="fw-bold">
                {new Date(orderData?.placed_on).toLocaleString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "numeric",
                  hour12: true,
                })}
              </span>
            </label>
          </div>
        </div>
        <table
          className="table table-sm table-bordered m-0"
          style={{ fontSize: "12px" }}
        >
          <thead>
            <tr>
              <th>Bill To</th>
              <th>Ship To</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="fw-bold">{orderData?.address?.full_name}</span>
                <br />
                {orderData.address?.flat_house_no_apartment}
                <br />
                {orderData.address?.area_street_sector_village}
                <br />
                {orderData.address?.landmark && (
                  <>
                    {orderData.address?.landmark}
                    <br />
                  </>
                )}
                {orderData.address?.address_line && (
                  <>
                    {orderData.address?.address_line}
                    <br />
                  </>
                )}
                {orderData.address?.city}
                <br />
                {orderData.address?.pincode + " " + orderData.address?.state}
              </td>
              <td>
                <span className="fw-bold">{orderData?.address?.full_name}</span>
                <br />
                {orderData.address?.flat_house_no_apartment}
                <br />
                {orderData.address?.area_street_sector_village}
                <br />
                {orderData.address?.landmark && (
                  <>
                    {orderData.address?.landmark}
                    <br />
                  </>
                )}
                {orderData.address?.address_line && (
                  <>
                    {orderData.address?.address_line}
                    <br />
                  </>
                )}
                {orderData.address?.city}
                <br />
                {orderData.address?.pincode + " " + orderData.address?.state}
              </td>
            </tr>
          </tbody>
        </table>
        <label className="mt-1 ms-1" style={{ fontSize: "12px" }}>
          Items :
        </label>
        <table
          className="table table-sm table-bordered text-center m-0"
          style={{ fontSize: "12px" }}
        >
          <thead>
            <tr>
              <th>#</th>
              <th>HSN Code</th>
              <th>Product Name</th>
              <th>Size</th>
              <th>Qnty</th>
              <th>Tax Type</th>
              <th>Gross Amount</th>
              <th>GST Rate</th>
              <th>Net Amount</th>
            </tr>
          </thead>
          <tbody>
            {orderData?.items &&
              orderData?.items?.length > 0 &&
              orderData.items.map((e, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{e.product?.hsn_code}</td>
                  <td>{e.product.name}</td>
                  <td>{e.variant.size}</td>
                  <td>{e.quantity}</td>
                  <td>{e?.igst ? "IGST" : "CGST, SGST"}</td>
                  <td>{e.price}</td>
                  <td>
                    {(e?.igst
                      ? Number(e?.igst)
                      : Number(e?.sgst) + Number(e?.cgst)
                    ).toFixed(2) + "%"}
                  </td>
                  <td>
                    {e?.igst
                      ? (
                          (e.price + (e.price * e.igst) / 100) *
                          e.quantity
                        ).toFixed(2)
                      : (
                          (e.price +
                            (e.price * e.cgst) / 100 +
                            (e.price * e.sgst) / 100) *
                          e.quantity
                        ).toFixed(2)}
                  </td>
                </tr>
              ))}
            <tr>
              <th colSpan={100}>
                <div className="d-flex justify-content-between">
                  <div className="ms-3">
                    Total Gross Amount
                    <br />
                    Rs.{orderData?.total_gross_amount}
                  </div>
                  <div>
                    Tax Amount
                    <br />
                    Rs.{orderData?.tax_amount}
                  </div>
                  <div>
                    Shipping Charge
                    <br />
                    Rs.{orderData?.shipping_charge}
                  </div>
                  <div className="me-3">
                    Final Net Amount
                    <br />
                    Rs.{orderData?.total_amount}
                  </div>
                </div>
              </th>
            </tr>
          </tbody>
        </table>
        <p
          className="text-center fw-bold my-1 p-0"
          style={{ fontSize: "12px" }}
        >
          Note: Tax Invoice will be sent along with the goods.
        </p>
        <p className="ms-2" style={{ fontSize: "12px" }}>
          Thanks for your business.
        </p>
        <QRCode
          value={JSON.stringify({ order_id: orderData?.order_id })}
          size={256}
          style={{ height: "150px", width: "150px", margin: "10px" }}
        />
      </div>
    </div>
  );
});

export default PrintOrderDetails;
