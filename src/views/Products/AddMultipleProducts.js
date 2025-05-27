import React, { useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import { isAutheticated } from "src/auth.js";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import toast from "react-hot-toast";

const AddMultipleProducts = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [updatedProducts, setupdatedProducts] = useState([]);
  const [newlyCreated, setnewlyCreated] = useState([]);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (
      selectedFile &&
      selectedFile.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      setFile(selectedFile);
    } else {
      swal("Error", "Please upload a valid Excel file", "error");
      setFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      swal("Error", "No file selected", "error");
      return;
    }

    setLoading(true);
    setErrors([]);
    setupdatedProducts([]);
    setnewlyCreated([]);
try{
    const formData = new FormData();
    formData.append('file', file);

      const token = isAutheticated();
      const response = await axios.post('/api/products/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const { data } = response;
      // console.log(data);
      if (data.errors && data.errors.length > 0) {
        setErrors(data.errors);
      }
      if (data.newlyCreated && data.newlyCreated.length > 0) {
        setnewlyCreated(data.newlyCreated);
      }
      if (data.updatedProducts && data.updatedProducts.length > 0) {
        setupdatedProducts(data.updatedProducts);
      }
      if (data.errors && data.errors.length > 0) {
        setErrors(data.errors);
        swal({
          title: "SpreadSheet Upload Successful",
          text: "A few products have errors. Please fix them and upload again.",
          icon: "warning",
          button: "OK",
        });
      } else if(data.updatedProducts && data.updatedProducts.length > 0 || data.newlyCreated && data.newlyCreated.length > 0) {
        swal({
          title: "SpreadSheet Upload Successful",
          text: "Products added successfully",
          icon: "success",
          button: "OK",
        });
      }
      else {
        toast.success("Products added successfully");
        navigate('/products');
      }

      setFile(null); // Clear the file input
      document.querySelector('input[type="file"]').value = ""; // Reset file input value
    } catch (error) {
      console.error("Upload error:", error);
      swal("Error", `Failed to upload products: ${error.response?.data?.message || 'An unexpected error occurred'}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="mb-6">
        <button
          onClick={() => navigate('/products')}
          className="btn btn-secondary"
        >
          Back
        </button>
      </div>
      <h5 className="mb-6 mt-4">Add Multiple Products</h5>
      <div className="my-3">
        <div className="row">
          <div className="col-lg-9">
            <input
              type="file"
              name="file"
              className="form-control"
              accept=".xlsx"
              onChange={handleFileChange}
            />
          </div>
          <div className="col-lg-3">
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
        <p className="pt-1 pl-2 text-secondary">Upload only .xlsx files*</p>
      </div>

      {errors.length > 0 && (
        <div className="my-4">
          <h6>Finding errors while adding the products.</h6>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th>GST</th>
                <th>HSN_Code</th>
                <th>price</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((error, index) => (
                <tr key={index}>
                  <td>{error.productName || "N/A"}</td>
                  <td>{error.category || "N/A"}</td>
                  <td>{error.brand || "N/A"}</td>
                  <td>{error.GST || "N/A"}</td>
                  <td>{error.HSN_Code || "N/A"}</td>
                  <td>{error.price || "N/A"}</td>
                  <td>{error.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {updatedProducts.length > 0 && (
        <div className="my-4">
          <h6>Updated Product Details.</h6>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th>GST</th>
                <th>HSN_Code</th>
                <th>price</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {updatedProducts.map((update, index) => (
                <tr key={index}>
                  <td>{update.name || "N/A"}</td>
                  <td>{update.category || "N/A"}</td>
                  <td>{update.brand || "N/A"}</td>
                  <td>{update.GST || "N/A"}</td>
                  <td>{update.HSN_Code || "N/A"}</td>
                  <td>{update.price || "N/A"}</td>
                  <td>{update.updatedFields}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {newlyCreated.length > 0 && (
        <div className="my-4">
          <h6>Newly Created Product Details:</h6>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th>GST</th>
                <th>HSN_Code</th>
                <th>price</th>
              </tr>
            </thead>
            <tbody>
              {newlyCreated.map((create, index) => (
                <tr key={index}>
                  <td>{create.name || "N/A"}</td>
                  <td>{create.category || "N/A"}</td>
                  <td>{create.brand || "N/A"}</td>
                  <td>{create.GST || "N/A"}</td>
                  <td>{create.HSN_Code || "N/A"}</td>
                  <td>{create.price || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AddMultipleProducts;
