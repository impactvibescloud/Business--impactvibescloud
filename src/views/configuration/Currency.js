import React, { useState, useEffect } from "react";
import axios from "axios";
import { isAutheticated } from "src/auth";
import {
  Button,
  Box,
  IconButton,
  Modal,
  Pagination,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ClipLoader } from "react-spinners";
import swal from "sweetalert";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteSharpIcon from "@mui/icons-material/DeleteSharp";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  borderRadius: "0.5rem",
  boxShadow: 24,
  width: "500px",
};

const Currency = () => {
  const token = isAutheticated();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(true); // for loading state
  // const [isUpdate, setIsUpdate] = useState(false); // for edit state
  const [saveLoding, setSaveLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [CurrencyName, setCurrencyName] = useState("");
  const [CurrencySymbol, setCurrencySymbol] = useState("");
  const [error, setError] = useState("");
  const [CurrencyId, setCurrencyId] = useState("");
  const [Currency, setCurrency] = useState([]);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [olderCurrencyName, setOlderBaannerName] = useState("");
  const [olderImage, setOlderImage] = useState("");

  const [success, setSucess] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    // setUpdating(false);
    setEdit(false);

    setCurrencyName("");
    setCurrencyId("");
    setOlderImage("");
    setCurrencySymbol("");
  };

  const getCurrency = async () => {
    try {
      const response = await axios.get("/api/currency/getall", {
        // headers: {
        //   Authorization: `Bearer ${token}`,
        // },
      });

      if (response.status === 200) {
        setCurrency(response?.data?.currency);
        setLoading(false);
      }
    } catch (error) {
      swal({
        title: "",
        text: " please login to access the resource ",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
    }
  };

  useEffect(() => {
    getCurrency();
  }, [success]);
  // }, [token, Currency]);

  const handleEditClick = (_id, CurrencyName, CurrencySymbol) => {
    setOpen(true);
    setCurrencyName(CurrencyName);
    setCurrencyId(_id);
    setCurrencySymbol(CurrencySymbol);

    setEdit(true);
    // setUpdating(false);
  };

  const handleUpdate = () => {
    if (!CurrencyName || !CurrencySymbol) {
      swal({
        title: "Warning",
        text: "Please fill all the  required  fields!",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
      return;
    }
    setUpdating(false);
    const formData = new FormData();
    formData.append("CurrencyName", CurrencyName);
    formData.append("CurrencySymbol", CurrencySymbol);
    axios
      .patch(`/api/currency/${CurrencyId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        // setUpdating(true);
        // setIsUpdate(false);
        handleClose();
        setCurrencyId("");
        setCurrencyName("");
        setCurrencySymbol("");
        setUpdating(true);
        setEdit(false);
        swal({
          title: "Congratulations!!",
          text: "The Currency was updated successfully!",
          icon: "success",
          button: "OK",
        });
        // getCategories(); // Refresh the category list after updating
        setSucess((prev) => !prev);
      })
      .catch((err) => {
        swal({
          title: "Sorry, please try again",
          text: err,
          icon: "error",
          button: "Retry",
          dangerMode: true,
        });
        setUpdating(true);
        setSucess((prev) => !prev);
      });
  };

  // const handleDelete = (_id) => {
  //   swal({
  //     title: "Are you sure?",
  //     icon: "error",
  //     buttons: {
  //       Yes: { text: "Yes", value: true },
  //       Cancel: { text: "Cancel", value: "cancel" },
  //     },
  //   }).then((value) => {
  //     if (value === true) {
  //       axios
  //         .delete(`/api/currency/${_id}`, {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //         })
  //         .then((res) => {
  //           swal({
  //             title: "Congratulations!!",
  //             text: "The Currency is deleted successfully!",
  //             icon: "success",
  //             button: "OK",
  //           });
  //           setSucess((prev) => !prev);

  //           // getCategories(); // Refresh the category list after deleting
  //         })
  //         .catch((err) => {
  //           swal({
  //             title: "Error",
  //             text: "Something went wrong!",
  //             icon: "error",
  //             button: "Retry",
  //             dangerMode: true,
  //           });
  //         });
  //     }
  //   });
  // };

  const handleSaveCurrency = async () => {
    // const CurrencyExits = CurrencyNamesArray.includes(
    //   CurrencyName.toLowerCase()
    // );
    // if (CurrencyExits) {
    //   swal({
    //     title: "Warning",
    //     text: "Currency Already exits.",
    //     icon: "warning",
    //     button: "Retry",
    //     dangerMode: true,
    //   });
    //   return;
    // }
    if (!CurrencyName || !CurrencySymbol) {
      swal({
        title: "Warning",
        text: "Please fill all the  required  fields!",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
      return;
    }
    setSaveLoading(false);
    setLoading(true);
    const formData = new FormData();
    formData.append("CurrencyName", CurrencyName);
    formData.append("CurrencySymbol", CurrencySymbol);

    axios
      .post("/api/currency/new", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/formdata",
        },
      })
      .then((response) => {
        console.log(response);
        if (response.status === 201) {
          setOpen(false);
          setLoading(false);
          setSaveLoading(true);
          setCurrencyName("");
          setCurrencySymbol("");
          setOlderImage("");
          swal({
            title: "Added",
            text: "New Currency added successfully!",
            icon: "success",
            button: "OK",
          });
          setSucess((prev) => !prev);

          // getCategories(); // Refresh the category list after adding
        }
      })
      .catch((error) => {
        setSaveLoading(true);
        swal({
          title: "Error",
          text: error?.response?.data?.message
            ? error?.response?.data?.message
            : "something went wrong",
          icon: "error",
          button: "Retry",
          dangerMode: true,
        });
      });
  };
  const getPageCount = () => {
    return Math.max(1, Math.ceil(Currency.length / itemPerPage));
  };

  //   const handleFileChange = (e) => {
  //     const files = e.target.files[0];

  //     // Check file types and append to selectedFiles
  //     const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  //     if (allowedTypes.includes(files.type)) {
  //       setCurrencySymbol(files);
  //     }
  //   };
  //   const handeldeleteImage = () => {
  //     setCurrencySymbol("");
  //   };
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
                  Currency
                </div>

                <div className="page-title-right">
                  {/* <Button
                    variant="contained"
                    color="primary"
                    style={{
                      fontWeight: "bold",
                      marginBottom: "1rem",
                      textTransform: "capitalize",
                    }}
                    onClick={handleOpen}
                    // onClick={() => {
                    //   navigate("/testimonial/new", { replace: true });
                    // }}
                  >
                    + New Currency
                  </Button> */}
                  <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                  >
                    <Box sx={style}>
                      <Box p={2} display={"flex"}>
                        <Typography
                          id="modal-modal-title"
                          variant="body"
                          component="h2"
                          flex={1}
                        >
                          Currency
                        </Typography>
                        <IconButton onClick={() => handleClose()}>
                          <CloseIcon />
                        </IconButton>
                      </Box>
                      <hr />

                      <TextField
                        placeholder="Enter Currency Name ..."
                        value={CurrencyName}
                        fullWidth
                        inputProps={{
                          maxLength: 25,
                        }}
                        style={{
                          padding: "1rem",
                        }}
                        onChange={(e) =>
                          setCurrencyName(e.target.value.toUpperCase())
                        }
                      />
                      {/* {CurrencyName ? (
                        <>
                          <small className="charLeft  ml-3 fst-italic">
                            {25 - CurrencyName.length} characters left
                          </small>
                        </>
                      ) : (
                        <></>
                      )} */}

                      <TextField
                        placeholder="Currency Symbol"
                        value={CurrencySymbol}
                        fullWidth
                        inputProps={{
                          maxLength: 25,
                        }}
                        style={{
                          padding: "1rem",
                        }}
                        onChange={(e) => setCurrencySymbol(e.target.value)}
                      />
                      <Box
                        p={2}
                        display={"flex"}
                        justifyContent={"right"}
                        // width={"500px"}
                      >
                        {!edit && (
                          <button
                            style={{
                              color: "white",
                              marginRight: "1rem",
                            }}
                            onClick={() => handleSaveCurrency()}
                            type="button"
                            className="
                                      btn btn-primary btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mx-1
                                    mt-1
                                  "
                          >
                            <ClipLoader loading={!saveLoding} size={18} />
                            {saveLoding && "Save"}
                          </button>
                        )}
                        {edit && (
                          <button
                            style={{
                              color: "white",
                              marginRight: "1rem",
                            }}
                            onClick={() => handleUpdate()}
                            type="button"
                            className="
                                      btn btn-primary btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mx-1
                                    mt-1
                                  "
                          >
                            <ClipLoader loading={!updating} size={18} />
                            {updating && "update"}
                          </button>
                        )}
                        <button
                          style={{
                            color: "black",
                            marginRight: "1rem",
                            background: "grey",
                          }}
                          onClick={() => setOpen(false)}
                          type="button"
                          className="
                                      btn  btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mx-1
                                    mt-1
                                  "
                        >
                          Close
                        </button>
                      </Box>
                    </Box>
                  </Modal>
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
                            onChange={(e) => setItemPerPage(e.target.value)}
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
                          {/* <th> Image</th> */}

                          <th> Currency Name</th>
                          <th>Symbol</th>

                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!loading && Currency.length === 0 && (
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
                          Currency &&
                          Currency.slice(
                            (`${page}` - 1) * itemPerPage,
                            `${page}` * itemPerPage
                          ).map((item, i) => (
                            <tr key={i}>
                              {/* <td>
                                <img
                                  className="me-2"
                                  src={item?.CurrencyImage?.secure_url}
                                  width="40"
                                  alt=""
                                />
                                <h5>{} </h5>
                              </td> */}
                              <td>
                                <h5>{item?.CurrencyName} </h5>
                              </td>
                              <td>
                                <h5>{item?.CurrencySymbol}</h5>
                              </td>
                              <td className="text-start">
                                <button
                                  style={{
                                    color: "white",
                                    marginRight: "1rem",
                                  }}
                                  type="button"
                                  className="
                                      btn btn-primary btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mx-1
                                    mt-1
                                  "
                                  onClick={() =>
                                    handleEditClick(
                                      item._id,
                                      item.CurrencyName,

                                      item?.CurrencySymbol
                                    )
                                  }
                                >
                                  Edit
                                </button>
                                {/* <button
                                  style={{
                                    color: "white",
                                    marginRight: "1rem",
                                    background: "red",
                                  }}
                                  type="button"
                                  className="
                                      btn  btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mx-1
                                    mt-1
                                  "
                                  onClick={() => handleDelete(item._id)}
                                >
                                  Delete
                                </button> */}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: "flex", justifyContent: "right" }}>
                    <Pagination
                      style={{ margin: "2rem" }}
                      variant="outlined"
                      size="large"
                      count={getPageCount()}
                      color="primary"
                      onChange={(event, value) => setPage(value)}
                    />
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

export default Currency;
