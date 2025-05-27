import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { toast } from "react-hot-toast";
import debounce from "lodash.debounce";
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

const Brands = () => {
  const token = isAutheticated();
  const nameRef = useRef();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(true);
  const [saveLoading, setSaveLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [brandId, setBrandId] = useState("");
  const [brands, setBrands] = useState([]);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [olderBrandName, setOlderBrandName] = useState("");

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setEdit(false);
    setBrandName("");
    setBrandId("");
  };

  const getBrands = async () => {
    try {
      setLoading(true); // Set loading to true before fetching
      const response = await axios.get("/api/brand/getBrands", {
        params: {
          // page,
          // show: itemPerPage,
          brandName: nameRef.current?.value || "",
        }, // Include pagination and search
      });
      if (response.status === 200) {
        setBrands(response.data.brands);
      }
    } catch (error) {
      console.error("Failed to fetch brands:", error);
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  };

  useEffect(() => {
    getBrands();
  }, []); 

  const handleEditClick = (_id, brandName) => {
    setOpen(true);
    setBrandName(brandName);
    setBrandId(_id);
    setOlderBrandName(brandName);
    setEdit(true);
  };

  const handleUpdate = async () => {
    const filteredBrandNames = brands
      .filter(
        (brand) =>
          brand.brandName.toLowerCase() !== olderBrandName.toLowerCase()
      )
      .map((brand) => brand.brandName.toLowerCase());

    if (filteredBrandNames.includes(brandName.toLowerCase())) {
      swal("Warning", "Brand already exists", "error");
      return;
    }

    if (!brandName) {
      swal("Warning", "Please fill all the required fields!", "error");
      return;
    }

    setUpdating(false);
    const formData = new FormData();
    formData.append("brandName", brandName);

    try {
      await axios.patch(`/api/brand/update/${brandId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleClose();
      toast.success("Brand updated successfully");
      getBrands();
    } catch (err) {
      swal("Error", "Failed to update brand", "error");
    } finally {
      setUpdating(true);
    }
  };

  const handleDelete = (_id) => {
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
          await axios.delete(`/api/brand/delete/${_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Brand deleted successfully");
          getBrands();
        } catch (err) {
          swal("Error", "Failed to delete brand", "error");
        }
      }
    });
  };

  const handleSaveBrand = async () => {
    if (
      brands.some(
        (brand) => brand.brandName.toLowerCase() === brandName.toLowerCase()
      )
    ) {
      swal("Warning", "Brand already exists.", "error");
      return;
    }

    if (!brandName) {
      swal("Warning", "Please fill all the required fields!", "error");
      return;
    }

    setSaveLoading(false);
    const formData = new FormData();
    formData.append("brandName", brandName);

    try {
      await axios.post("/api/brand/add", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      handleClose();
      swal("Success", "New brand added successfully!", "success");
      getBrands();
    } catch (error) {
      swal("Error", "Failed to add brand", "error");
    } finally {
      setSaveLoading(true);
    }
  };

  const getPageCount = () => Math.max(1, Math.ceil(brands?.length / itemPerPage));
  const debouncedSearch = useCallback(
    debounce(() => {
      setPage(1);
      getBrands();
    }, 500),
    []
  );

  const handleSearchChange = () => {
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
                  Brands
                </div>

                <div className="page-title-right">
                  <Button
                    variant="contained"
                    color="primary"
                    style={{
                      fontWeight: "bold",
                      marginBottom: "1rem",
                      textTransform: "capitalize",
                    }}
                    onClick={handleOpen}
                  >
                    Add New brand
                  </Button>
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
                          Brand Name
                        </Typography>
                        <IconButton onClick={() => handleClose()}>
                          <CloseIcon />
                        </IconButton>
                      </Box>
                      <hr />
                      <TextField
                        placeholder="brand name"
                        value={brandName}
                        fullWidth
                        inputProps={{
                          maxLength: 25,
                        }}
                        style={{
                          padding: "1rem",
                        }}
                        onChange={(e) =>
                          setBrandName(
                            e.target.value.charAt(0).toUpperCase() +
                              e.target.value.slice(1)
                          )
                        }
                      />
                      {brandName ? (
                        <>
                          <small className="charLeft mt-2 ml-3 fst-italic">
                            {25 - brandName.length} characters left
                          </small>
                        </>
                      ) : (
                        <></>
                      )}

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
                            onClick={() => handleSaveBrand()}
                            type="button"
                            className="
                                      btn btn-primary btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mx-1
                                    mt-1
                                  "
                          >
                            <ClipLoader loading={!saveLoading} size={18} />
                            {saveLoading && "Save"}
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
                    <div className="col-lg-1">
                      <div className="dataTables_length">
                        <label className="w-100">
                          Show
                          <select
                            onChange={(e) => {
                              setItemPerPage(e.target.value);
                              setPage(1);
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
                      <label>Brand Name:</label>
                      <input
                        type="text"
                        placeholder="Brand name"
                        className="form-control"
                        ref={nameRef}
                        onChange={handleSearchChange}
                        disabled={loading}
                      />
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
                          <th> Brand Name</th>

                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!loading && brands.length === 0 && (
                          <tr className="text-center">
                            <td colSpan="2">
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
                          brands &&
                          brands
                          .slice(
                            (`${page}` - 1) * itemPerPage,
                            `${page}` * itemPerPage
                          )
                          .map((item, i) => (
                            <tr key={i}>
                              <td>
                                <h5>{item.brandName} </h5>
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
                                    handleEditClick(item._id, item.brandName)
                                  }
                                >
                                  Edit
                                </button>
                                <button
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
                                </button>
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

export default Brands;
