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
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ClipLoader } from "react-spinners";
import swal from "sweetalert";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteSharpIcon from "@mui/icons-material/DeleteSharp";
import { Grid } from "@mui/material";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  height: "900px",
  bgcolor: "background.paper",
  borderRadius: "0.5rem",
  boxShadow: 24,
  overflow: "scroll",
};

const Design = () => {
  const token = isAutheticated();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(true); // for loading state
  // const [isUpdate, setIsUpdate] = useState(false); // for edit state
  const [saveLoding, setSaveLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [designName, setDesignName] = useState("");
  const [designImage, setDesignImage] = useState("");
  const [error, setError] = useState("");
  const [designId, setDesignId] = useState("");
  const [design, setDesign] = useState([]);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [olderDesignName, setOlderDesignName] = useState("");
  const [olderImage, setOlderImage] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [jsonSelectedFile, setJsonSelectedFile] = useState(null);
  const [categories, setCategoies] = useState([]);

  const getCategories = async () => {
    try {
      const response = await axios.get("/api/category/getCategories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setCategoies(response?.data?.categories);
      }
    } catch (error) {
      swal({
        title: error,
        text: " please login to access the resource ",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
    }
  };
  useEffect(() => {
    getCategories();
  }, [token]);
  const handleJsonFileChange = (event) => {
    const file = event.target.files[0];

    if (file && file.name.endsWith(".json")) {
      // Validate the file type
      // const reader = new FileReader();
      // reader.onload = async (event) => {
      //   const jsonData = event.target.result;
      //   // You can now send the `jsonData` to the backend for insertion
      //   setJsonSelectedFile(jsonData);
      // };
      // reader.readAsText(file);
      setJsonSelectedFile(file);
    } else {
      // Reset the selected file if it's not a valid JSON file
      setJsonSelectedFile(null);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setUpdating(true);
    setEdit(false);
    setDesignName("");
    setDesignId("");
    setOlderImage("");
    setDesignImage("");
    setJsonSelectedFile(null);
  };

  const getDesigns = async () => {
    try {
      const response = await axios.get("/api/design/getDesigns");

      if (response.status === 200) {
        setDesign(response?.data?.designs);
        setLoading(false);
      }
    } catch (error) {
      swal({
        title: error,
        text: " please login to access the resource ",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
    }
  };

  useEffect(() => {
    getDesigns();
  }, [token]);

  const handleEditClick = (
    _id,
    designName,
    designImage,
    designImageJson,
    categoryName
  ) => {
    setOpen(true);
    setOlderImage(designImage);
    setDesignName(designName);
    setDesignId(_id);
    setCategoryName(categoryName);
    setOlderDesignName(designName);
    setJsonSelectedFile(designImageJson);
    setEdit(true);
    // setUpdating(false);
  };
  const designNamesArray = [];
  const setDesignNamesArray = () => {
    design &&
      design.map((design) => {
        designNamesArray.push(design?.designName?.toLowerCase());
      });
  };
  setDesignNamesArray();

  // const handleUpdate = () => {
  //   const filteredArrayNames = designNamesArray.filter(
  //     (item) => item !== olderDesignName.toLowerCase()
  //   );

  //   const designExits = filteredArrayNames.includes(designName.toLowerCase());
  //   if (designExits) {
  //     swal({
  //       title: "Warning",
  //       text: "Design already exists ",
  //       icon: "error",
  //       button: "Retry",
  //       dangerMode: true,
  //     });
  //     return;
  //   }

  //   if (!designName || (!designImage && !olderImage) || !jsonSelectedFile) {
  //     swal({
  //       title: "Warning",
  //       text: "Please fill all the  required  fields!",
  //       icon: "error",
  //       button: "Retry",
  //       dangerMode: true,
  //     });
  //     return;
  //   }
  //   setUpdating(false);
  //   const formData = new FormData();
  //   formData.append("designName", designName);
  //   formData.append("categoryName", categoryName);
  //   formData.append("designImage", designImage);

  //   formData.append("olderImage", JSON.stringify(olderImage));
  //   formData.append("designImageJson", jsonSelectedFile);

  //   axios
  //     .patch(`/api/design/update/${designId}`, formData, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     })
  //     .then((res) => {
  //       // setUpdating(true);
  //       // setIsUpdate(false);
  //       handleClose();
  //       setDesignId("");
  //       setDesignName("");
  //       setDesignImage("");
  //       setOlderImage("");
  //       setCategoryName("");
  //       setJsonSelectedFile(null);
  //       setUpdating(true);
  //       setEdit(false);
  //       swal({
  //         title: "Congratulations!!",
  //         text: "The Design was updated successfully!",
  //         icon: "success",
  //         button: "OK",
  //       });
  //       // getCategories(); // Refresh the category list after updating
  //     })
  //     .catch((err) => {
  //       swal({
  //         title: "Sorry, please try again",
  //         text: err,
  //         icon: "error",
  //         button: "Retry",
  //         dangerMode: true,
  //       });
  //       setUpdating(true);
  //     });
  // };

  const handleDelete = (
    _id,
    designImageFilename,
    designImagePath,
    designImageJsonFilename,
    designImageJsonPath
  ) => {
    swal({
      title: "Are you sure?",
      icon: "error",
      buttons: {
        Yes: { text: "Yes", value: true },
        Cancel: { text: "Cancel", value: "cancel" },
      },
    }).then((value) => {
      if (value === true) {
        axios
          .delete(`/api/design/delete/${_id}`, {
            data: {
              designImageFilename,
              designImagePath,
              designImageJsonFilename,
              designImageJsonPath,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then((res) => {
            swal({
              title: "Congratulations!!",
              text: "The design was deleted successfully!",
              icon: "success",
              button: "OK",
            });
            getDesigns();
            // getCategories(); // Refresh the category list after deleting
          })
          .catch((err) => {
            swal({
              title: "",
              text: "Something went wrong!",
              icon: "error",
              button: "Retry",
              dangerMode: true,
            });
          });
      }
    });
  };

  const handleSaveCategory = async () => {
    const designExits = designNamesArray.includes(designName.toLowerCase());
    if (designExits) {
      swal({
        title: "Warning",
        text: "Design Already exits.",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
      return;
    }
    if (!designName || !designImage || !jsonSelectedFile || !categoryName) {
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
    formData.append("designName", designName);
    formData.append("categoryName", categoryName);
    formData.append("designImage", designImage);
    formData.append("designImageJson", jsonSelectedFile);

    axios
      .post("/api/design/add", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/formdata",
          "Access-Control-Allow-Origin": "*",
        },
      })
      .then((response) => {
        console.log(response);
        if (response.status === 201) {
          setOpen(false);
          setLoading(false);
          setSaveLoading(true);
          setDesignName("");
          setDesignImage("");
          setOlderImage("");
          setJsonSelectedFile(null);
          setCategoryName("");
          swal({
            title: "Added",
            text: "New design added successfully!",
            icon: "success",
            button: "OK",
          });
          getDesigns();
          // getCategories(); // Refresh the category list after adding
        }
      })
      .catch((error) => {
        setSaveLoading(true);
        if (error == "Error: Network Error") {
          setOpen(false);
          setLoading(false);
          setSaveLoading(true);
          setDesignName("");
          setDesignImage("");
          setOlderImage("");
          setJsonSelectedFile(null);
          setCategoryName("");
          swal({
            title: "Added",
            text: "New design added successfully!",
            icon: "success",
            button: "OK",
          });
          getDesigns();
        } else {
          swal({
            title: error,
            text: "something went wrong",
            icon: "error",
            button: "Retry",
            dangerMode: true,
          });
        }
      });
  };
  const getPageCount = () => {
    return Math.max(1, Math.ceil(design.length / itemPerPage));
  };
  console.log(process.env.REACT_APP_BASE_URL);
  const handleFileChange = (e) => {
    const files = e.target.files[0];

    // Check file types and append to selectedFiles
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(files.type)) {
      setDesignImage(files);
    }
  };
  const handeldeleteImage = () => {
    setDesignImage("");
    setJsonSelectedFile(null);
  };
  const handelDeleteOlderImage = () => {
    setOlderImage("");
    setJsonSelectedFile(null);
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
                  Design
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
                  // onClick={() => {
                  //   navigate("/testimonial/new", { replace: true });
                  // }}
                  >
                    Add New Design
                  </Button>
                  <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                  >
                    <form
                      action="/api/design/add"
                      method="post"
                      encType="multipart/form-data"
                    >
                      <Box sx={style}>
                        <Box p={2} display={"flex"}>
                          <Typography
                            id="modal-modal-title"
                            variant="body"
                            component="h2"
                            flex={1}
                          >
                            Design Name
                          </Typography>
                          <IconButton onClick={() => handleClose()}>
                            <CloseIcon />
                          </IconButton>
                        </Box>
                        <hr />
                        <TextField
                          placeholder="Design name"
                          value={designName}
                          fullWidth
                          inputProps={{
                            maxLength: 25,
                          }}
                          style={{
                            padding: "1rem",
                          }}
                          onChange={(e) =>
                            setDesignName(
                              e.target.value.charAt(0).toUpperCase() +
                              e.target.value.slice(1)
                            )
                          }
                        />
                        {designName ? (
                          <>
                            <small className="charLeft mt-2 ml-3 fst-italic">
                              {25 - designName.length} characters left
                            </small>
                          </>
                        ) : (
                          <></>
                        )}
                        <div style={{ padding: "1rem" }}>
                          <label
                            htmlFor="categorySelect"
                            style={{
                              fontWeight: "bold",
                              display: "flex",
                              flexDirection: "row",
                            }}
                          >
                            Select a Category*:
                          </label>
                          {/* <select
                  id="category"
                  style={{ width: "100%" }}
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                >
                  <option value={""}>None</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category.categoryName}>
                      {category.categoryName}
                    </option>
                  ))}
                </select> */}
                          <FormControl style={{ width: "50%" }}>
                            <Select
                              labelId="demo-simple-select-label"
                              id="demo-simple-select"
                              fullWidth
                              value={categoryName}
                              onChange={(e) => setCategoryName(e.target.value)}
                            >
                              {categories.map((category, i) => (
                                <MenuItem
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "left",
                                    textAlign: "left",
                                    padding: "0.5rem",
                                  }}
                                  key={i}
                                  value={category.categoryName}
                                >
                                  {category.categoryName}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </div>

                        <Box
                          style={{
                            padding: "1rem",
                          }}
                        >
                          <iframe
                            src="https://solar-sign-app.netlify.app/"
                            width={"100%"}
                            height={"800px"}
                          />
                          <Grid container spacing={5}>
                            <Grid item sm={6} md={6} lg={6}>
                              <Box>
                                <Typography
                                  style={{
                                    fontWeight: "bold",
                                    marginTop: "1rem",
                                  }}
                                >
                                  Upload the downloaded template*
                                </Typography>

                                <TextField
                                  // style={{
                                  //   display: "none",
                                  //   width: "350px",
                                  //   height: "350px",
                                  //   borderRadius: "10%",
                                  // }}
                                  fullWidth
                                  id="upload-Image"
                                  type="file"
                                  name="designImage"
                                  accept=".jpg , .png ,.jpeg"
                                  label="file"
                                  variant="outlined"
                                  onChange={(e) => handleFileChange(e)}
                                />
                                {/* <Box
                                  style={{ borderRadius: "10%" }}
                                  sx={{
                                    margin: "1rem 0rem",
                                    cursor: "pointer",
                                    width: "70px",
                                    height: "70px",
                                    border: "2px solid grey",
                                    // borderRadius: '50%',

                                    "&:hover": {
                                      background: "rgba(112,112,112,0.5)",
                                    },
                                  }}
                                >
                                  <CloudUploadIcon
                                    style={{
                                      color: "grey",
                                      margin: "auto",
                                      // fontSize: "5rem",
                                    }}
                                    fontSize="large"
                                  />
                                </Box> */}

                                {designImage && (
                                  <Box>
                                    <img
                                      src={URL.createObjectURL(designImage)}
                                      alt="designImage"
                                      style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: "1rem",
                                        marginLeft: "1rem",
                                      }}
                                    />
                                    <DeleteSharpIcon
                                      onClick={() => handeldeleteImage()}
                                      fontSize="small"
                                      sx={{
                                        color: "white",
                                        position: "absolute",
                                        cursor: "pointer",
                                        padding: "0.2rem",
                                        background: "black",
                                        borderRadius: "50%",
                                      }}
                                    />
                                  </Box>
                                )}
                                {olderImage && (
                                  <Box>
                                    <img
                                      src={olderImage?.secure_url}
                                      alt="categoryImage"
                                      style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: "1rem",
                                        marginLeft: "1rem",
                                      }}
                                    />
                                    <DeleteSharpIcon
                                      onClick={() => handelDeleteOlderImage()}
                                      fontSize="small"
                                      sx={{
                                        color: "white",
                                        position: "absolute",
                                        cursor: "pointer",
                                        padding: "0.2rem",
                                        background: "black",
                                        borderRadius: "50%",
                                      }}
                                    />
                                  </Box>
                                )}
                              </Box>
                              {error && <p style={{ color: "red" }}>{error}</p>}
                              <p className="text-secondary">
                                Upload jpg, jpeg and png only*
                              </p>
                            </Grid>
                            <Grid item sm={6} md={6} lg={6}>
                              <Typography
                                marginTop={2}
                                marginBottom={2}
                                fontWeight={"bold"}
                              >
                                Upload the downloaded json file only*
                              </Typography>
                              <TextField
                                type="file"
                                name="designImageJson"
                                onChange={handleJsonFileChange}
                                inputProps={{ accept: ".json" }}
                              />
                              {jsonSelectedFile ? (
                                <p
                                  style={{ fontWeight: "bold", color: "green" }}
                                >
                                  File is selected
                                </p>
                              ) : (
                                <p style={{ fontWeight: "bold", color: "red" }}>
                                  Select the json file
                                </p>
                              )}
                            </Grid>
                          </Grid>
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
                              onClick={() => handleSaveCategory()}
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
                          {/* {edit && (
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
                          )} */}
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
                    </form>
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
                          <th>Image</th>

                          <th> Design Name</th>
                          <th> Category Name</th>

                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!loading && design.length === 0 && (
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
                          design &&
                          design
                            .slice(
                              (`${page}` - 1) * itemPerPage,
                              `${page}` * itemPerPage
                            )
                            .map((item, i) => (
                              <tr key={i}>
                                <td>
                                  <img
                                    className="me-2"
                                    src={`https://api.thesolarsign.com/uploades/${item.designImage.filename}`}
                                    width="40"
                                    alt=""
                                  />
                                  <h5>{ } </h5>
                                </td>
                                <td>
                                  <h5>{item.designName} </h5>
                                </td>
                                <td>
                                  <h5>{item.categoryName} </h5>
                                </td>
                                <td className="text-start">
                                  {/* <button
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
                                        item.designName,
                                        item.designImage,
                                        item.designImageJson,
                                        item.categoryName
                                      )
                                    }
                                  >
                                    Edit
                                  </button> */}
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
                                    onClick={() =>
                                      handleDelete(
                                        item._id,
                                        item.designImage.filename,
                                        item.designImage.path,
                                        item.designImageJson.filename,
                                        item.designImageJson.path
                                      )
                                    }
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

export default Design;
