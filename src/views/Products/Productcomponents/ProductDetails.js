import axios from "axios";
import React from "react";
import swal from "sweetalert";
import { isAutheticated } from "src/auth";

const ProductDetails = (props) => {
  const token = isAutheticated();
  const { data, setData } = props.data;
  const { productId, setProductId } = props.ProductId;
  const { loading, setLoading } = props.loading;
  const categories = props?.categories || [];
  const brands = props?.brands || [];

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = () => {
    if (
      data.name.trim() === "" ||
      data.price === "" ||
      data.GST === "" ||
      data.category === "" ||
      data.product_Status === ""||
      data.HSN_Code === "" ||
      data.brand === ""
    ) {
      swal({
        title: "Warning",
        text: "Fill all mandatory fields",
        icon: "warning",
        button: "Return",
      });
      return;
    }
    setLoading(true);
    axios
      .post(
        `/api/product/create/`,
        { ...data, product_id: productId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((res) => {
        swal({
          title: "Saved",
          text: "Product details saved successfully!",
          icon: "success",
          button: "Close",
        });
        setProductId(res.data.product_id);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || "Something went wrong!";
        swal({
          title: "Warning",
          text: msg,
          icon: "warning",
          button: "Close",
        });
        setLoading(false);
      });
  };

  return (
    <>
      <div className="d-flex justify-content-between mb-3">
        <h5>Product Details</h5>
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={() => handleSubmit()}
          disabled={loading}
        >
          {loading ? "Loading" : "Save Details"}
        </button>
      </div>
  
      <div className="mb-3 row d-flex align-items-center">
        <label htmlFor="SKU" className="form-label col-sm-3">
          Product SKU*
        </label>
        <div className="col-sm-9">
          <input
            type="text"
            className="form-control"
            id="SKU"
            value={data.SKU}
            maxLength="50"
            onChange={(e) => handleChange(e)}
          />
        </div>
      </div>
  
      <div className="mb-3 row d-flex align-items-center">
        <label htmlFor="name" className="form-label col-sm-3">
          Product Name*
        </label>
        <div className="col-sm-9">
          <input
            type="text"
            className="form-control"
            id="name"
            value={data.name}
            maxLength="50"
            onChange={(e) => handleChange(e)}
          />
        </div>
      </div>
  
        <div className="mb-3 row d-flex align-items-center">
          <label htmlFor="category" className="form-label col-sm-3">
            Category *
          </label>
          <div className="col-sm-9">
            <select
              id="category"
              onChange={(e) => handleChange(e)}
              className="form-control"
              value={data.category}
            >
              <option value="">---select---</option>
              {categories ? (
                categories.map((item, index) => (
                  <option value={item._id} key={index}>
                    {item.categoryName}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  Add Category to select
                </option>
              )}
            </select>
          </div>
        </div>
        <div className="mb-3 row d-flex align-items-center">
          <label htmlFor="brand" className="form-label col-sm-3">
            Brand *
          </label>
          <div className="col-sm-9">
            <select
              id="brand"
              onChange={(e) => handleChange(e)}
              className="form-control"
              value={data.brand}
            >
              <option value="">---select---</option>
              {brands ? (
                brands.map((item, index) => (
                  <option value={item._id} key={index}>
                    {item.brandName}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  Add Brand to select
                </option>
              )}
            </select>
          </div>
        </div>
  
        <div className="mb-3 row d-flex align-items-center">
          <label htmlFor="price" className="form-label col-sm-3">
            Price*
          </label>
          <div className="col-sm-9">
            <input
              type="text"
              className="form-control"
              id="price"
              name="price"
              value={data.price}
              maxLength="6"
              onChange={(e) => handleChange(e)}
            />
          </div>
        </div>
        <div className="mb-3 row d-flex align-items-center">
          <label htmlFor="product_Status" className="form-label col-sm-3">
            Product Status 
          </label>
          <div className="col-sm-9">
            <select
              className="form-control"
              name="product_Status"
              id="product_Status"
              value={data.product_Status}
              onChange={(e) => handleChange(e)}
            >
              <option value="">--Select--</option>
              <option value="Active">Active</option>
              <option value="inActive">inActive</option>
            </select>
          </div>
        </div>
  
        <div className="mb-3 row d-flex align-items-center">
          <label htmlFor="GST" className="form-label col-sm-3">
            GST Rate (in %)*
          </label>
          <div className="col-sm-9">
            <input
              type="text"
              className="form-control"
              id="GST"
              value={data.GST}
              maxLength="3"
              onChange={(e) => handleChange(e)}
            />
          </div>
        </div>
        <div className="mb-3 row d-flex align-items-center">
          <label htmlFor="HSN" className="form-label col-sm-3">
            HSN Code*
          </label>
          <div className="col-sm-9">
            <input
              type="text"
              className="form-control"
              id="HSN_Code"
              value={data.HSN_Code}
              maxLength="50"
              onChange={(e) => handleChange(e)}
            />
          </div>
        </div>
  
      <div className="mb-3 row d-flex align-items-center">
        <label htmlFor="description" className="form-label col-sm-3">
          Description
        </label>
        <div className="col-sm-9">
          <textarea
            className="form-control"
            id="description"
            placeholder="Text..."
            value={data.description}
            onChange={(e) => handleChange(e)}
          />
        </div>
      </div>
    </>
  );
  
};

export default ProductDetails;
