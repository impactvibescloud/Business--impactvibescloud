import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { isAutheticated } from "src/auth";
import swal from "sweetalert";
import debounce from "lodash.debounce";
import { toast } from "react-hot-toast";
const OpeningInventoryReports = () => {
  const token = isAutheticated();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
      const response = await axios.get(`/api/report/opening-inventory`, {
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
      // console.log(response.data);
      setProductsData(response.data?.data || []);
      setTotalData(response.data?.pagination?.total || 0);
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

  useEffect(() => {
    getCatagories();
    getBrands();
  }, []);

  useEffect(() => {
    getProductsData();
  }, [itemPerPage, currentPage]);

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
                  Opening Inventory Reports
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
                          <th className="text-start" style={{ width: "10%" }}>
                            SKU Code
                          </th>
                          <th className="text-start" style={{ width: "25%" }}>
                            SKU Description
                          </th>
                          <th className="text-start" style={{ width: "15%" }}>
                            Category Name
                          </th>
                          <th className="text-start" style={{ width: "15%" }}>
                            Brand Name
                          </th>
                          <th className="text-start" style={{ width: "15%" }}>
                           Total At PD & RD
                          </th>
                          <th className="text-start" style={{ width: "10%" }}>
                            All PDs
                          </th>
                          <th className="text-start" style={{ width: "10%" }}>
                            All RDs
                          </th>
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
                          productsData?.map((product, i) => (
                            <tr key={i}>
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
                                {product.category || "Category Not selected"}
                              </td>
                              <td
                                className="text-start"
                                style={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {product.brand || "Brand Not selected"}
                              </td>
                              <td className="text-start">
                                {product.allPdAndRd}
                              </td>
                              <td className="text-start">{product.allPDs}</td>
                              <td className="text-start">{product.allRDs}</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="text-center">
                            <td colSpan="7">
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

export default OpeningInventoryReports;
