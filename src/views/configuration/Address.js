import axios from "axios";
import React, { useEffect, useState } from "react";

import ClipLoader from "react-spinners/ClipLoader";
import { Link } from "react-router-dom";
import swal from "sweetalert";
import { isAutheticated } from "src/auth";

function Address() {
  const token = isAutheticated();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [pincode, setPincode] = useState("");
  const [website, setWebsite] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  // const [latitude, setLatitude] = useState("");
  // const [longitude, setLongitude] = useState("");

  useEffect(() => {
    async function getConfiguration() {
      const configDetails = await axios.get(`/api/config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      configDetails.data.result.map((item) => {
        item.address.map((el) => {
          setCompany(el.company);
          setAddress(el.address);
          setCity(el.city);
          setState(el.state);
          setCountry(el.country);
          setPincode(el.pincode);
          setWebsite(el.website);
          setContact(el.contact);
          setEmail(el.email);
          // setLatitude(el.latitude);
          // setLongitude(el.longitude);
        });
      });
    }
    getConfiguration();
  }, []);
  async function handelChange(e) {
    if (e.target.name.toLowerCase() === "address") {
      setAddress(e.target.value);
    } else if (e.target.name.toLowerCase() === "company name") {
      setCompany(e.target.value);
    } else if (e.target.name.toLowerCase() === "city") {
      setCity(e.target.value);
    } else if (e.target.name.toLowerCase() === "state") {
      setState(e.target.value);
    } else if (e.target.name.toLowerCase() === "country") {
      setCountry(e.target.value);
    } else if (e.target.name.toLowerCase() === "pincode") {
      setPincode(e.target.value);
    } else if (e.target.name.toLowerCase() === "website") {
      setWebsite(e.target.value);
    } else if (e.target.name.toLowerCase() === "contact number") {
      setContact(e.target.value);
    } else if (e.target.name.toLowerCase() === "email") {
      setEmail(e.target.value);
    // } else if (e.target.name.toLowerCase() === "latitude") {
    //   setLatitude(e.target.value);
    // } else if (e.target.name.toLowerCase() === "longitude") {
    //   setLongitude(e.target.value);
    }
  }
  async function handelSubmit() {
    setLoading(true);
    if (
      !company ||
      !address ||
      !city ||
      !state ||
      !country ||
      !pincode ||
      !website ||
      !contact ||
      !email 
      // !longitude ||
      // !latitude
    ) {
      setLoading(false);
      return swal("Fill all the required filed!");
    }
    let data = {
      company,
      address,
      city,
      state,
      country,
      pincode,
      website,
      contact,
      email,
      // longitude,
      // latitude,
    };

    let res = await axios.post(`/api/config/address`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res) {
      setLoading(false);
      console.log(res);

      swal("Success!", res.data.message);
    } else {
      setLoading(false);
      swal("something went wrong!", res.data.message);
    }
  }

  return (
    <div>
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-lg-12">
                <div className="card">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-12 col-lg-6 col-xl-6">
                        <h1 className="text-left head-small">Address</h1>

                        <form>
                          <div className="row">
                            <div className="col-lg-12">
                              <div className="form-group">
                                <>
                                  <label
                                    htmlFor="basicpill-phoneno-input"
                                    className="label-100 mt-3"
                                  >
                                    Company Name
                                  </label>
                                  <input
                                    type="text"
                                    name="company name"
                                    value={company}
                                    onChange={(e) => handelChange(e)}
                                    className="form-control input-field "
                                    id="basicpill-phoneno-input"
                                  />
                                  <label
                                    htmlFor="basicpill-phoneno-input"
                                    className="label-100 mt-3"
                                  >
                                    Address
                                  </label>
                                  <input
                                    value={address}
                                    type="text"
                                    name="address"
                                    onChange={(e) => handelChange(e)}
                                    className="form-control input-field "
                                    id="basicpill-phoneno-input"
                                  />{" "}
                                  <label
                                    htmlFor="basicpill-phoneno-input"
                                    className="label-100 mt-3"
                                  >
                                    City
                                  </label>
                                  <input
                                    value={city}
                                    type="text"
                                    name="city"
                                    onChange={(e) => handelChange(e)}
                                    className="form-control input-field "
                                    id="basicpill-phoneno-input"
                                  />
                                  <label
                                    htmlFor="basicpill-phoneno-input"
                                    className="label-100 mt-3"
                                  >
                                    State
                                  </label>
                                  <input
                                    value={state}
                                    type="text"
                                    name="state"
                                    onChange={(e) => handelChange(e)}
                                    className="form-control input-field "
                                    id="basicpill-phoneno-input"
                                  />
                                  <label
                                    htmlFor="basicpill-phoneno-input"
                                    className="label-100 mt-3"
                                  >
                                    Country
                                  </label>
                                  <input
                                    value={country}
                                    type="text"
                                    name="country"
                                    onChange={(e) => handelChange(e)}
                                    className="form-control input-field "
                                    id="basicpill-phoneno-input"
                                  />
                                  <label
                                    htmlFor="basicpill-phoneno-input"
                                    className="label-100 mt-3"
                                  >
                                    Pin Code
                                  </label>
                                  <input
                                    value={pincode}
                                    type="text"
                                    name="pincode"
                                    onChange={(e) => handelChange(e)}
                                    className="form-control input-field "
                                    id="basicpill-phoneno-input"
                                  />
                                  <label
                                    htmlFor="basicpill-phoneno-input"
                                    className="label-100 mt-3"
                                  >
                                    Website
                                  </label>
                                  <input
                                    value={website}
                                    type="text"
                                    name="website"
                                    onChange={(e) => handelChange(e)}
                                    className="form-control input-field "
                                    id="basicpill-phoneno-input"
                                  />
                                  <label
                                    htmlFor="basicpill-phoneno-input"
                                    className="label-100 mt-3"
                                  >
                                    Contact Number
                                  </label>
                                  <input
                                    value={contact}
                                    type="text"
                                    name="contact number"
                                    onChange={(e) => handelChange(e)}
                                    className="form-control input-field "
                                    id="basicpill-phoneno-input"
                                  />{" "}
                                  <label
                                    htmlFor="basicpill-phoneno-input"
                                    className="label-100 mt-3"
                                  >
                                    Email
                                  </label>
                                  <input
                                    value={email}
                                    type="text"
                                    name="email"
                                    onChange={(e) => handelChange(e)}
                                    className="form-control input-field "
                                    id="basicpill-phoneno-input"
                                  />
                                  {/* <label
                                    htmlFor="basicpill-phoneno-input"
                                    className="label-100 mt-3"
                                  >
                                    Latitude
                                  </label>
                                  <input
                                    value={latitude}
                                    type="text"
                                    name="latitude"
                                    onChange={(e) => handelChange(e)}
                                    className="form-control input-field "
                                    id="basicpill-phoneno-input"
                                  />
                                  <label
                                    htmlFor="basicpill-phoneno-input"
                                    className="label-100 mt-3"
                                  >
                                    Longitude
                                  </label>
                                  <input
                                    value={longitude}
                                    type="text"
                                    name="longitude"
                                    onChange={(e) => handelChange(e)}
                                    className="form-control input-field "
                                    id="basicpill-phoneno-input"
                                  /> */}
                                </>
                              </div>
                            </div>
                          </div>
                          <div className="row mt-2">
                            <div className="col-lg-12">
                              <div className="form-group text-left">
                                <button
                                  type="button"
                                  onClick={handelSubmit}
                                  className="btn btn-success btn-login waves-effect waves-light mr-3 pt-2 pb-2 pr-4 pl-4"
                                >
                                  <ClipLoader loading={loading} size={18} />
                                  {!loading && "Save"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* <!-- end table-responsive --> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* <!-- container-fluid --> */}
        </div>
        {/* <!-- End Page-content --> */}
      </div>
    </div>
  );
}

export default Address;
