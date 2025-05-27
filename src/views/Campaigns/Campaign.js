import React, { useEffect } from "react";
import Button from "@mui/material/Button";
import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import swal from "sweetalert";
import { isAutheticated } from "src/auth.js";

const Campaign = () => {
  const token = isAutheticated();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(true);
  const [campaignData, setCampaignData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [showData, setShowData] = useState(campaignData);

  const handleShowEntries = (e) => {
    setCurrentPage(1);
    setItemPerPage(e.target.value);
  };

  const getCampaign = () => {
    axios
      .get(`/api/campaign/getAll`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setCampaignData(res.data?.campaigns);
        // console.log(res.data?.campaigns);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    getCampaign();
  }, [success]);

  useEffect(() => {
    const loadData = () => {
      const indexOfLastPost = currentPage * itemPerPage;
      const indexOfFirstPost = indexOfLastPost - itemPerPage;
      setShowData(campaignData.slice(indexOfFirstPost, indexOfLastPost));
    };
    loadData();
  }, [currentPage, itemPerPage, campaignData]);

  // const handleVarification = (id) => {
  //     swal({
  //         title: 'Are you sure?',
  //         icon: 'warning',
  //         buttons: { Yes: { text: 'Yes', value: true }, Cancel: { text: 'Cancel', value: 'cancel' } },
  //     }).then((value) => {
  //         if (value === true) {
  //             axios
  //                 .get(`/api/i/admin/verify/${id}`, {
  //                     headers: {
  //                         'Access-Control-Allow-Origin': '*',
  //                         Authorization: `Bearer ${token}`,
  //                     },
  //                 })
  //                 .then((res) => {
  //                     swal({
  //                         title: 'success',
  //                         text: res.data.message ? res.data.message : 'Verified Successfully!',
  //                         icon: 'success',
  //                         button: 'ok',
  //                         dangerMode: true,
  //                     })
  //                     setSuccess((prev) => !prev)
  //                 })
  //                 .catch((err) => {
  //                     swal({
  //                         title: 'Failled',
  //                         text: 'Something went wrong!',
  //                         icon: 'error',
  //                         button: 'Retry',
  //                         dangerMode: true,
  //                     })
  //                 })
  //         }
  //     })
  // }
  const handleDelete = (id) => {
    // swal({
    //   title: "Are you sure?",
    //   icon: "error",
    //   buttons: {
    //     Yes: { text: "Yes", value: true },
    //     Cancel: { text: "Cancel", value: "cancel" },
    //   },
    // }).then((value) => {
    //   if (value === true) {
    //     axios
    //       .delete(`/api/businesses/delete/${id}`, {
    //         headers: {
    //           "Access-Control-Allow-Origin": "*",
    //           Authorization: `Bearer ${token}`,
    //         },
    //       })
    //       .then((res) => {
    //         setSuccess((prev) => !prev);
    //       })
    //       .catch((err) => {
    //         swal({
    //           title: "Warning",
    //           text: "Something went wrong!",
    //           icon: "error",
    //           button: "Retry",
    //           dangerMode: true,
    //         });
    //       });
    //   }
    // });
  };

  const formatDate = (inputDate) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    const date = new Date(inputDate);
    return date.toLocaleDateString("en-US", options);
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
                  Campaigns
                </div>

                <div className="page-title-right">
                  <Link to="/campaign/add">
                    <Button
                      variant="contained"
                      color="primary"
                      style={{
                        fontWeight: "bold",
                        marginBottom: "1rem",
                        textTransform: "capitalize",
                      }}
                    >
                      Add new campaign
                    </Button>
                  </Link>
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
                        className="thead-info"
                        style={{ background: "rgb(140, 213, 213)" }}
                      >
                        <tr>
                          <th className="text-start">Campaign Name </th>
                          {/* <th className="text-start">Logo</th> */}
                          <th className="text-start">Campaign Type</th>
                          <th className="text-start">Recipients</th>
                          {/* <th className="text-start">Status</th> */}
                          <th className="text-center">Action</th>
                          <th className="text-center">Launch Date</th>
                          <th className="text-center">Status</th>
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
                          showData.map((i, idx) => {
                            return (
                              <tr key={idx}>
                                <td className="text-start">{i.campaignName}</td>
                                {/* {i.banner && i.banner ?
                                                                    <td className="text-start">
                                                                        <img src={i.banner.url} alt="No Image" height="50" />
                                                                    </td> :
                                                                    <p>No image!</p>
                                                                } */}

                                <td className="text-start">{i.campaignType}</td>

                                <td className="text-start">
                                  {formatDate(i.createdAt)}
                                </td>
                                {/* <td className="text-start">
                                                                    <button
                                                                        style={{ color: 'white' }}
                                                                        type="button"
                                                                        className={`
                                                                        
                                    btn ${i?.verify === true ? 'btn-success' : 'btn-danger'} btn-sm
                                    waves-effect waves-light
                                    ms-2
                                    
                                  `}
                                                                        disabled={i?.verify === true}
                                                                        onClick={() => {
                                                                            handleVarification(i._id)
                                                                        }}
                                                                    >
                                                                        {i?.verify ? 'verified' : 'Not Verify'}
                                                                    </button>
                                                                </td> */}
                                <td className=" text-center">
                                  {/* <OverLayButton data={{ url: i?.url }} /> */}

                                  <Link to={`/users/view/${i._id}`}>
                                    <button
                                      style={{ color: "white" }}
                                      type="button"
                                      className="
                                                                                 btn btn-primary btn-sm
                                                                              waves-effect waves-light
                                    ms-2
                                  "
                                    >
                                      View
                                    </button>
                                  </Link>

                                  <Link to={`/campaigns/edit/${i._id}`}>
                                    <button
                                      style={{ color: "white" }}
                                      type="button"
                                      className="
                                      btn btn-success btn-sm
                                    waves-effect waves-light
                                    ms-2
                                  "
                                    >
                                      Edit
                                    </button>
                                  </Link>
                                  <button
                                    style={{ color: "white" }}
                                    type="button"
                                    className="
                                    btn btn-danger btn-sm
                                    waves-effect waves-light
                                    ms-2
                                    
                                  "
                                    onClick={() => {
                                      handleDelete(i._id);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </td>
                                <td className="text-center">0</td>
                                <td className="text-center">active</td>
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
                          campaignData.length
                        )}{" "}
                        of {campaignData.length} entries
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
                            campaignData.length - 1
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
                                campaignData.length - 1
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
};

export default Campaign;
