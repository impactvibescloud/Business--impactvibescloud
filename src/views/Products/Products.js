import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { isAutheticated } from "src/auth";
import swal from "sweetalert";
import debounce from "lodash.debounce";
import { toast } from "react-hot-toast";
const Products = () => {
  const token = isAutheticated();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(true);
  const [productsData, setProductsData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const nameRef = useRef();
  const categoryRef = useRef();
  const brandRef = useRef();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [totalData, setTotalData] = useState(0);

  const getProductsData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/product/getAll/admin/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
          show: itemPerPage,
          name: nameRef.current?.value || "",
          category: categoryRef.current?.value || "",
          brand: brandRef.current?.value || "",
        },
      });
      setProductsData(response.data?.products || []);
      setTotalData(response.data?.total_data || 0);
    } catch (err) {
      const msg = err?.response?.data?.msg || "Something went wrong!";
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

  const getCatagories = () => {
    axios
      .get(`/api/category/getCategories`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        // console.log(res?.data?.categories);
        setCategories(res?.data?.categories);
      });
  };
  const getBrands = () => {
    axios
      .get(`/api/brand/getBrands`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        // console.log(res?.data?.brands);
        setBrands(res?.data?.brands);
      });
  };

  const [currencyDetails, setCurrencyDetails] = useState(null);

  const getCurrency = async () => {
    try {
      const response = await axios.get("/api/currency/getall", {
        // headers: {
        //   Authorization: `Bearer ${token}`,
        // },
      });

      if (response.status === 200) {
        setCurrencyDetails(response?.data?.currency[0]);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getCatagories();
    getCurrency();
    getBrands();
  }, []);

  useEffect(() => {
    getProductsData();
  }, [success, itemPerPage, currentPage]);

  const debouncedSearch = useCallback(
    debounce(() => {
      setCurrentPage(1);
      getProductsData();
    }, 500),
    []
  );

  const handleSearchChange = () => {
    debouncedSearch();
  };

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
          .delete(`/api/product/delete/${id}`, {
            headers: {
              "Access-Control-Allow-Origin": "*",
              Authorization: `Bearer ${token}`,
            },
          })
          .then((res) => {
            toast.success("Product deleted successfully!");
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
  const handleStatus = (id) => {
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
          .patch(`/api/product/admin/status/${id}`, {
            headers: {
              "Access-Control-Allow-Origin": "*",
              Authorization: `Bearer ${token}`,
            },
          })
          .then((res) => {
            toast.success("Product status updated successfully!");
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
  // console.log("currencyDetails", currencyDetails);
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
                  Products
                </div>
                <div className="page-title-right">
                  <Button
                    variant="contained"
                    color="primary"
                    className="font-bold mb-2 capitalize mr-2"
                    onClick={() => navigate("/product/add", { replace: true })}
                  >
                    Add Product
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    className="font-bold mb-2 capitalize"
                    onClick={() =>
                      navigate("/product/add/multiple", { replace: true })
                    }
                  >
                    Upload Spreadsheet
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
                      <label>Product Name:</label>
                      <input
                        type="text"
                        placeholder="product name"
                        className="form-control"
                        ref={nameRef}
                        onChange={handleSearchChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="col-lg-3">
                      <label>Filter by Category:</label>
                      <select
                        className="form-control"
                        ref={categoryRef}
                        onChange={handleSearchChange}
                        disabled={loading}
                      >
                        <option value="">All</option>
                        {categories?.map((e, i) => (
                          <option key={i} value={e._id}>
                            {e?.categoryName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-lg-3">
                      <label>Filter by Brand:</label>
                      <select
                        className="form-control"
                        ref={brandRef}
                        onChange={handleSearchChange}
                        disabled={loading}
                      >
                        <option value="">All</option>
                        {brands?.map((e, i) => (
                          <option key={i} value={e._id}>
                            {e?.brandName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

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
                          <th className="text-start" style={{ width: "8%" }}>
                            Image
                          </th>
                          <th className="text-start" style={{ width: "10%" }}>
                            SKU
                          </th>
                          <th className="text-start" style={{ width: "20%" }}>
                            Product
                          </th>
                          <th className="text-start" style={{ width: "15%" }}>
                            Category Name
                          </th>
                          <th className="text-start" style={{ width: "15%" }}>
                            Brand Name
                          </th>
                          <th className="text-start" style={{ width: "10%" }}>
                            Price
                          </th>
                          <th className="text-start" style={{ width: "10%" }}>
                            Status
                          </th>
                          <th className="text-start" style={{ width: "12%" }}>
                            Added On
                          </th>
                          <th className="text-start" style={{ width: "12%" }}>
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr>
                            <td className="text-center" colSpan="9">
                              Loading...
                            </td>
                          </tr>
                        ) : productsData?.length > 0 ? (
                          productsData?.map((product, i) => (
                            <tr key={i}>
                              <td>
                                {product?.image &&
                                product?.image?.length !== 0 ? (
                                  <img
                                    src={product?.image[0]?.url}
                                    width="50"
                                    alt="preview"
                                    style={{ borderRadius: "5px" }}
                                  />
                                ) : (
                                  <div style={{ fontSize: "13px" }}>
                                    <p className="m-0">No</p>
                                    <p className="m-0">image</p>
                                    <p className="m-0">uploaded!</p>
                                  </div>
                                )}
                              </td>
                              <td
                                className="text-start"
                                style={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {product.SKU}
                              </td>
                              <td
                                className="text-start"
                                style={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {product.name}
                              </td>
                              <td
                                className="text-start"
                                style={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {product.category?.categoryName ||
                                  "Category Not selected"}
                              </td>
                              <td
                                className="text-start"
                                style={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {product.brand?.brandName ||
                                  "Brand Not selected"}
                              </td>
                              <td className="text-start">
                                {currencyDetails?.CurrencySymbol}
                                {product?.price}
                              </td>
                              <td className="text-start">
                                <button
                                  type="button"
                                  className={`badge text-white ${
                                    product?.product_Status === "Active"
                                      ? "text-bg-success"
                                      : "text-bg-danger"
                                  }`}
                                  onClick={() => handleStatus(product._id)}
                                >
                                  {product?.product_Status}
                                </button>
                              </td>
                              <td className="text-start">
                                {new Date(product.createdAt).toLocaleString(
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
                                  to={`/product/view/${product._id}`}
                                  state={{ currencyDetails }}
                                >
                                  <button
                                    style={{
                                      color: "white",
                                      marginRight: "0.5rem",
                                    }}
                                    type="button"
                                    className="btn btn-primary btn-sm waves-effect waves-light btn-table mx-1 mt-1"
                                  >
                                    View
                                  </button>
                                </Link>

                                <Link to={`/product/edit/${product._id}`}>
                                  <button
                                    style={{
                                      color: "white",
                                      marginRight: "0.5rem",
                                    }}
                                    type="button"
                                    className="btn btn-info btn-sm waves-effect waves-light btn-table mt-1 mx-1"
                                  >
                                    Edit
                                  </button>
                                </Link>

                                <button
                                  style={{ color: "white" }}
                                  type="button"
                                  className="btn btn-danger btn-sm waves-effect waves-light btn-table mt-1 mx-1"
                                  onClick={() => handleDelete(product._id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="text-center">
                            <td colSpan="9">
                              <h5>No Product Available...</h5>
                            </td>
                          </tr>
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

export default Products;
