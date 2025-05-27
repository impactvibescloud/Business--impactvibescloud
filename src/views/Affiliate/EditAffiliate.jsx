import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { Link, useNavigate, useParams } from "react-router-dom";
import swal from "sweetalert";
import { Country, State, City } from "country-state-city";
import axios from "axios";
import { isAutheticated } from "src/auth";

const EditAffiliate = () => {
  const token = isAutheticated();
  const navigate = useNavigate();
  const id = useParams().id;
  const [loading, setLoading] = useState(false);

  //My states
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState();
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState();
  const [nameAsBank, setNameAsBank] = useState("");
  const [accountNo, setAccountNo] = useState();
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  //Handel Mobile Number
  const handelNumber = (e) => {
    if (!(e.target.value.length > 10)) {
      setMobile(e.target.value);
    }
  };
  //Handeling Country State City
  const [stateListData, setStateListData] = useState();
  const [cityListData, setCityListData] = useState();
  const handleCountry = async (e) => {
    await setCountry(e.target.value);
    if (stateListData || cityListData) {
      setCity("");
      setState("");
      setCityListData([]);
      setCountry(e.target.value);
    }
  };
  //Handel City State Country
  const countrieList = Country.getAllCountries();
  // const stateList = State.getStatesOfCountry();
  // const cityList = City.getCitiesOfState("IN", "CT");
  // console.log("Cityyyyyyyyyyy", cityList);
  useEffect(() => {
    const countryCode = countrieList.find((item) => item.name === country);
    if (countryCode) {
      const states = State.getStatesOfCountry(countryCode.isoCode);
      setStateListData(states);
    }
  }, [country, countrieList]);

  useEffect(() => {
    if (state) {
      const stateCode = stateListData?.find((item) => item.name === state);
      // console.log(stateCode);
      if (stateCode) {
        const cities = City.getCitiesOfState(
          stateCode.countryCode,
          stateCode.isoCode
        );
        // console.log(cities);
        setCityListData(cities);
      }
    }
  }, [state, stateListData]);
  //Calling to Fill form
  useEffect(() => {
    axios
      .get(`/api/v1/affiliate/getone/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        // console.log(res.data.message);
        setName(res.data.message.name);
        setMobile(res.data.message.mobile);
        setEmail(res.data.message.email);
        setCountry(res.data.message.country);
        setState(res.data.message.state);
        setCity(res.data.message.city);
        setAddress(res.data.message.address);
        setPincode(res.data.message.pincode);
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
  }, []);

  //On form submit
  const handleSubmit = () => {
    if (
      name === "" ||
      mobile === 0 ||
      email == "" ||
      country === "" ||
      address === "" ||
      pincode === 0 ||
      nameAsBank === "" ||
      accountNo === 0 ||
      ifsc === "" ||
      bankName === "" ||
      branchName === ""
    ) {
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
    const formDataObject = {
      name: name,
      mobile: mobile,
      email: email,
      country: country,
      state: state,
      city: city,
      address: address,
      pincode: pincode,
      nameAsBank: nameAsBank,
      accountNo: accountNo,
      ifsc: ifsc,
      bankName: bankName,
      branchName: branchName,
    };
    axios
      .patch(`/api/v1/affiliate/edit/${id}`, formDataObject, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((data) => {
        // Handle the data returned by the server
        setLoading(false);
        //Resetting Inputs
        setName("");
        setMobile("");
        setEmail("");
        setCountry("");
        setState("");
        setCity("");
        setAddress("");
        setPincode("");
        setNameAsBank("");
        setAccountNo("");
        setIfsc("");
        setBankName("");
        setBranchName("");
        swal({
          title: "Congratulations!!",
          text: "The Coupon was Created successfully!",
          icon: "success",
          button: "OK",
        });
        navigate("/affiliate/affiliates");
        return;
      })
      .catch((error) => {
        setLoading(false);
        const message =
          error?.response?.data?.message || "Something went wrong!";
        console.log(message);
      });
  };

  return (
    <div className="container">
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
              Edit Affiliate
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <h4 className="mb-0"></h4>
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
                {loading ? "Loading" : "Save"}
              </Button>
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
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-6 col-md-6  col-sm-12 my-1">
          <div className="card h-100">
            <div className="card-body px-5">
              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  value={name}
                  maxLength={25}
                  onChange={(e) => setName(e.target.value)}
                />
                {name ? (
                  <>
                    <small className="charLeft mt-4 fst-italic">
                      {25 - name.length} characters left
                    </small>
                  </>
                ) : (
                  <></>
                )}{" "}
              </div>

              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  Mobile
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="mobile"
                  value={mobile}
                  maxLength="100"
                  onChange={handelNumber}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  maxLength="100"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="categorySelect">Select a Country</label>
                <select
                  id="country"
                  className="form-control"
                  style={{ width: "100%" }}
                  value={country}
                  onChange={handleCountry}
                >
                  <option value={"None"}>None</option>
                  {countrieList.map((country) => (
                    <option key={country.isoCode} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="categorySelect">Select a State</label>
                <select
                  id="state"
                  className="form-control"
                  style={{ width: "100%" }}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value={""}>None</option>
                  {stateListData?.map((states, i) => (
                    <option key={states.isoCode}>{states.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="categorySelect">Select a City</label>
                <select
                  id="city"
                  className="form-control"
                  style={{ width: "100%" }}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <option value={""}>None</option>
                  {cityListData?.map((city, i) => (
                    <option key={i} value={city.isoCode}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  Address
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="address"
                  value={address}
                  maxLength={25}
                  onChange={(e) => setAddress(e.target.value)}
                />
                {name ? (
                  <>
                    <small className="charLeft mt-4 fst-italic">
                      {25 - name.length} characters left
                    </small>
                  </>
                ) : (
                  <></>
                )}{" "}
              </div>
              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  Pincode
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="pincode"
                  value={pincode}
                  maxLength={25}
                  onChange={(e) => setPincode(e.target.value)}
                />
                {name ? (
                  <>
                    <small className="charLeft mt-4 fst-italic">
                      {25 - name.length} characters left
                    </small>
                  </>
                ) : (
                  <></>
                )}{" "}
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6 col-md-6  col-sm-12 my-1">
          <div className="card h-100">
            <div className="card-body px-5">
              <div className="mb-3 me-3">
                <label htmlFor="title" className="form-label">
                  Name as per Bank records
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="nameasbank"
                  value={nameAsBank}
                  onChange={(e) => setNameAsBank(e.target.value)}
                />
              </div>
              <div className="mb-3 me-3">
                <label htmlFor="title" className="form-label">
                  Account Number
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="accountno"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                />
              </div>
              <div className="mb-3 me-3">
                <label htmlFor="title" className="form-label">
                  IFSC Code
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="ifsc"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                />
              </div>
              <div className="mb-3 me-3">
                <label htmlFor="title" className="form-label">
                  Bank Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="bankname"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              <div className="mb-3 me-3">
                <label htmlFor="title" className="form-label">
                  Branch Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="branchname"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAffiliate;
