import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { isAutheticated } from "src/auth";
import swal from "sweetalert";
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Fuse from "fuse.js";
import { Typography } from "@mui/material";
import { AppBlockingSharp } from "@mui/icons-material";

const Blogs = () => {
  const token = isAutheticated();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(true);
  const [BlogsData, setBlogsData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [showData, setShowData] = useState(BlogsData);

  const handleShowEntries = (e) => {
    setCurrentPage(1);
    setItemPerPage(e.target.value);
  };

  const getBlogsData = async () => {
    axios
      .get(`/api/v1/blog/getallblog/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setBlogsData(res?.data?.BlogData);
        setLoading(false);
      })
      .catch((error) => {
        swal({
          title: error,
          text: "please login to access the resource or refresh the page  ",
          icon: "error",
          button: "Retry",
          dangerMode: true,
        });
        setLoading(false);
      });
  };

  useEffect(() => {
    getBlogsData();
  }, [success]);

  useEffect(() => {
    const loadData = () => {
      const indexOfLastPost = currentPage * itemPerPage;
      const indexOfFirstPost = indexOfLastPost - itemPerPage;
      setShowData(BlogsData.slice(indexOfFirstPost, indexOfLastPost));
    };
    loadData();
  }, [currentPage, itemPerPage, BlogsData]);

  const handleDelete = (id) => {
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
          .delete(`/api/v1/blog/deleteblog/${id}`, {
            // Correct the API endpoint
            headers: {
              "Access-Control-Allow-Origin": "*",
              Authorization: `Bearer ${token}`,
            },
          })
          .then((res) => {
            swal({
              title: "Deleted",
              text: "Blog Deleted successfully!",
              icon: "success",
              button: "ok",
            });
            setSuccess((prev) => !prev);
          })
          .catch((err) => {
            swal({
              title: "Warning",
              text: "Something went wrong!",
              icon: "error",
              button: "Retry",
              dangerMode: true,
            });
          });
      }
    });
  };

  useEffect(() => {
    setTimeout(() => {
      if (query !== "") {
        const lowerCaseQuery = query.toLowerCase(); // Convert query to lowercase

        const searchedResult = BlogsData.filter((item) =>
          item.title.toString().toLowerCase().includes(lowerCaseQuery)
        );

        setShowData(searchedResult);
      } else {
        getBlogsData();
      }
    }, 100);
  }, [query]);

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
                  Blogs
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
                    onClick={() => {
                      navigate("/blogs/create", { replace: true });
                    }}
                  >
                    Create Blog
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
                    <div className="col-sm-12 col-md-12">
                      <div className="dataTables_length">
                        <label className="w-100 d-flex gap-2 align-items-center">
                          Show :
                          <select
                            style={{ width: "50px" }}
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
                        <div style={{ display: "flex" }}>
                          <div
                            style={{
                              flex: "1",
                              display: "flex",
                              margin: "1rem 1rem 1rem 0rem",
                            }}
                          >
                            <Typography
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontWeight: "bold",
                                marginRight: "1rem",
                              }}
                            >
                              Search by Blog Title :
                            </Typography>
                            <TextField
                              style={{
                                background: "white",
                                padding: "0.5rem",
                                borderRadius: "8px",
                                flex: "1",
                                border: "1px solid grey",
                                marginRight: "2rem",
                                height: "3rem",
                                position: "relative",
                                width: "300px",
                              }}
                              placeholder="Search here..."
                              variant="standard"
                              color="white"
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              InputProps={{
                                endAdornment: (
                                  <IconButton
                                    sx={{
                                      background: "white",
                                      color: "grey",
                                      height: "2.9rem",
                                      width: "3rem",
                                      position: "absolute",
                                      right: "-8px",
                                      top: "-8px",
                                      borderRadius: "0px 8px 8px 0px",
                                    }}
                                    // onClick={() => handleSearchClick(query)}
                                  >
                                    <SearchIcon fontSize="small" />
                                  </IconButton>
                                ),
                                disableUnderline: true,
                              }}
                            />
                          </div>
                          <div
                            style={{
                              flex: "1",
                              display: "flex",
                              margin: "1rem 0rem",
                            }}
                          ></div>
                        </div>
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
                          <th className="text-start">Image</th>
                          <th className="text-start">Title</th>
                          <th className="text-start">Added On</th>
                          <th className="text-start">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!loading && showData.length === 0 && (
                          <tr className="text-center">
                            <td colSpan="4">
                              <h5>No Data Available</h5>
                            </td>
                          </tr>
                        )}
                        {loading ? (
                          <tr>
                            <td className="text-center" colSpan="4">
                              Loading...
                            </td>
                          </tr>
                        ) : (
                          showData.map((blog, index) => (
                            <tr key={index}>
                              <td>
                                {blog.image && (
                                  <img
                                    src={blog.image.url}
                                    alt="Blog Thumbnail"
                                    width="40"
                                    className="me-2"
                                  />
                                )}
                              </td>
                              <td className="text-start">{blog.title}</td>
                              <td className="text-start">
                                {new Date(blog.createdAt).toLocaleString(
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
                                <Link to={`/blog/view/${blog._id}`}>
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
                                <Link to={`/blog/edit/${blog._id}`}>
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
                                    btn-table
                                    mt-1
                                    mx-1
                                  "
                                  onClick={() => handleDelete(blog._id)}
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
                  <div className="row mt-20">
                    <div className="col-sm-12 col-md-6 mb-20">
                      <div
                        className="dataTables_info"
                        id="datatable_info"
                        role="status"
                        aria-live="polite"
                      >
                        Showing {currentPage * itemPerPage - itemPerPage + 1} to{" "}
                        {Math.min(currentPage * itemPerPage, BlogsData.length)}{" "}
                        of {BlogsData.length} entries
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
                            BlogsData.length - 1
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
                                BlogsData.length - 1
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

export default Blogs;
