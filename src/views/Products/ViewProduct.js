import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { isAutheticated } from "src/auth";

const ViewProduct = () => {
  // const id = useParams()?.id;

  const location = useLocation();
  const { currencyDetails } = location.state || {};

  const { id } = useParams();
  const token = isAutheticated();

  const [productData, setProductData] = useState({});
  const navigate = useNavigate();

  const getProductData = async () => {
    axios
      .get(`/api/product/getOne/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        // console.log(res.data.data);
        setProductData(res.data.data);
      })
      .catch((err) => {});
  };
  useEffect(() => {
    getProductData();
  }, []);

  const onCancel = () => {
    navigate("/products");
  };
  let count = 1;
  return (
    <div className=" main-content">
      <div className="  my-3 page-content">
        <div className="container-fluid">
          {/* <!-- start page title --> */}
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-flex align-items-center justify-content-between">
                <h4 className="mb-3">Product Details</h4>

                <button
                  onClick={onCancel}
                  type="button"
                  className="mb-2 ml-2 btn btn-warning btn-cancel waves-effect waves-light mr-3"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
          {/* <!-- end page title --> */}

          <div className="row">
            <div className="col-lg-12">
              <div className="card">
                <div className="card-body">
                  <div className="row ml-0 mr-0  mb-10"></div>
                  <div className="table-responsive table-shoot">
                    <table className="table table-centered table-nowrap mb-0">
                      <thead className="thead-light">
                      <tr>
                          <th>SKU</th>
                          <td>{productData?.SKU}</td>
                        </tr>
                        <tr>
                          <th>Name</th>
                          <td>{productData?.name}</td>
                        </tr>
                        <tr>
                          <th>Product Group</th>
                          <td>{productData?.category?.categoryName}</td>
                        </tr>
                        <tr>
                          <th>Product Brand</th>
                          <td>{productData?.brand?.brandName}</td>
                        </tr>
                        <tr>
                          <th>Images</th>
                          <td>
                            {productData?.image &&
                            productData?.image?.length !== 0
                              ? productData?.image.map((e, i) => (
                                  <img
                                    className="p-1"
                                    src={e.url}
                                    width="100"
                                    alt="preview"
                                    key={i}
                                  />
                                ))
                              : "No Images Uploaded!"}
                          </td>
                        </tr>

                        {productData?.price && (
                          <tr>
                            <th>Price</th>
                            <td>
                              {currencyDetails?.CurrencySymbol}
                              {productData?.price}
                            </td>
                          </tr>
                        )}
                        {productData?.GST && (
                          <tr>
                            <th>GST</th>
                            <td>
                              {productData?.GST}%
                            </td>
                          </tr>
                        )}
                        {productData?.HSN_Code && (
                          <tr>
                            <th>HSN_Code</th>
                            <td>
                              {productData?.HSN_Code}
                            </td>
                          </tr>
                        )}
                        {productData?.GST && (
                          <tr>
                            <th>GST Price</th>
                            <td>
                              {currencyDetails?.CurrencySymbol}
                              {(
                                (Number(productData?.price) *
                                  Number(productData?.GST)) /
                                100
                              )?.toFixed(2)}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <th>Description</th>
                          <td>{productData?.description}</td>
                        </tr>
                        <tr>
                          <th>Product Status</th>
                          <td
                            className={`badge m-1  ${
                              productData?.product_Status === "Active"
                                ? "text-bg-success"
                                : "text-bg-danger"
                            }`}
                          >
                            {productData?.product_Status}
                          </td>
                        </tr>
                      </thead>
                      <tbody></tbody>
                    </table>
                  </div>

                  {/* <!-- end table-responsive --> */}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* <!-- container-fluid --> */}
      </div>
    </div>
  );
};

export default ViewProduct;
