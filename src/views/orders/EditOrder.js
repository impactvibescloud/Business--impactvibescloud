import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { isAutheticated } from "src/auth";
import { useDispatch, useSelector } from "react-redux";
import { addItemsToCart } from "src/redux/Actions/cartAction";
import toast from "react-hot-toast";
import { cibBlackberry } from "@coreui/icons";
import Button from "@mui/material/Button";

function EditOrder() {
  const { status, id } = useParams();

  const { cartItems, subTotal, shippingCharge, tax, shipingInfo, total } =
    useSelector((state) => state.cart);

  const AllStates = useSelector((state) => state);
  const getValue = useRef();
  const getFranchiseeID = useRef();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const printOrderRef = useRef();
  const token = isAutheticated();
  const [productData, setProductData] = useState([]);
  const [allFranchisee, setAllFranchisee] = useState([]);
  const [allTax, setAllTax] = useState([]);

  const [productDetails, setProductDetails] = useState();
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState("");
  // const [data, setData] = useState({
  //     product_Name: '',
  //     address: '',
  //     quantity: '',
  //     contact_Number: '',
  //     total_Price: '',
  // })
  useEffect(() => {
    const getSingleOrder = async () => {
      const res = await axios.get(`/api/order/getOne/${id}`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data) {
        setOrderId(res.data?.order?.order_id);
        let options = {
          Franchisee: res.data?.order?.shippingInfo?.Franchisee?._id,
          name: res.data?.order?.shippingInfo?.name,

          contact_Number: res.data?.order?.shippingInfo?.contact_Number,
          contact_Person_Name:
            res.data?.order?.shippingInfo?.contact_Person_Name,
          address: res.data?.order?.shippingInfo?.address,
          city: res.data?.order?.shippingInfo?.city,
          price_Lable: res.data?.order?.shippingInfo?.Franchisee?.price_Lable,
          state: res.data?.order?.shippingInfo?.state,
          banner: res.data?.order?.shippingInfo?.Franchisee?.banner?.url,
          // Franchisee_Url: res?.data?.data?.url
        };
        dispatch({ type: "addShippingInfo", payload: options });
        if (res.data?.order?.orderItems) {
          res.data?.order?.orderItems.map((i, ind) => {
            dispatch({ type: "addToCart", payload: i });
            dispatch({ type: "calculatePrice" });
          });
        }
      }
    };
    getSingleOrder();
  }, [token]);

  useEffect(() => {
    const getAllTax = async () => {
      const res = await axios.get(`/api/tax/view_tax`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data) {
        // console.log(res.data)
        setAllTax(res.data);
      }
    };
    getAllTax();
  }, [token]);

  useEffect(() => {
    function getProductDetails() {
      setLoading(true);
      axios
        .get(`/api/product/getAll/admin`, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setLoading(false);
          // console.log(res.data.product)
          setProductData(res.data.product);
        })
        .catch((err) => {
          setLoading(false);
          // getBack()
        });
    }
    function getFranchiseeDetails() {
      setLoading(true);
      axios
        .get(`/api/franchisee`, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setLoading(false);
          // console.log(res.data.data)
          setAllFranchisee(res.data.data);
        })
        .catch((err) => {
          setLoading(false);
          // getBack()
        });
    }
    getProductDetails();
    getFranchiseeDetails();
  }, []);

  const handleChange = (e) => {
    if (e.target.type === "text") {
      setData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    } else {
      setOrderStatus(e.target.value);
    }
  };
  const handleQuantityChange = (e) => {
    setData((prev) => ({
      ...prev,
      quantity: e.target.value,
      total_Price: productDetails?.base_Price * e.target.value,
    }));
  };

  // ------------------------Frenchisee handle------------------------------//

  const handleGetSingleFrenchisee = async () => {
    console.log(getFranchiseeID.current.value);

    axios
      .get(`/api/franchisee/arrayspopulate/${getFranchiseeID.current.value}`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setLoading(false);
        console.log(res.data.data);
        let options = {
          Franchisee: res?.data?.data?._id,
          name: res?.data?.data?.name,

          contact_Number: res?.data?.data?.contact_Number,
          contact_Person_Name: res?.data?.data?.contact_Person_Name,
          address:
            res?.data?.data?.address_line_1 +
            " " +
            res?.data?.data?.address_line_2,
          city: res?.data?.data?.city?.city_name,
          price_Lable: res?.data?.data?.price_Lable,
          state: res?.data?.data?.city?.state?.state_name,
          banner: res?.data?.data?.banner?.url,
          Franchisee_Url: res?.data?.data?.url,
        };

        dispatch({ type: "addShippingInfo", payload: options });

        // localStorage.setItem("shippingInfo", JSON.stringify(AllStates.shipingInfo));

        toast.success("Franchisee Added");
      })
      .catch((err) => {
        setLoading(false);
      });
  };
  const FranchiseeRemove = (id) => {
    dispatch({
      type: "deleteFromshippingInfo",
      payload: { Franchisee: id },
    });
    toast.success("Franchisee Removed");
  };
  // ------------------------Frenchisee handle  End------------------------------//
  // ------------------------product handle------------------------------//

  const handleGetSingleProduct = async (e) => {
    axios
      .get(`/api/product/getOne/${getValue.current.value}`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setLoading(false);
        const productAllkey = Object.keys(res?.data?.product);
        const productAllValue = Object.values(res?.data?.product);
        const findIndex1 = productAllkey.indexOf(shipingInfo?.price_Lable);
        const findIndex2 = productAllkey.indexOf(
          `${shipingInfo?.price_Lable}_With_Tax`
        );

        let options = {
          name: res?.data?.product?.name,
          price: productAllValue[findIndex1],
          product: res?.data?.product?._id,
          quantity: 1,

          image: res?.data?.product?.image?.url,

          taxId: res?.data?.product?.taxId,
          price_With_Tax: productAllValue[findIndex2],
        };
        dispatch({ type: "addToCart", payload: options });

        dispatch({ type: "calculatePrice" });

        toast.success("Product Added");
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const handleRemove = (id) => {
    dispatch({
      type: "deleteFromCart",
      payload: { product: id },
    });
    dispatch({ type: "calculatePrice" });
    toast.success("Item Removed");
  };
  //increase qty
  const increaseQuantity = (id) => {
    dispatch({
      type: "addToCart",
      payload: { product: id },
    });
    dispatch({ type: "calculatePrice" });
    // localStorage.setItem("cartItems", JSON.stringify(AllStates.cart));
  };

  const decreaseQuantity = (id) => {
    dispatch({
      type: "decrement",
      payload: { product: id },
    });

    dispatch({ type: "calculatePrice" });
  };
  // ------------------------product handle End------------------------------//

  function handleSubmit() {
    if (shipingInfo === null) {
      swal({
        title: "Warning",
        text: "Please select Franchisee ",
        icon: "error",
        button: "Close",
        dangerMode: true,
      });
      return;
    } else if (cartItems.length < 1) {
      swal({
        title: "Warning",
        text: "Please select atleast one product",
        icon: "error",
        button: "Close",
        dangerMode: true,
      });
      return;
    } else if (tax === "" || shippingCharge === "" || total === "") {
      swal({
        title: "Warning",
        text: "Fill all mandatory fields",
        icon: "error",
        button: "Close",
        dangerMode: true,
      });
      return;
    }

    setLoading(true);

    setLoading(true);
    axios
      .put(
        `/api/order/edit/${id}`,
        {
          orderItems: cartItems,
          shippingInfo: shipingInfo,
          shipping_charge: shippingCharge,
          tax_amount: tax,
          total_amount: total,
        },

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
          text: res.data.message ? res.data.message : "Order Updated!",
          icon: "success",
          button: "ok",
        });
        setLoading(false);
        navigate("/orders/new");
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        swal({
          title: "Warning",
          text: error.response.data.message
            ? error.response.data.message
            : "Something went wrong!",
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
                    <p> Edit Order</p>
                    {orderId && (
                      <span>
                        <small>Order ID : {orderId}</small>{" "}
                      </span>
                    )}
                  </div>
                  <div className="page-title-right">
                    <Button
                      variant="contained"
                      color="primary"
                      style={{
                        fontWeight: "bold",
                        marginBottom: "1rem",
                        textTransform: "capitalize",
                        marginRight: "5px",
                      }}
                      onClick={() => handleSubmit()}
                      disabled={loading}
                    >
                      {loading ? "Loading" : "Edit Now"}
                    </Button>
                    <Link to="/orders/new">
                      <Button
                        variant="contained"
                        color="secondary"
                        style={{
                          fontWeight: "bold",
                          marginBottom: "1rem",
                          textTransform: "capitalize",
                        }}
                      >
                        Back
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-6 mt-3">
                <div className="card">
                  <div className="card-body">
                    <div className="mt-1">
                      <label className="fw-bold">Franchisee :</label>
                      <div className="d-flex">
                        <select
                          className="form-control me-2"
                          onChange={handleChange}
                          value={orderStatus}
                          ref={getFranchiseeID}
                          disabled={shipingInfo !== null}
                        >
                          <option value="" disabled></option>
                          {allFranchisee &&
                            allFranchisee.map((item, index) => (
                              <option key={index} value={item?._id}>
                                {item?.name}
                              </option>
                            ))}
                        </select>
                        <button
                          className="btn-sm btn-primary"
                          onClick={(e) => handleGetSingleFrenchisee(e)}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    {shipingInfo !== null && (
                      <div className="my-2">
                        <div className="row" style={{ fontSize: "14px" }}>
                          <div className="col-sm-4">
                            <img
                              src={shipingInfo?.banner}
                              alt={shipingInfo?.name}
                              width="100%"
                              // style={{
                              //     width: '100%',
                              //     objectFit: 'contain',
                              //     maxHeight: '100px',
                              // }}
                            />
                          </div>
                          <div className="col-sm-8">
                            <h6 className="m-0 ms-2">{shipingInfo?.name}</h6>
                            <parent className="m-0 ms-2 mt-3">
                              Address. : {shipingInfo?.address}
                            </parent>
                            <p className="m-0 ms-2 mt-1">
                              Contact No. : {shipingInfo?.contact_Number}
                            </p>
                            <p className="m-0 ms-2 mt-1">
                              Contact Person Name :{" "}
                              {shipingInfo?.contact_Person_Name}
                            </p>
                            <p className="m-0 ms-2 mt-1">
                              Price Lable : {shipingInfo?.price_Lable}
                            </p>

                            <button
                              className="btn btn-danger btn-sm ms-2 mt-2"
                              onClick={() => FranchiseeRemove(shipingInfo?.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <hr />
                      </div>
                    )}
                    <div className="mt-3">
                      <label>
                        <span className="fw-bold">Razorpay Order ID : </span>
                        {productData?.razorpay_order_id}
                      </label>
                    </div>{" "}
                    <div className="mt-1">
                      <label>
                        <span className="fw-bold">Razorpay Payment ID : </span>
                        {productData?.razorpay_payment_id}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6 mt-3">
                {shipingInfo !== null && (
                  <div className="card">
                    <div className="card-body">
                      <div className="mt-1">
                        <label className="fw-bold">Select Product:</label>
                        <div className="d-flex">
                          <select
                            className="form-control me-2"
                            // onChange={handleGetSingleProduct}
                            // value={productData?._id}
                            ref={getValue}
                          >
                            <option value="">-----</option>
                            {productData &&
                              productData.map((item, index) => (
                                <option key={index} value={item?._id}>
                                  {item?.name}
                                </option>
                              ))}
                          </select>
                          <button
                            className="btn-sm btn-primary"
                            onClick={(e) => handleGetSingleProduct(e)}
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      <div className="mt-2">
                        <label className="fw-bold">Product :</label>

                        {cartItems &&
                          cartItems.map((productDetails, i) => (
                            <div className="my-2">
                              <div className="row" style={{ fontSize: "14px" }}>
                                <div className="col-sm-4">
                                  <img
                                    src={productDetails?.image[0]?.url}
                                    alt={productDetails?.name}
                                    style={{
                                      width: "100%",
                                      objectFit: "contain",
                                      maxHeight: "150px",
                                    }}
                                  />
                                </div>
                                <div className="col-sm-8">
                                  <h6 className="m-0 ms-2">
                                    {productDetails?.name}
                                  </h6>
                                  <div className="row">
                                    <div className="col-sm-6">
                                      <div
                                        className="d-flex justify-content-center mt-3 me-3 "
                                        style={{
                                          width: "6rem",
                                        }}
                                      >
                                        <button
                                          className="btn btn-sm btn-primary "
                                          onClick={() =>
                                            decreaseQuantity(
                                              productDetails?.product
                                            )
                                          }
                                        >
                                          -
                                        </button>
                                        <span className="px-2 mt-1" style={{}}>
                                          {productDetails?.quantity}
                                        </span>
                                        <button
                                          className="btn btn-sm btn-primary"
                                          onClick={() =>
                                            increaseQuantity(
                                              productDetails?.product
                                            )
                                          }
                                        >
                                          +
                                        </button>
                                      </div>

                                      <p className="m-0 mt-3">
                                        <stong>Total Price:</stong> $
                                        {productDetails?.quantity *
                                          productDetails?.price}
                                      </p>
                                      <button
                                        className="btn btn-danger btn-sm ms-2 mt-3"
                                        onClick={() =>
                                          handleRemove(productDetails?.product)
                                        }
                                      >
                                        Delete
                                      </button>
                                    </div>
                                    <div className="col-sm-6">
                                      <p className="m-0 mt-3">
                                        <stong> Price:</stong> $
                                        {productDetails?.price}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <hr />
                            </div>
                          ))}
                        {subTotal && (
                          <h5 className="m-0 contents-center mt-3">
                            <span> Total Order Value:</span> ₹{subTotal}
                          </h5>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                            {productData?.status_timeline?.new
                              ? new Date(
                                  productData?.status_timeline?.new
                                ).toLocaleString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "numeric",
                                  hour12: true,
                                })
                              : new Date(productData?.placed_on).toLocaleString(
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
                            {productData?.status_timeline?.processing
                              ? new Date(
                                  productData?.status_timeline?.processing
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
                            {productData?.status_timeline?.dispatched
                              ? new Date(
                                  productData?.status_timeline?.dispatched
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
                            {productData?.status_timeline?.delivered
                              ? new Date(
                                  productData?.status_timeline?.delivered
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
                            {productData?.status_timeline?.cancelled
                              ? new Date(
                                  productData?.status_timeline?.cancelled
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
                            {productData?.status_timeline?.returned
                              ? new Date(
                                  productData?.status_timeline?.returned
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
        {/* <PrintOrderDetails productData={productData} ref={printOrderRef} /> */}
      </div>
    </>
  );
}

export default EditOrder;
