import React, { useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import { isAutheticated } from "src/auth";
import { useNavigate } from "react-router-dom"; 
import { toast } from "react-hot-toast";
const AddMultiplePd = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [newlyCreated, setNewlyCreated] = useState([]);
  const [updatedDistributors, setUpdatedDistributors] = useState([]);
  const navigate = useNavigate();
  const token = isAutheticated();
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
    setUpdatedDistributors([]);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axios.post(
        "/api/v1/principaldistributor/upload",
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
      if (data?.updatedDistributors && data?.updatedDistributors?.length > 0) {
        setUpdatedDistributors(data?.updatedDistributors);
        // console.log(data.updatedDistributors);
      }

      // Redirect or display success message
      if (data?.errors && data?.errors.length > 0) {
        setErrors(data?.errors);
        swal({
          title: "SpreadSheet Upload Successful",
          text: "A few Principal Distributor have errors. Please fix them and upload again.",
          icon: "warning",
          button: "OK",
        });
      } else if (
        data?.newlyCreated.length > 0 ||
        data?.updatedDistributors.length > 0
      ) {
        swal({
          title: "SpreadSheet Upload Successful",
          text: "Principal Distributors and Addresses added successfully.",
          icon: "success",
          buttons: "OK",
        });
      } else {
        toast.success("File processed successfully with no new entries.");
        navigate("/principal-distributor");
      }
      setFile(null); // Clear the file input
      document.querySelector('input[type="file"]').value = "";
    } catch (error) {
      console.error("Upload error:", error);
      swal(
        "Error",
        `Failed to upload Principal Distributor: ${
          error.response?.data?.message || "An unexpected error occurred"
        }`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="mb-6">
        <button
          onClick={() => navigate("/principal-distributor")}
          className="btn btn-secondary"
        >
          Back
        </button>
      </div>
      <h5 className="mb-6 mt-4">Add Multiple Principal Distributor</h5>
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
          <h6>Finding errors while adding the Principal Distributor.</h6>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Principal Distributor Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>PAN</th>
                <th>GST</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((error, index) => (
                <tr key={index}>
                  <td>{error.name || "N/A"}</td>
                  <td>{error.email || "N/A"}</td>
                  <td>{error.phone || "N/A"}</td>
                  <td>{error.panNumber || "N/A"}</td>
                  <td>{error.gstNumber || "N/A"}</td>
                  <td>{error.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {updatedDistributors.length > 0 && (
        <div className="my-4">
          <h6>Updated Principal Distributors</h6>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Principal Distributor Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {updatedDistributors.map((distributor, index) => (
                <tr key={index}>
                  <td>{distributor.name || "N/A"}</td>
                  <td>{distributor.email || "N/A"}</td>
                  <td>{distributor.phone || "N/A"}</td>
                  <td>{distributor.updatedFields}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {newlyCreated.length > 0 && (
        <div className="my-4">
          <h6>Newly Created Principal Distributors:</h6>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>uniqueId</th>
                <th>Principal Distributor Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>PAN</th>
                <th>GST</th>
              </tr>
            </thead>
            <tbody>
              {newlyCreated.map((distributor, index) => (
                <tr key={index}>
                  <td>{distributor?.distributor?.uniqueId || "N/A"}</td>
                  <td>{distributor?.distributor?.name || "N/A"}</td>
                  <td>{distributor?.distributor?.email || "N/A"}</td>
                  <td>{distributor?.distributor?.phone || "N/A"}</td>
                  <td>{distributor?.address?.panNumber || "N/A"}</td>
                  <td>{distributor?.address?.gstNumber || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AddMultiplePd;
