import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
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

const Equipment = () => {
  const nameRef = useRef();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(true);
  const [saveLoading, setSaveLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [equipmentName, setEquipmentName] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [equipment, setEquipment] = useState([]);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [olderEquipmentName, setOlderEquipmentName] = useState("");

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setEdit(false);
    setEquipmentName("");
    setEquipmentId("");
  };

  const getEquipment = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/equipment/", {
        params: {
          equipmentName: nameRef.current?.value || "",
        },
      });

      if (response.status === 200) {
        setEquipment(response?.data?.data);
      }
    } catch (error) {
      console.error("Failed to fetch equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getEquipment();
  }, []);

  const handleEditClick = (_id, equipmentName) => {
    setOpen(true);
    setEquipmentName(equipmentName);
    setEquipmentId(_id);
    setOlderEquipmentName(equipmentName);
    setEdit(true);
  };

  const handleUpdate = async () => {
    if (!equipmentName) {
      swal({
        title: "Warning",
        text: "Please fill all the required fields!",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
      return;
    }
    setUpdating(false);
    const formData = new FormData();
    formData.append("name", equipmentName);
    try {
      await axios.put (`/api/equipment/${equipmentId}`, formData);
      handleClose();
      toast.success("Equipment updated successfully");
      getEquipment();
    } catch (err) {
      swal({
        title: "",
        text: "Something went wrong!",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
    } finally {
      setUpdating(true);
    }
  };

  const handleDelete = (_id) => {
    swal({
      title: "Are you sure?",
      icon: "error",
      buttons: {
        Yes: { text: "Yes", value: true },
        Cancel: { text: "Cancel", value: "cancel" },
      },
    }).then(async (value) => {
      if (value === true) {
        try {
          await axios.delete(`/api/equipment/${_id}`);
          toast.success("Equipment deleted successfully");
          getEquipment();
        } catch (err) {
          swal({
            title: "",
            text: "Something went wrong!",
            icon: "error",
            button: "Retry",
            dangerMode: true,
          });
        }
      }
    });
  };

  const handleSaveEquipment = async () => {
    if (!equipmentName) {
      swal({
        title: "Warning",
        text: "Please fill all the required fields!",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
      return;
    }
    setSaveLoading(false);
    setLoading(true);
    const formData = new FormData();
    formData.append("name", equipmentName);
    try {
      await axios.post("/api/equipment", formData);
      handleClose();
      toast.success("Equipment added successfully");
      getEquipment();
    } catch (err) {
      swal({
        title: "",
        text: "Something went wrong!",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
    } finally {
      setSaveLoading(true);
    }
  };

  const getPageCount = () => {
    return Math.max(1, Math.ceil(equipment.length / itemPerPage));
  };

  const debouncedSearch = useCallback(
    debounce(() => {
      setPage(1);
      getEquipment();
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
              <div className="page-title-box d-flex align-items-center justify-content-between">
                <div style={{ fontSize: "22px" }} className="fw-bold">
                  Equipment
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
                    Add New Equipment
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
                          Equipment Name
                        </Typography>
                        <IconButton onClick={() => handleClose()}>
                          <CloseIcon />
                        </IconButton>
                      </Box>
                      <hr />
                      <TextField
                        placeholder="Equipment name"
                        value={equipmentName}
                        fullWidth
                        inputProps={{
                          maxLength: 25,
                        }}
                        style={{
                          padding: "1rem",
                        }}
                        onChange={(e) =>
                          setEquipmentName(
                            e.target.value.charAt(0).toUpperCase() +
                              e.target.value.slice(1)
                          )
                        }
                      />
                      {equipmentName ? (
                        <>
                          <small className="charLeft mt-2 ml-3 fst-italic">
                            {25 - equipmentName.length} characters left
                          </small>
                        </>
                      ) : (
                        <></>
                      )}

                      <Box
                        p={2}
                        display={"flex"}
                        justifyContent={"right"}
                      >
                        {!edit && (
                          <button
                            style={{
                              color: "white",
                              marginRight: "1rem",
                            }}
                            onClick={() => handleSaveEquipment()}
                            type="button"
                            className="btn btn-primary btn-sm waves-effect waves-light btn-table mx-1 mt-1"
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
                            className="btn btn-primary btn-sm waves-effect waves-light btn-table mx-1 mt-1"
                          >
                            <ClipLoader loading={!updating} size={18} />
                            {updating && "Update"}
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
                          className="btn btn-sm waves-effect waves-light btn-table mx-1 mt-1"
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
                      <label>Equipment Name:</label>
                      <input
                        type="text"
                        placeholder="Equipment name"
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
                          <th> Equipment Name</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!loading && equipment.length === 0 && (
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
                          equipment &&
                          equipment
                            .slice(
                              (`${page}` - 1) * itemPerPage,
                              `${page}` * itemPerPage
                            )
                            .map((item, i) => (
                              <tr key={i}>
                                <td>
                                  <h5>{item.name} </h5>
                                </td>
                                <td className="text-start">
                                  <button
                                    style={{
                                      color: "white",
                                      marginRight: "1rem",
                                    }}
                                    type="button"
                                    className="btn btn-primary btn-sm waves-effect waves-light btn-table mx-1 mt-1"
                                    onClick={() =>
                                      handleEditClick(
                                        item._id,
                                        item.name
                                      )
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
                                    className="btn btn-sm waves-effect waves-light btn-table mx-1 mt-1"
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

export default Equipment;