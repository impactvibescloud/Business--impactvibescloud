import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { isAutheticated } from "src/auth";
import swal from "sweetalert";
import debounce from "lodash.debounce";
import { Typography, Paper } from "@mui/material";

const DistributorOpeningInventory = () => {
  const token = isAutheticated();
  const navigate = useNavigate();
  const { id, distributortype } = useParams();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [productsData, setProductsData] = useState([]);
  const [allProductsData, setAllProductsData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [user, setUser] = useState(null);
  const [updatedStocks, setUpdatedStocks] = useState({});
  const [currencyDetails, setCurrencyDetails] = useState(null);

  const nameRef = useRef();
  const categoryRef = useRef();
  const brandRef = useRef();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [totalData, setTotalData] = useState(0);

  // Fetch User Details
  const getUserDetails = useCallback(async () => {
    try {
      const response = await axios.get(
        distributortype === "principaldistributor"
          ? `/api/v1/admin/user/${id}`
          : `/api/getRD/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUser(
        distributortype === "principaldistributor"
          ? response.data.user
          : response.data
      );
    } catch (error) {
      swal({
        title: "Warning",
        text: error.message,
        icon: "error",
        button: "Close",
        dangerMode: true,
      });
    }
  }, [id, token]);

  // Fetch Products Data
  const getProductsData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        distributortype === "principaldistributor"
          ? `/api/pd/stock/${id}`
          : `/api/rd/stock/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: currentPage,
            show: itemPerPage,
            name: nameRef.current?.value || "",
            category: categoryRef.current?.value || "",
            brand: brandRef.current?.value || "",
          },
        }
      );
      // console.log(response.data.products);
      setProductsData(response.data?.products || []);
      setTotalData(response.data?.totalProducts || 0);
      // Merge new products with existing ones in allProductsData
      setAllProductsData((prev) => {
        const updatedList = [...prev];
        response.data?.products?.forEach((product) => {
          const index = updatedList.findIndex((p) => p._id === product._id);
          if (index > -1) {
            updatedList[index] = product; // Update existing product
          } else {
            updatedList.push(product); // Add new product
          }
        });
        return updatedList;
      });
    } catch (err) {
      swal({
        title: "Error",
        text: "Something went wrong!",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
    } finally {
      setLoading(false);
    }
  };
  // Call getUserDetails on component mount
  useEffect(() => {
    getUserDetails();
  }, [getUserDetails]);
  useEffect(() => {
    getProductsData();
  }, [success, currentPage, itemPerPage]);
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
  const handleSearchChange = useCallback(
    debounce(() => {
      setCurrentPage(1);
      getProductsData();
    }, 500),
    []
  );

  const handleStockChange = (sku, newStock) => {
    setUpdatedStocks((prevStocks) => ({
      ...prevStocks,
      [sku]: newStock, // Update stock for specific product (identified by SKU)
    }));

    // Update the stock directly in allProductsData
    setAllProductsData((prev) =>
      prev.map((product) =>
        product.SKU === sku ? { ...product, stock: newStock } : product
      )
    );
  };

  const handleSubmitStocks = async () => {
    try {
      const updatedProducts = allProductsData.map((product) => ({
        _id: product._id,
        SKU: product.SKU,
        name: product.name,
        openingInventory: updatedStocks[product.SKU] || product.stock,
      }));
      // console.log(updatedProducts);
      // console.log(id);
      await axios.put(
        distributortype === "principaldistributor"
          ? `/api/pd/stock-update`
          : `/api/rd/stock-update`,
        { products: updatedProducts, userId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      swal("Success", "Stocks updated successfully!", "success");
      setUpdatedStocks({});
      setSuccess((prev) => !prev);
    } catch (error) {
      swal("Error", "Failed to update stocks!", "error");
    }
  };

  const handleCancel = () => {
    navigate(
      distributortype === "principaldistributor"
        ? "/principal-distributor"
        : "/retail-distributor"
    );
  };

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <Paper sx={{ p: 2 }}>
                <div
                  className="
                  page-title-box
                  d-flex
                  align-items-center
                  justify-content-between
                "
                >
                  <div style={{ flex: 1 }}>
                    <Typography>
                      <strong>Name:</strong> {user?.name}
                    </Typography>
                    <Typography>
                      <strong>Mobile Number:</strong>{" "}
                      {distributortype === "principaldistributor"
                        ? user?.phone
                        : user?.mobile_number}
                    </Typography>
                    <Typography>
                      <strong>Email:</strong> {user?.email}
                    </Typography>
                  </div>
                  <div className="page-title-right mr-2">
                    <Button
                      variant="contained"
                      color="primary"
                      className="font-bold capitalize"
                      onClick={() =>
                        navigate(
                          `/${distributortype}/opening-inventory/upload/${id}`,
                          {
                            replace: true,
                          }
                        )
                      }
                    >
                      Upload Spreadsheet
                    </Button>
                  </div>
                  {/* Back Button on the right */}
                  <div className="page-title-right">
                    <Button
                      variant="contained"
                      color="secondary"
                      style={{
                        fontWeight: "bold",
                        textTransform: "capitalize",
                      }}
                      onClick={handleCancel}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              </Paper>
              {/* Section Heading: Product Stocks */}
              <div className="row mt-2 mb-1">
                <div className="col-12">
                  <div style={{ fontSize: "22px" }} className="fw-bold">
                    Product Opening Inventory
                  </div>
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
                    <div className="col-lg-2">
                      <Button
                        className="mt-4"
                        variant="contained"
                        color="primary"
                        onClick={handleSubmitStocks}
                        disabled={loading}
                      >
                        Save
                      </Button>
                    </div>
                  </div>

                  <div
                    className="table-responsive table-shoot mt-3"
                    style={{ overflowX: "auto" }}
                  >
                    <table
                      className="table table-centered table-nowrap"
                      style={{ border: "1px solid" }}
                    >
                      <thead
                        className="thead-light"
                        style={{ background: "#ecdddd" }}
                      >
                        <tr>
                          <th className="text-start">SKU</th>
                          <th className="text-start">Product</th>
                          <th className="text-start">Category Name</th>
                          <th className="text-start">Brand Name</th>
                          <th className="text-start">Price</th>
                          <th className="text-start">Added On</th>
                          <th style={{ width: "15%" }}>Opening Inventory</th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr>
                            <td className="text-center" colSpan="7">
                              Loading...
                            </td>
                          </tr>
                        ) : productsData?.length > 0 ? (
                          productsData?.map((product, i) => {
                            return (
                              <tr key={i}>
                                <td className="text-start">{product.SKU}</td>
                                <td className="text-start">{product.name}</td>
                                <td className="text-start">
                                  {product.category !== ""
                                    ? product.category
                                    : "Category Not selected "}
                                </td>
                                <td className="text-start">
                                  {product.brand !== ""
                                    ? product.brand
                                    : "Brand Not selected "}
                                </td>
                                <th className="text-start">
                                  {currencyDetails?.CurrencySymbol}
                                  {product?.price}
                                </th>
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
                                  <input
                                    type="text"
                                    value={
                                      updatedStocks[product.SKU] !== undefined
                                        ? updatedStocks[product.SKU]
                                        : product.openingInventory
                                    }
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (/^[0-9]*$/.test(value)) {
                                        // Allow only numbers or empty input, but set 0 if input is empty
                                        handleStockChange(
                                          product.SKU,
                                          value === "" ? 0 : value
                                        );
                                      }
                                    }}
                                    className="form-control"
                                  />
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          !loading &&
                          productsData?.length === 0 && (
                            <tr className="text-center">
                              <td colSpan="7">
                                <h5>No Product Available...</h5>
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

export default DistributorOpeningInventory;
