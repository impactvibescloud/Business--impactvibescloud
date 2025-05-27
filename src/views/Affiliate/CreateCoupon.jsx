import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Button, Box, TextField, Typography } from "@mui/material";
import { isAutheticated } from "src/auth";
const CreateCoupon = () => {
  const token = isAutheticated();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); //only for testing
  const [itemPerPage, setItemPerPage] = useState(10); //pagination
  const [page, setPage] = useState(1); //pagination
  //Form States
  const [open, setOpen] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState("");
  const [affiliateDiscountAmt, setAffiliateDiscountAmt] = useState("");
  const [valid, setValid] = useState("");
  const [affiliate, setAffiliate] = useState("");
  //Form error states
  const [couponError, setCouponError] = useState(false);
  const [discountError, setDiscountError] = useState(false);
  const [validError, setValidError] = useState(false);
  const [affiliateError, setAffiliateError] = useState(false);
  const [affiliateDiscountAmtError, setAffiliateDiscountAmtError] =
    useState(false);
  const [apiData, setApiData] = useState([]);
  //Discount limit
  const handelDiscount = (event) => {
    let value = event.target.value;
    if (parseInt(value) >= 9999) {
      setDiscount(9999);
      setDiscountError(true);
    } else if (parseInt(value) < 0) {
      setDiscount(0);
    } else {
      setDiscountError(false);
      setDiscount(value);
    }
  };
  const handelAffilateDiscount = (event) => {
    let value = event.target.value;
    if (parseInt(value) >= 9999) {
      setAffiliateDiscountAmt(9999);
      setAffiliateDiscountAmtError(true);
    } else if (parseInt(value) < 0) {
      setDiscount(0);
    } else {
      setAffiliateDiscountAmtError(false);
      setAffiliateDiscountAmt(value);
    }
  };
  //Handel Form Submition
  const handelCreate = (e) => {
    e.preventDefault();
    if (!(coupon.length === 8)) {
      setCouponError(true);
      toast.error("Code should be of 8 charecter");
      return;
    }
    if (valid === "") {
      setValidError(true);
      toast.error("Valid till is required");
      return;
    }
    if (affiliate === "") {
      setAffiliateError(true);
      toast.error("Affiliate is required");
      return;
    }
    if (discount == "") {
      setDiscountError(true);
      toast.error("Discount amount is required");
      return;
    }
    if (affiliateDiscountAmt == "") {
      setAffiliateDiscountAmtError(true);
      toast.error("Affiliate Discount Amount is required");
      return;
    }
    //Sending api Obj--------------------
    let formDataObject = {
      coupon_code: coupon,
      discount_amount: discount,
      affiliate_discount_amount: affiliateDiscountAmt,
      valid_till: valid,
      is_coupon_active: true,
      id: affiliate,
    };

    axios
      .patch("/api/v1/coupon/create", formDataObject, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((data) => {
        //reset Inputs
        setDiscount("");
        setCoupon("");
        setValid("");
        setAffiliate("");
        fetchAffiliate();
        setCouponError(false);
        setDiscountError(false);
        setValidError(false);
        setAffiliateError(false);
        setAffiliateDiscountAmtError(false);
        swal({
          title: "Congratulations!!",
          text: "The Coupon was Created successfully!",
          icon: "success",
          button: "OK",
        });
      })
      .catch((error) => {
        // Handle errors
        const message = error.response?.data?.message
          ? error.response?.data?.message
          : "Something went wrong!";
        toast.error(message);
        console.error("There was a problem with your fetch operation:", error);
      })
      .finally(() => {
        // Reset the affiliate and affiliateError state
        setAffiliateError(false);
        // Show success message
        // console.log(coupon, discount, valid, affiliate);
      });
  };
  const InputSpace = {
    marginBottom: "1rem",
    width: "20rem ",
    height: "45px",
  };
  //Back to Coupons
  const handelBack = () => {
    navigate("/affiliate/coupons");
  };
  //Calling api to get Affiliates
  const fetchAffiliate = () => {
    axios
      .get("/api/v1/coupon/getaffiliate", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setApiData(response.data.message);
      })
      .catch((error) => {
        console.log(error.message);
      });
  };
  //Calling api
  useEffect(() => {
    fetchAffiliate();
  }, []);
  return (
    <div className="container">
      <div
        className=" page-title-box
        d-flex
        align-items-center
        justify-content-between
        flex-direction-row"
      >
        <div>
          <h3>Coupons</h3>
        </div>
        <div className="d-flex">
          <div>
            <Button
              className="mx-2"
              variant="contained"
              color="primary"
              style={{
                fontWeight: "bold",
                marginBottom: "1rem",
                textTransform: "capitalize",
              }}
              onClick={handelCreate}
            >
              Create
            </Button>
          </div>
          <div>
            <Button
              onClick={handelBack}
              variant="contained"
              style={{
                fontWeight: "bold",
                marginBottom: "1rem",
                backgroundColor: "red",
                textTransform: "capitalize",
              }}
            >
              Back
            </Button>
          </div>
        </div>
      </div>
      <div className="row">
        <div
          style={{
            padding: "2rem",
            borderRadius: "0.5rem",
            backgroundColor: "white",
            marginBottom: "1rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "80%",
            margin: "auto",
          }}
          className="border"
        >
          <div style={{ width: "100%" }}>
            <Box>
              <Typography className="mb-1">
                Coupon Code (Must be 8 digit)
              </Typography>
              <TextField
                className="mb-3"
                required={true}
                sx={InputSpace}
                value={coupon}
                InputProps={{
                  inputProps: {
                    maxLength: 8,
                    minLength: 8,
                  },
                }}
                onChange={(e) => {
                  setCoupon(e.target.value);
                }}
                error={couponError}
                style={{ width: "100%" }}
              />
              {couponError ? (
                <small style={{ color: "red" }}>8 characters required</small>
              ) : (
                ""
              )}

              <Typography className="mb-1">Discount Amount</Typography>
              <div className="d-flex align-items-center">
                <div
                  style={{
                    marginRight: "5px",
                  }}
                  className="d-flex justify-content-center"
                >
                  <span style={{ fontSize: "1.7rem" }}>₹</span>
                </div>
                <TextField
                  className="mb-3"
                  required={true}
                  error={discountError}
                  type="number"
                  value={discount}
                  sx={InputSpace}
                  onChange={handelDiscount}
                  style={{ flex: 1 }}
                />
              </div>
              <Typography className="mb-1">
                Affiliate Discount Amount
              </Typography>
              <div className="d-flex align-items-center">
                <div
                  style={{
                    marginRight: "5px",
                  }}
                  className="d-flex justify-content-center"
                >
                  <span style={{ fontSize: "1.7rem" }}>₹</span>
                </div>
                <TextField
                  className="mb-3"
                  required={true}
                  error={discountError}
                  type="number"
                  value={affiliateDiscountAmt}
                  sx={InputSpace}
                  onChange={handelAffilateDiscount}
                  style={{ flex: 1 }}
                />
              </div>

              {affiliateDiscountAmtError ? (
                <small style={{ color: "red" }}>Max Amount Rs.9999</small>
              ) : (
                ""
              )}

              <Typography className="mb-1">Coupon Valid Till: </Typography>
              <input
                style={{
                  width: "100%",
                  height: "50px",
                  outline: validError ? "1px solid red" : "",
                }}
                className="mb-2"
                value={valid}
                sx={InputSpace}
                onChange={(e) => {
                  setValid(e.target.value);
                }}
                type="date"
              />
              {validError ? (
                <small style={{ color: "red" }}>
                  Validity Date is Required
                </small>
              ) : (
                ""
              )}
              <Typography className="mb-1">Select Affiliate</Typography>
              <select
                onChange={(e) => {
                  setAffiliate(e.target.value);
                }}
                style={{
                  width: "100%",
                  height: "50px",
                  outline: validError ? "1px solid red" : "",
                }}
              >
                <option value="">None</option>
                {apiData?.length > 0 &&
                  apiData.map((data) => {
                    return (
                      <option value={data._id} key={data._id}>
                        {data.name}-{data.mobile}
                      </option>
                    );
                  })}
              </select>
              {affiliateError ? (
                <small style={{ color: "red" }}>Affiliation is Required</small>
              ) : (
                ""
              )}
              <br />
            </Box>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCoupon;
