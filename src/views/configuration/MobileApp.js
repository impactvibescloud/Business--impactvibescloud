import React, { useEffect, useState } from "react";
import swal from "sweetalert";
import ClipLoader from "react-spinners/ClipLoader";
import { Link } from "react-router-dom";
import axios from "axios";
import { isAutheticated } from "src/auth";

function MobileApp() {
  const [loading, setLoading] = useState(false);
  const [PDApp, setPDApp] = useState("");
  const [RDApp, setRDApp] = useState("");
  const [SCApp, setSCApp] = useState("");
  const [TMApp, setTMApp] = useState("");
  const [display, setDisplay] = useState(true);
  const token = isAutheticated();

  // urlcreated images

  const [PDAppUrl, setPDAppUrl] = useState("");
  const [RDAppUrl, setRDAppUrl] = useState("");
  const [SCAppUrl, setSCAppUrl] = useState("");
  const [TMAppUrl, setTMAppUrl] = useState("");

  useEffect(() => {
    async function getConfiguration() {
      const configDetails = await axios.get(`/api/config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log(configDetails.data.result[0]?.logo[0]);
      const data = configDetails.data.result[0]?.logo[0];
      setPDApp(data?.PDApp);
      setRDApp(data?.RDApp);
      setSCApp(data?.SCApp);
      setTMApp(data?.TMApp);
    }
    getConfiguration();
  }, []);

  async function handelSubmit() {
    setLoading(true);

    const formdata = new FormData();
    formdata.append("PDApp", PDApp);
    formdata.append("RDApp", RDApp);
    formdata.append("SCApp", SCApp);
    formdata.append("TMApp", TMApp);

    await axios
      .post(`/api/config/logo`, formdata, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/formdata",
          "Access-Control-Allow-Origin": "*",
        },
      })
      .then((res) => {
        setLoading(false);
        swal("Success!", res.data.message, res.data.status);
      })
      .catch((error) => {
        setLoading(false);
      });
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
                        <h1 className="text-left head-small">Mobile App</h1>

                        <form>
                          <div className="row">
                            <div className="col-lg-12">
                              <div className="form-group">
                                <>
                                  <label
                                    htmlFor="basicpill-phoneno-input"
                                    className="label-100 mt-3"
                                    style={{ fontWeight: "bold" }}
                                  >
                                    Header Logo for user Website(250 x 100
                                    pixels) <br />
                                  </label>
                                  <div>
                                    <input
                                      type="file"
                                      name="Logo  htmlFor Website Header(148 x 48 px)"
                                      onChange={(e) => {
                                        setPDApp(e.target.files[0]);
                                        if (
                                          e.target.files &&
                                          e.target.files[0]
                                        ) {
                                          setPDAppUrl({
                                            image: URL.createObjectURL(
                                              e.target.files[0]
                                            ),
                                          });
                                          console.log(setPDAppUrl);
                                        }
                                      }}
                                      className="form-control input-field mb-3 col-md-6 d-inline-block"
                                      id="basicpill-phoneno-input"
                                    />
                                    {display ? (
                                      <img
                                        className="ms-1"
                                        style={{ width: "100px" }}
                                        src={
                                          PDAppUrl.image
                                            ? PDAppUrl.image
                                            : PDApp
                                        }
                                        alt=""
                                      />
                                    ) : (
                                      ""
                                    )}
                                  </div>
                                  <label
                                    htmlFor="basicpill-phoneno-input"
                                    className="label-100 mt-3"
                                    style={{ fontWeight: "bold" }}
                                  >
                                    {/* Logo htmlFor Website Footer(148 x 48 px) */}
                                    Footer logo for user Website(250 x 100
                                    pixels) <br />
                                  </label>
                                  <br />
                                  <input
                                    type="file"
                                    name="Logo htmlFor Website Footer(148 x 48 px)"
                                    onChange={(e) => {
                                      setRDApp(e.target.files[0]);

                                      if (e.target.files && e.target.files[0]) {
                                        setRDAppUrl({
                                          image: URL.createObjectURL(
                                            e.target.files[0]
                                          ),
                                        });
                                      }
                                    }}
                                    className="form-control input-field mt-1 col-md-6 d-inline-block"
                                    id="basicpill-phoneno-input"
                                  />{" "}
                                  {display ? (
                                    <img
                                      style={{ width: "100px" }}
                                      src={
                                        RDAppUrl.image
                                          ? RDAppUrl.image
                                          : RDApp
                                      }
                                      alt=""
                                    />
                                  ) : (
                                    ""
                                  )}
                                  <label
                                    htmlFor="basicpill-phoneno-input"
                                    className="label-100 mt-2 row ms-1"
                                    style={{ fontWeight: "bold" }}
                                  >
                                    {/* Logo htmlFor Admin Header(148 x 48 px) */}
                                    Logo for admin website(250 x 100 pixels){" "}
                                    <br />
                                  </label>
                                  <input
                                    type="file"
                                    name="Logo htmlFor Admin Header(148 x 48 px)"
                                    onChange={(e) => {
                                      setSCApp(e.target.files[0]);

                                      if (e.target.files && e.target.files[0]) {
                                        setSCAppUrl({
                                          image: URL.createObjectURL(
                                            e.target.files[0]
                                          ),
                                        });
                                      }
                                    }}
                                    className="form-control input-field col-md-6 d-inline-block"
                                    id="basicpill-phoneno-input"
                                  />{" "}
                                  {display ? (
                                    <img
                                      style={{ width: "100px" }}
                                      src={
                                        SCAppUrl.image
                                          ? SCAppUrl.image
                                          : SCApp
                                      }
                                      alt=""
                                    />
                                  ) : (
                                    ""
                                  )}
                                </>
                              </div>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-lg-12">
                              <div className="form-group text-left">
                                <button
                                  type="button"
                                  disabled={
                                    SCApp === "" ||
                                    RDApp === "" ||
                                    PDApp === ""
                                  }
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

export default MobileApp;
