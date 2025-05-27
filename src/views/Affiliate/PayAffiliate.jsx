import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Button, Box, TextField, Typography } from "@mui/material";
import { isAutheticated } from "src/auth";
const PayAffiliate = () => {
  const token = isAutheticated();
  const id = useParams().id;
  const navigate = useNavigate();
  //Style for inputs
  const InputSpace = {
    marginBottom: "1rem",
    width: "20rem ",
    height: "45px",
  };
  //Set Affiliate Data
  const [affiliate, setAffiliate] = useState("");
  const [affiliateID, setAffiliateID] = useState("");
  const [noOfCoupons, setNoOfCoupons] = useState("");
  const [amountToPay, setAmountToPay] = useState("");
  const [coupon, setCoupon] = useState("");
  const [nameAsBank, setNameAsBank] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [affiliateDiscountAmt, setAffiliateDiscountAmt] = useState();
  //Form related
  const [amount, setAmount] = useState();
  const [transecId, setTransecId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  //Handel Pay
  const handlePay = (e) => {
    e.preventDefault();
    // console.log(amount, transecId, date);
    const formDataObject = {
      noOfCoupons,
      amountToPay,
      amount,
      transecId,
      date,
      time,
    };
    axios
      .post(`/api/v1/affiliate/pay/${id}`, formDataObject, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((data) => {
        swal({
          title: "Congratulations!!",
          text: "Successfully Payed!",
          icon: "success",
          button: "OK",
        });
        navigate("/affiliate/affiliates");
      })
      .catch((error) => {
        // Handle errors
        const message = error.response?.data?.message
          ? error.response?.data?.message
          : "Something went wrong!";
        toast.error(message);
        console.error("Error in Payment:", error);
      });
  };

  //Fetch coupon data
  const fetchPayData = () => {
    axios
      .get(`/api/v1/affiliate/getpay/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        // console.log(res.data.message);
        setAffiliate(res.data.message.name);
        setNoOfCoupons(
          res.data.message?.coupon_claimed - res.data.message?.no_of_paid_coupon
        );
        setAmountToPay(
          res.data.message.total_earning - res.data.message.paid_amount
        );
        setAmount(
          res.data.message.total_earning - res.data.message.paid_amount
        );
        setCoupon(res.data.message.coupon_code);
        setAffiliateDiscountAmt(res.data.message.affiliate_discount_amount);
        setAffiliateID(id);
        setNameAsBank(res.data.message.nameAsBank);
        setAccountNo(res.data.message.accountNo);
        setIfsc(res.data.message.ifsc);
        setBankName(res.data.message.bankName);
        setBranchName(res.data.message.branchName);
      })
      .catch((error) => {
        const message =
          error?.response?.data?.message || "Something went wrong!";
        console.log(message);
      });
  };

  //Calling to fill form and Affiliate
  useEffect(() => {
    fetchPayData();
  }, []);

  const initiatePayout = async () => {
    try {
      const response = await axios.post(
        `/api/v1/affiliate/payout`,
        {
          amountToPay,
          nameAsBank,
          accountNo,
          ifsc,
          bankName,
          branchName,
          affiliateDiscountAmt,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-end">
        <Link to="/affiliate/affiliates">
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
      <div className="row">
        <div className="col-lg-6 col-md-6 col-sm-12 my-1">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
            }}
            className="card"
          >
            <div className="card-body p-2">
              <div
                style={{
                  padding: "2rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "white",
                  // marginBottom: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                className="border"
              >
                <div style={{ width: "100%" }}>
                  <Typography className="mb-3">
                    <span style={{ fontWeight: "bold" }}>Affiliate Name: </span>
                    {affiliate}
                  </Typography>
                  <Typography className="mb-3">
                    <span style={{ fontWeight: "bold" }}>Coupon Code: </span>
                    {coupon}
                  </Typography>
                  <Typography className="mb-3">
                    <span style={{ fontWeight: "bold" }}>
                      Per coupon price:{" "}
                    </span>
                    ₹{affiliateDiscountAmt}
                  </Typography>
                  <Typography className="mb-3">
                    <span style={{ fontWeight: "bold" }}>
                      No of coupon paying for:{" "}
                    </span>
                    {noOfCoupons} Units
                  </Typography>
                  <Typography className="mb-3">
                    <span style={{ fontWeight: "bold" }}>
                      Amount to be paid:{" "}
                    </span>
                    ₹{amountToPay}
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6 col-md-6 col-sm-12 my-1">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
            }}
            className="card"
          >
            <div className="card-body p-2">
              <div
                style={{
                  padding: "2rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "white",
                  // marginBottom: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                className="border"
              >
                <div style={{ width: "100%" }}>
                  <Typography className="mb-3">
                    <span style={{ fontWeight: "bold" }}>
                      Name as per Bank records:{" "}
                    </span>
                    {nameAsBank}
                  </Typography>
                  <Typography className="mb-3">
                    <span style={{ fontWeight: "bold" }}>Account Number: </span>
                    {accountNo}
                  </Typography>
                  <Typography className="mb-3">
                    <span style={{ fontWeight: "bold" }}>IFSC Code: </span>
                    {ifsc}
                  </Typography>
                  <Typography className="mb-3">
                    <span style={{ fontWeight: "bold" }}>Bank Name: </span>
                    {bankName}
                  </Typography>
                  <Typography className="mb-3">
                    <span style={{ fontWeight: "bold" }}>Branch Name: </span>
                    {branchName}
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <hr />
      <div>
        <Button
          sx={{ marginTop: "20px", mb: 3, textAlign: "center" }}
          variant="contained"
          onClick={initiatePayout}
          color="success"
        >
          Affiliate Payout
        </Button>
      </div>
      <hr /> */}

      <div className="row">
        <div className="col-lg-12 col-md-12 col-sm-12 my-1">
          <div className="card">
            <div className="card-body p-5">
              <form onSubmit={handlePay}>
                <div className="d-lg-flex justify-content-center align-items-center">
                  <label htmlFor="title" className="form-label mr-2">
                    Transection ID
                  </label>
                  <input
                    onChange={(e) => setTransecId(e.target.value)}
                    required="true"
                    type="text"
                    className="form-control mb-3 col-lg-4 col-md-12 col-sm-12 mr-5"
                    id="ifsc"
                  />
                  <label htmlFor="title" className="form-label mr-2">
                    Date
                  </label>
                  <input
                    required="true"
                    type="date"
                    onChange={(e) => setDate(e.target.value)}
                    className="form-control mb-3 col-lg-3 col-md-12 col-sm-12"
                    id="ifsc"
                  />
                </div>

                <div>
                  <div className="d-lg-flex align-items-center justify-content-center">
                    <label htmlFor="title" className="form-label mr-2">
                      Time
                    </label>
                    <input
                      required="true"
                      type="time"
                      onChange={(e) => setTime(e.target.value)}
                      className="form-control mb-3 col-lg-3 col-md-12 col-sm-12 mr-5"
                      id="ifsc"
                    />
                    {/* <label htmlFor="title" className="form-label mr-2">
                      Amount
                    </label> */}
                    <span className="mb-3" style={{ marginRight: "0.5rem" }}>
                      Amount Rs.
                    </span>
                    <input
                      required="true"
                      type="number"
                      className="form-control mb-3 col-lg-3 col-md-12 col-sm-12 mr-4 mb-4"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      id="amount"
                    />

                    <Button
                      sx={{ marginTop: "-20px" }}
                      type="submit"
                      variant="contained"
                      color="success"
                    >
                      Save Payment
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayAffiliate;
