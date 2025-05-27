import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { isAutheticated } from "src/auth";
import swal from "sweetalert";
import debounce from "lodash.debounce";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

const ViewRetailDistributorPD = () => {
  const token = isAutheticated();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(true);
  const [retaildistributorData, setretaildistributorData] = useState([]);
  const [data, setData] = useState({});
  const nameRef = useRef();
  const mobileRef = useRef();
  const rdnameRef = useRef();
  const rdmobileRef = useRef();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [modalcurrentPage, setmodalCurrentPage] = useState(1);
  const modalitemPerPage = 10;
  const [totalData, setTotalData] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [modalRetailDistributors, setmodalRetailDistributors] = useState([]);
  const [modalTotalData, setmodalTotalData] = useState(0);

  // Fetch territory manager data
  useEffect(() => {
    axios
      .get(`/api/v1/admin/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setData(response.data.user))
      .catch((error) => console.error("Error fetching sc data:", error));
  }, [id, token]);

  // Fetch Retail Distributors data
  const getPDsretaildistributorData = async () => {
    setLoading(true);
    axios
      .get(`/api/getAllRDbypdid/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
          show: itemPerPage,
          tradename: nameRef.current?.value,
          mobile_number: mobileRef.current?.value,
        },
      })
      .then((res) => {
        // console.log(res.data);
        setretaildistributorData(res.data?.Retaildistributor);
        setTotalData(res.data?.total_data);
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || "Something went wrong!";
        swal({
          title: "Error",
          text: msg,
          icon: "error",
          button: "Retry",
          dangerMode: true,
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getPDsretaildistributorData();
  }, [success, itemPerPage, currentPage]);

  // Debounced search for Retail Distributors
  const debouncedSearch = useCallback(
    debounce(() => {
      setCurrentPage(1);
      getPDsretaildistributorData();
    }, 500),
    [currentPage, itemPerPage]
  );

  const handleSearchChange = useCallback(() => {
    debouncedSearch();
  }, [debouncedSearch]);
  // Fetch Retail Distributors data for modal
  const getretaildistributorData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/getAllRD`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: modalcurrentPage,
          show: modalitemPerPage,
          tradename: rdnameRef.current?.value,
          mobile_number: rdmobileRef.current?.value,
        },
      });
      setmodalRetailDistributors(res.data?.Retaildistributor);
      setmodalTotalData(res.data?.total_data);
    } catch (err) {
      const msg = err?.response?.data?.message || "Something went wrong!";
      swal({
        title: "Error",
        text: msg,
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (openModal) {
      getretaildistributorData();
    }
  }, [openModal, modalcurrentPage]);

  // Debounced search for Retail Distributors in modal
  const debouncedmodalSearch = useCallback(
    debounce(() => {
      setmodalCurrentPage(1);
      getretaildistributorData();
    }, 500),
    [modalcurrentPage]
  );

  const handlemodalSearchChange = useCallback(() => {
    debouncedmodalSearch();
  }, [debouncedmodalSearch]);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };
  const handlePreviousPage = () => {
    if (modalcurrentPage > 1) {
      setmodalCurrentPage(modalcurrentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (modalRetailDistributors.length === modalitemPerPage) {
      setmodalCurrentPage(modalcurrentPage + 1);
    }
  };

  const handleDelete = (id) => {
    swal({
      title: "Are you sure?",
      icon: "warning",
      buttons: {
        Yes: { text: "Yes", value: true },
        Cancel: { text: "Cancel", value: "cancel" },
      },
    }).then((value) => {
      if (value === true) {
        axios
          .patch(
            `/api/unmap/${id}`,
            { principal_distributor: true },
            {
              // Changed to PATCH and sent an empty body
              headers: {
                "Access-Control-Allow-Origin": "*",
                Authorization: `Bearer ${token}`,
              },
            }
          )
          .then((res) => {
            swal({
              title: "Deleted",
              text: "Retail Distributor Unmapped successfully!",
              icon: "success",
              button: "ok",
            });
            setSuccess((prev) => !prev);
          })
          .catch((err) => {
            let msg = err?.response?.data?.message
              ? err?.response?.data?.message
              : "Something went wrong!";
            swal({
              title: "Warning",
              text: msg,
              icon: "error",
              button: "Retry",
              dangerMode: true,
            });
          });
      }
    });
  };
  const handleAddRetailDistributor = async (rdid) => {
    try {
      await axios.put(
        `/api/mapped/${rdid}`,
        { principal_distributor: id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      swal({
        title: "Success",
        text: "Retail Distributor added successfully!",
        icon: "success",
        button: "Ok",
      });
      setSuccess((prev) => !prev);
      handleCloseModal(); // Close modal after adding
    } catch (err) {
      const msg = err?.response?.data?.message || "Something went wrong!";
      swal({
        title: "Error",
        text: msg,
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
    }
  };

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-flex mb-1 align-items-center justify-content-between">
                {/* Left Side with Information in Separate Columns */}
                <div className="d-flex flex-column">
                  <div style={{ fontSize: "18px" }} className="fw-bold">
                    Unique ID: {data?.uniqueId}
                  </div>
                  <div style={{ fontSize: "18px" }} className="fw-bold">
                    Name: {data?.name}
                  </div>
                  <div style={{ fontSize: "18px" }} className="fw-bold">
                    Mobile Number: {data?.mobileNumber}
                  </div>
                  <div style={{ fontSize: "18px" }} className="fw-bold">
                    Mail: {data?.email}
                  </div>
                </div>

                {/* Right Side with the Button */}
                <div className="page-title-right">
                  <Button
                    variant="contained"
                    color="primary"
                    style={{
                      fontWeight: "bold",
                      marginBottom: "1rem",
                      textTransform: "capitalize",
                    }}
                    onClick={handleOpenModal}
                  >
                    Add Retail Distributor
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    style={{
                      fontWeight: "bold",
                      marginBottom: "1rem",
                      marginLeft: "1rem",
                      textTransform: "capitalize",
                      backgroundColor: "#d32f2f", // Red color for danger
                      color: "#fff",
                      "&:hover": {
                        backgroundColor: "#b71c1c", // Darker red on hover
                      },
                    }}
                    onClick={() => navigate("/principal-distributor")}
                  >
                    Back
                  </Button>
                </div>
              </div>
              <Dialog
                open={openModal}
                onClose={handleCloseModal}
                maxWidth="md"
                fullWidth
              >
                <DialogTitle>Search and Add Retail Distributor</DialogTitle>
                <DialogContent>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      marginBottom: "2rem",
                      marginTop: "-1rem",
                    }}
                  >
                    <TextField
                      label="Retail Distributor Trade Name"
                      placeholder="Retail Distributor Trade name"
                      inputRef={rdnameRef}
                      onChange={handlemodalSearchChange}
                      disabled={loading}
                      style={{ flex: 1, marginRight: "16px" }}
                    />
                    <TextField
                      style={{ flex: 1 }}
                      label="Mobile Number"
                      placeholder="Mobile Number"
                      inputRef={rdmobileRef}
                      onChange={handlemodalSearchChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="table-responsive table-shoot mt-3">
                    <table className="table table-centered table-nowrap">
                      <thead>
                        <tr>
                          <th>Trade Name</th>
                          <th>Mobile</th>
                          <th>Email</th>
                          <th>SC</th>
                          <th>TM</th>
                          <th>PD</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalRetailDistributors.length > 0 ? (
                          modalRetailDistributors.map((RD) => (
                            <tr key={RD._id}>
                              <td>{RD.kycDetails.trade_name}</td>
                              <td>{RD.mobile_number}</td>
                              <td>{RD.email}</td>
                              <td>{RD.mappedSCDetails?.name || "N/A"}</td>
                              <td>{RD.mappedTMDetails?.name || "N/A"}</td>
                              <td>{RD.principalDetails?.name || "N/A"}</td>
                              <td>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={() =>
                                    handleAddRetailDistributor(RD._id)
                                  }
                                >
                                  Add
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">
                              No Retail Distributor found!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-flex justify-content-between">
                    <div>
                      Showing {modalRetailDistributors?.length} of{" "}
                      {modalTotalData} entries
                    </div>
                    <div>
                      <button
                        onClick={handlePreviousPage}
                        disabled={modalcurrentPage === 1 || loading}
                        className="btn btn-primary"
                      >
                        Previous
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={
                          modalRetailDistributors?.length < modalitemPerPage ||
                          loading
                        }
                        className="btn btn-primary ml-2"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseModal} color="secondary">
                    Cancel
                  </Button>
                </DialogActions>
              </Dialog>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-12">
              <div className="card">
                <div className="card-body">
                  <div className="row ml-0 mr-0 mb-10">
                    <div className="col-lg-1">
                      <div className="dataTables_length">
                        <label className="w-100">
                          Show
                          <select
                            onChange={(e) => {
                              setItemPerPage(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="form-control"
                            disabled={loading}
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
                    <div className="col-lg-3">
                      <label>Trade Name:</label>
                      <input
                        type="text"
                        placeholder="Retail Distributor Trade name"
                        className="form-control"
                        ref={nameRef}
                        onChange={handleSearchChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="col-lg-3">
                      <label>Mobile Number:</label>
                      <input
                        type="text"
                        placeholder="Mobile Number"
                        className="form-control"
                        ref={mobileRef}
                        onChange={handleSearchChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="table-responsive table-shoot mt-3">
                    <table className="table table-centered table-nowrap">
                      <thead
                        className="thead-light"
                        style={{ background: "#ecdddd" }}
                      >
                        <tr>
                          <th className="text-start">UniqueID</th>
                          <th className="text-start">Trade Name</th>
                          <th className="text-start">Mobile</th>
                          <th className="text-start">Email</th>
                          <th className="text-start">Created On</th>
                          <th className="text-start">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr>
                            <td className="text-center" colSpan="6">
                              Loading...
                            </td>
                          </tr>
                        ) : retaildistributorData?.length > 0 ? (
                          retaildistributorData?.map((RD, i) => {
                            return (
                              <tr key={i}>
                                <td className="text-start">{RD?.uniqueId}</td>
                                <td className="text-start">
                                  {RD?.kycDetails?.trade_name}
                                </td>
                                <td className="text-start">
                                  {RD?.mobile_number ? (
                                    RD?.mobile_number
                                  ) : (
                                    <small className="m-0 text-secondary">
                                      No Phone Added!
                                    </small>
                                  )}
                                </td>

                                <td className="text-start">{RD?.email}</td>
                                <td className="text-start">
                                  {" "}
                                  {new Date(RD.createdAt).toLocaleString(
                                    "en-IN",
                                    {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "numeric",
                                      minute: "numeric",
                                      hour12: true,
                                    }
                                  )}
                                </td>
                                <td className="text-start">
                                  <button
                                    type="button"
                                    style={{ color: "white" }}
                                    className="btn btn-danger btn-sm  waves-effect waves-light btn-table ml-2"
                                    onClick={() => handleDelete(RD._id)}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td className="text-center" colSpan="6">
                              No Retail Distributor found!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-flex justify-content-between">
                    <div>
                      Showing {retaildistributorData?.length} of {totalData}{" "}
                      entries
                    </div>
                    <div>
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="btn btn-primary"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={
                          retaildistributorData?.length < itemPerPage || loading
                        }
                        className="btn btn-primary ml-2"
                      >
                        Next
                      </button>
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

export default ViewRetailDistributorPD;
