import React, { useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import { isAutheticated } from "src/auth";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
const UploadOpeningInventory = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [newlyCreated, setNewlyCreated] = useState([]);
  const [updatedInventories, setupdatedInventories] = useState([]);
  const navigate = useNavigate();
  const token = isAutheticated();
  const { id, distributortype } = useParams();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    // console.log(file);
    // console.log(token);
    setLoading(true);
    setErrors([]);
    setNewlyCreated([]);
    setupdatedInventories([]);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axios.post(
        distributortype === "principaldistributor"
        ? `/api/openinginventories/pd/upload/${id}`
        : `/api/openinginventories/rd/upload/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // console.log(data);
      if (data?.errors && data?.errors?.length > 0) {
        setErrors(data.errors);
      }
      if (data?.newlyCreated && data?.newlyCreated?.length > 0) {
        setNewlyCreated(data?.newlyCreated);
      }
      if (data?.updatedOpeningInventories && data?.updatedOpeningInventories?.length > 0) {
        setupdatedInventories(data?.updatedOpeningInventories);
        // console.log(data.updatedOpeningInventories);
      }

      // Redirect or display success message
      if (data?.errors && data?.errors?.length > 0) {
        setErrors(data?.errors);
        swal({
          title: "SpreadSheet Upload Successful",
          text: "A few Products have errors. Please fix them and upload again.",
          icon: "warning",
          button: "OK",
        });
      } else if (
        data?.newlyCreated?.length > 0 ||
        data?.updatedOpeningInventories?.length > 0
      ) {
        swal({
          title: "SpreadSheet Upload Successful",
          text: "Product Opening Inventory uploaded successfully.",
          icon: "success",
          buttons: "OK",
        });
      } else {
        toast.success("File processed successfully with no new entries.");
        handleCancel();
      }
      setFile(null); // Clear the file input
      document.querySelector('input[type="file"]').value = "";
    } catch (error) {
      console.error("Upload error:", error);
      swal(
        "Error",
        `Failed to upload Opening Inventory Spreedsheet: ${
          error.response?.data?.message || "An unexpected error occurred"
        }`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };
  const handleCancel = () => {
    navigate(
      distributortype === "principaldistributor"
        ? `/principaldistributor/opening-inventory/${id}`
        : `/retaildistributor/opening-inventory/${id}`
    );
  };
  return (
    <div className="container mt-4">
      <div className="mb-6">
        <button onClick={handleCancel} className="btn btn-secondary">
          Back
        </button>
      </div>
      <h5 className="mb-6 mt-4">Add Multiple Products Opening inventory</h5>
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
          <h6>Finding errors while adding the Opening Inventory.</h6>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Opening Inventory</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((error, index) => (
                <tr key={index}>
                  <td>{error.SKU || "N/A"}</td>
                  <td>{error.productName || "N/A"}</td>
                  <td>{error.openingInventory || "N/A"}</td>
                  <td>{error.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {updatedInventories.length > 0 && (
        <div className="my-4">
          <h6>Updated Products in the Opening Inventory List</h6>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Opening Inventory</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {updatedInventories.map((distributor, index) => (
                <tr key={index}>
                  <td>{distributor.SKU || "N/A"}</td>
                  <td>{distributor.productName || "N/A"}</td>
                  <td>{distributor.openingInventory}</td>
                  <td>{distributor.updatedFields}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {newlyCreated.length > 0 && (
        <div className="my-4">
          <h6>Newly Added Products in Opening Inventory:</h6>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Opening Inventory</th>
              </tr>
            </thead>
            <tbody>
              {newlyCreated.map((distributor, index) => (
                <tr key={index}>
                  <td>{distributor.SKU || "N/A"}</td>
                  <td>{distributor.productName || "N/A"}</td>
                  <td>{distributor.openingInventory }</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UploadOpeningInventory;
