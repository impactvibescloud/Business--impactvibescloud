import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { isAutheticated } from "src/auth";
import {
  Button,
  Box,
  IconButton,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ClipLoader } from "react-spinners";
import swal from "sweetalert";
import { useNavigate } from "react-router-dom";
import debounce from "lodash/debounce";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  borderRadius: "0.5rem",
  boxShadow: 24,
};

const ProductManual = () => {
  const token = isAutheticated();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(true);
  const [saveLoding, setSaveLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [currentManual, setCurrentManual] = useState(null);
  const [productManuals, setProductManuals] = useState([]);
  const [fileError, setFileError] = useState("");
  const [totalData, setTotalData] = useState(0);
  const [success, setSuccess] = useState(true);
  const titleRef = useRef();
  // const handleOpen = (manual = null) => {
  //   setOpen(true);
  //   setCurrentManual(manual);
  //   if (manual) {
  //     setTitle(manual.title);
  //     setPdfFile(null);
  //     setEdit(true);
  //   } else {
  //     setTitle("");
  //     setPdfFile(null);
  //     setEdit(false);
  //   }
  // };
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setEdit(false);
    setTitle("");
    setPdfFile(null);
    setFileError("");
  };
  const handleEditClick = (manual) => {
    setOpen(true);
    setCurrentManual(manual);
    setTitle(manual.title);
    setPdfFile(null);
    setEdit(true);
  };
  const getProductManuals = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/productmanual`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          show: itemPerPage,
          title: titleRef.current?.value || "",
        },
      });
      if (response.status === 200) {
        const { productManuals, total } = response.data;
        setProductManuals(productManuals);
        setTotalData(total);
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch product manuals:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getProductManuals();
  }, [itemPerPage, currentPage, success]);

  const validateFile = (file) => {
    return file && file.type === "application/pdf";
  };

  const handleSave = async () => {
    if (!title || !pdfFile || !validateFile(pdfFile)) {
      setFileError("Please upload a valid PDF file!");
      return;
    }
    setFileError("");

    setSaveLoading(false);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("pdfFile", pdfFile);

    try {
      await axios.post("/api/productmanual/create", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      handleClose();
      swal("Success", "New product manual added successfully!", "success");
      getProductManuals();
    } catch (error) {
      swal("Error", "Failed to add product manual", "error");
    } finally {
      setSaveLoading(true);
    }
  };

  const handleUpdate = async () => {
    if (!title) {
      setFileError("Please upload a valid PDF file!");
      return;
    }
    setFileError("");

    setUpdating(false);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("pdfFile", pdfFile);

    try {
      await axios.put(
        `/api/productmanual/update/${currentManual._id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      handleClose();
      setSuccess((prev) => !prev);
      swal(
        "Success",
        "The product manual was updated successfully!",
        "success"
      );
      getProductManuals();
    } catch (err) {
      swal("Error", "Failed to update product manual", "error");
    } finally {
      setUpdating(true);
    }
  };

  const handleDelete = async (_id) => {
    swal({
      title: "Are you sure?",
      icon: "warning",
      buttons: {
        Yes: { text: "Yes", value: true },
        Cancel: { text: "Cancel", value: "cancel" },
      },
    }).then(async (value) => {
      if (value === true) {
        try {
          await axios.delete(`/api/productmanual/delete/${_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSuccess((prev) => !prev);
          swal(
            "Success",
            "The product manual was deleted successfully!",
            "success"
          );
          getProductManuals();
        } catch (err) {
          swal("Error", "Failed to delete product manual", "error");
        }
      }
    });
  };

  const debouncedSearch = useCallback(
    debounce(() => {
      setCurrentPage(1);
      getProductManuals();
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch();
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
                  Product Manual
                </div>
                <div className="page-title-right">
                  <Button
                    variant="contained"
                    color="primary"
                    className="font-bold mb-2 capitalize mr-2"
                    onClick={() => handleOpen()}
                  >
                    Add New Product Manual
                  </Button>
                </div>
              </div>
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
                      <label>Title:</label>
                      <input
                        type="text"
                        placeholder="product name"
                        className="form-control"
                        ref={titleRef}
                        onChange={handleSearchChange}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  {/* Modal for Add/Edit Product Manual */}
                  <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                  >
                    <Box sx={style}>
                      <Box
                        p={2}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography
                          id="modal-modal-title"
                          variant="h6"
                          component="h2"
                          flex={1}
                          fontWeight="bold"
                          textAlign="center"
                        >
                          {edit
                            ? "Edit Product Manual"
                            : "Add New Product Manual"}
                        </Typography>
                        <IconButton onClick={handleClose} color="error">
                          <CloseIcon />
                        </IconButton>
                      </Box>
                      <Box p={2}>
                        <TextField
                          required
                          id="title"
                          label="Title"
                          variant="outlined"
                          margin="normal"
                          fullWidth
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                        <input
                          accept="application/pdf"
                          style={{ display: "none" }}
                          id="pdfFile"
                          type="file"
                          onChange={(e) => setPdfFile(e.target.files[0])}
                        />
                        <label htmlFor="pdfFile">
                          <Button
                            variant="contained"
                            component="span"
                            className="font-bold mb-2 capitalize"
                            color="primary"
                          >
                            Upload PDF
                          </Button>
                          {pdfFile && (
                            <span style={{ marginLeft: "10px" }}>
                              {pdfFile.name}
                            </span>
                          )}
                          {fileError && (
                            <Typography color="error" variant="body2">
                              {fileError}
                            </Typography>
                          )}
                        </label>
                      </Box>
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
                            onClick={() => handleSave()}
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
                  <div className="table-responsive table-shoot mt-3">
                    <table
                      className="table table-centered table-nowrap"
                      style={{ border: "1px solid" }}
                    >
                      <thead
                        className="thead-light"
                        style={{ background: "#ecdddd" }}
                      >
                        <tr>
                          <th className="text-start">Title</th>
                          <th className="text-start">File Name</th>
                          <th className="text-start">Updated Date</th>
                          <th className="text-start">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr>
                            <td className="text-center" colSpan="6">
                              Loading...
                            </td>
                          </tr>
                        ) : productManuals?.length > 0 ? (
                          productManuals?.map((manual, i) => {
                            return (
                              <tr key={i}>
                                <td className="text-start">{manual.title}</td>
                                <td className="text-start">
                                  {manual.product_manual.filename}
                                </td>
                                <td className="text-start">
                                  {new Date(manual.updatedAt).toLocaleString(
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
                                  <Link
                                    to={`/product-manual/view/${manual._id}`}
                                  >
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
                                    >
                                      View
                                    </button>
                                  </Link>

                                  <button
                                    style={{
                                      color: "white",
                                      marginRight: "1rem",
                                    }}
                                    type="button"
                                    className="
                                    btn btn-info btn-sm
                                  waves-effect waves-light
                                  btn-table
                                  mt-1
                                  mx-1
                                "
                                    onClick={() => handleEditClick(manual)}
                                  >
                                    Edit
                                  </button>

                                  <Link
                                    to={"#"}
                                    style={{
                                      marginRight: "1rem",
                                    }}
                                  >
                                    <button
                                      style={{ color: "white" }}
                                      type="button"
                                      className="
                                  btn btn-danger btn-sm
                                  waves-effect waves-light
                                  btn-table
                                  mt-1
                                  mx-1
                                  
                                "
                                      onClick={() => {
                                        handleDelete(manual._id);
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          !loading &&
                          productManuals?.length === 0 && (
                            <tr className="text-center">
                              <td colSpan="6">
                                <h5>No Product manual Available...</h5>
                              </td>
                            </tr>
                          )
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
                        {Math.min(currentPage * itemPerPage, totalData)} of{" "}
                        {totalData} entries
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
                              disabled={loading}
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
                                disabled={loading}
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
                            totalData - 1
                          ) && (
                            <li className="paginate_button page-item ">
                              <span
                                className="page-link"
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                  setCurrentPage((prev) => prev + 1);
                                }}
                                disabled={loading}
                              >
                                {currentPage + 1}
                              </span>
                            </li>
                          )}

                          <li
                            className={
                              !(
                                (currentPage + 1) * itemPerPage - itemPerPage >
                                totalData - 1
                              )
                                ? "paginate_button page-item next"
                                : "paginate_button page-item next disabled"
                            }
                          >
                            <span
                              className="page-link"
                              style={{ cursor: "pointer" }}
                              onClick={() => setCurrentPage((prev) => prev + 1)}
                              disabled={loading}
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

export default ProductManual;
