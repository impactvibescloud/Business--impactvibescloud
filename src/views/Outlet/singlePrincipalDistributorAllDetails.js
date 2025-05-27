import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import swal from "sweetalert";
import { isAutheticated } from "src/auth";
import { City, State } from "country-state-city";
import { Modal, Button } from "react-bootstrap";
import { Autocomplete, TextField, Typography, Box } from "@mui/material";

const SinglePrincipalDistributorAllDetails = () => {
  const token = isAutheticated();
  const { _id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userOrder, setUserOrder] = useState({
    totalOrders: 0,
    totalValue: 0,
    lastPurchaseOrderDate: null,
  });
  const [userAllAddress, setUserAllAddress] = useState([]);
  const [gstNumber, setGstNumber] = useState(null);
  const [panNumber, setPanNumber] = useState(null);
  const [tradeName, setTradeName] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [products, setProducts] = useState([]);
  const [currentAddress, setCurrentAddress] = useState({
    Name: "",
    tradeName: "",
    gstNumber: "",
    panNumber: "",
    phoneNumber: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: false,
  });
  // State for product edit modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ _id: "", price: "" });

  // Fetch states when the component mounts
  useEffect(() => {
    const fetchStates = () => {
      const states = State.getStatesOfCountry("IN").map((state) => ({
        label: state.name,
        value: state.isoCode,
      }));
      setStateOptions(states);
    };
    fetchStates();
  }, []);

  // Fetch cities when a state is selected and fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`/api/outlet/get/${_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(response.data.data);
      } catch (error) {
        console.error("Error fetching products:", error);
        swal("Error", "Failed to fetch products.", "error");
      }
    };

    const fetchCities = () => {
      if (selectedState) {
        const cities = City.getCitiesOfState("IN", selectedState.value).map(
          (city) => ({
            label: city.name,
            value: city.name,
          })
        );
        setCityOptions(cities);
      } else {
        setCityOptions([]);
      }
    };

    fetchCities();
    fetchProducts();
  }, [selectedState, _id, token]);

  // Open modal for add or edit address
  const handleOpenModal = (address = null) => {
    setIsEditMode(!!address);
    const initialAddress = address || {
      Name: "",
      tradeName: tradeName,
      gstNumber: gstNumber,
      panNumber: panNumber,
      phoneNumber: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      isDefault: false,
    };
    setCurrentAddress(initialAddress);

    if (address) {
      const state =
        stateOptions.find((option) => option.label === address.state) || null;
      setSelectedState(state);
      if (state) {
        const cities = City.getCitiesOfState("IN", state.value).map((city) => ({
          label: city.name,
          value: city.name,
        }));
        setCityOptions(cities);
        const city =
          cities.find((option) => option.label === address.city) || null;
        setSelectedCity(city);
      }
    } else {
      setSelectedState(null);
      setSelectedCity(null);
      setCityOptions([]);
    }

    setShowModal(true);
  };

  // Close address modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedState(null);
    setSelectedCity(null);
    setCurrentAddress({
      Name: "",
      tradeName: "",
      gstNumber: "",
      panNumber: "",
      phoneNumber: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      isDefault: false,
    });
  };

  // Save address
  const handleSaveAddress = async () => {
    try {
      const apiUrl = isEditMode
        ? `/api/shipping/address/update/${currentAddress._id}`
        : `/api/shipping/address/admin/new/${_id}`;
      const method = isEditMode ? "patch" : "post";
      await axios[method](apiUrl, currentAddress, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      swal("Success!", `Address ${isEditMode ? "updated" : "added"} successfully!`, "success");
      handleCloseModal();
      getUserAddress();
    } catch (error) {
      console.error("Error saving address:", error);
      swal("Error!", "There was an error saving the address.", "error");
    }
  };

  // Open product edit modal
  const handleOpenProductModal = (product) => {
    setCurrentProduct({ _id: product._id, price: product.price || "" });
    setShowProductModal(true);
  };

  // Close product modal
  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setCurrentProduct({ _id: "", price: "" });
  };

  // Save product price
  const handleSaveProduct = async () => {
    try {
      await axios.put(
        `/api/outlet/edit/${currentProduct._id}`,
        { price: currentProduct.price },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      swal("Success!", "Product updated successfully!", "success");
      handleCloseProductModal();
      // Refresh products
      const response = await axios.get(`/api/outlet/get/${_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data.data);
    } catch (error) {
      console.error("Error updating product:", error);
      swal("Error!", error.response?.data?.error || "Failed to update product.", "error");
    }
  };

  // Delete product
  const handleDeleteProduct = async (id) => {
    try {
      await axios.delete(`/api/outlet/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      swal("Success!", "Product deleted successfully!", "success");
      // Refresh products
      const response = await axios.get(`/api/outlet/get/${_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data.data);
    } catch (error) {
      console.error("Error deleting product:", error);
      swal("Error!", error.response?.data?.error || "Failed to delete product.", "error");
    }
  };

  const handleStateChange = (event, newValue) => {
    setSelectedState(newValue);
    setCurrentAddress((prev) => ({
      ...prev,
      state: newValue ? newValue.label : "",
      city: "",
    }));
    setSelectedCity(null);
    setCityOptions([]);
  };

  const handleCityChange = (event, newValue) => {
    setSelectedCity(newValue);
    setCurrentAddress((prev) => ({
      ...prev,
      city: newValue ? newValue.label : "",
    }));
  };

  // Fetch user address
  const getUserAddress = useCallback(async () => {
    try {
      const response = await axios.get(`/api/shipping/address/user/address/${_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserAllAddress(response.data?.UserShippingAddress || []);
      const defaultAddress =
        response.data?.UserShippingAddress.find((address) => address.isDefault) ||
        response.data?.UserShippingAddress[0] ||
        {};
      setGstNumber(defaultAddress.gstNumber || "");
      setPanNumber(defaultAddress.panNumber || "");
      setTradeName(defaultAddress.tradeName || "");
    } catch (error) {
      swal("Warning", error.message, "error");
    }
  }, [_id, token]);

  // Fetch order count
  const getOrdersCount = useCallback(async () => {
    try {
      const response = await axios.get(`/api/single-pd-ordercount/${_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserOrder(response.data);
    } catch (error) {
      swal("Warning", error.message, "error");
    }
  }, [_id, token]);

  // Fetch user details
  const getUserDetails = useCallback(async () => {
    try {
      const response = await axios.get(`/api/v1/admin/user/${_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
    } catch (error) {
      swal("Warning", error.message, "error");
    }
  }, [_id, token]);

  useEffect(() => {
    getOrdersCount();
    getUserAddress();
    getUserDetails();
  }, [_id, getOrdersCount, getUserAddress, getUserDetails]);

  const handledeleteAddress = async (id) => {
    try {
      const response = await axios.delete(`/api/shipping/address/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { userId: _id },
      });
      swal("Success", response.data.message, "success");
      getUserAddress();
    } catch (error) {
      swal("Warning", error.response?.data?.message || error.message, "error");
    }
  };
  const [equipments, setEquipments] = useState([]);
const [showEquipmentModal, setShowEquipmentModal] = useState(false);
const [currentEquipment, setCurrentEquipment] = useState({ _id: "", quantity: "" });

// Fetch equipments
const fetchEquipments = async () => {
  try {
    const response = await axios.get(`/api/equipment/outlet/get/${_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Equipments:", response.data.data.equipment);
    setEquipments(response.data.data.equipment);
  } catch (error) {
    console.error("Error fetching equipments:", error);
    swal("Error", "Failed to fetch equipments.", "error");
  }
};
useEffect(() => {
  fetchEquipments();
}, [_id, token]);

// Open equipment edit modal
const handleOpenEquipmentModal = (equipment) => {
  setCurrentEquipment({ _id: equipment._id, quantity: equipment.quantity || "" });
  setShowEquipmentModal(true);
};

// Close equipment modal
const handleCloseEquipmentModal = () => {
  setShowEquipmentModal(false);
  setCurrentEquipment({ _id: "", quantity: "" });
};

// Save equipment quantity
const handleSaveEquipment = async () => {
  try {
    await axios.put(
      `/api/equipment/outlet/update/${_id}`,
      { quantity: currentEquipment.quantity,
        equipmentId: currentEquipment._id
       },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    swal("Success!", "Equipment updated successfully!", "success");
    handleCloseEquipmentModal();
    // Refresh equipments
    fetchEquipments();
    setEquipments(response.data.data);
  } catch (error) {
    console.error("Error updating equipment:", error);
    swal("Error!", error.response?.data?.error || "Failed to update equipment.", "error");
  }
};

// Delete equipment
const handleDeleteEquipment = async (id) => {
  try {
    await axios.delete(`/api/outlet/equipment/delete/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    swal("Success!", "Equipment deleted successfully!", "success");
    // Refresh equipments
    const response = await axios.get(`/api/outlet/equipments/${_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setEquipments(response.data.data);
  } catch (error) {
    console.error("Error deleting equipment:", error);
    swal("Error!", error.response?.data?.error || "Failed to delete equipment.", "error");
  }
};

  return (
    <div>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-flex align-items-center justify-content-between">
            <div style={{ fontSize: "22px" }} className="fw-bold">
              Outlet All Details
            </div>
            <div className="page-title-right">
              <Link to="/franchisee">
                <Button className="btn btn-danger btn-sm">Back</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="card" style={{ padding: "1rem" }}>
        <h5 style={{ fontWeight: "bold" }}>• Outlet Profile</h5>
        <div style={{ marginLeft: "1rem", marginTop: "1rem" }}>
          <Typography style={{ fontWeight: "bold", fontSize: "1.2rem", marginBottom: "1rem" }}>
            Outlet ID:
            <Typography component="span" style={{ fontWeight: "normal", marginLeft: "0.5rem" }}>
              {user?.uniqueId}
            </Typography>
          </Typography>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ flex: 1, paddingRight: "1rem" }}>
              {[
                { label: "Name", value: user?.name },
                { label: "Email", value: user?.email },
                { label: "Mobile Number", value: user?.phone },
              ].map((item, index) => (
                <Typography key={index} style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                  {item.label}:
                  <Typography component="span" style={{ fontWeight: "normal", marginLeft: "0.5rem" }}>
                    {item.value}
                  </Typography>
                </Typography>
              ))}
            </div>
            <div style={{ flex: 1, paddingLeft: "1rem" }}>
              {[
                {
                  label: "Date Registered",
                  value: new Date(user?.createdAt).toLocaleString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                  }),
                },
                {
                  label: "Last Purchase",
                  value: userOrder?.lastPurchaseOrderDate
                    ? new Date(userOrder?.lastPurchaseOrderDate).toLocaleString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                      })
                    : "No Purchase",
                },
                { label: "Total Orders", value: userOrder?.totalOrders || 0 },
                { label: "Total Spent", value: `₹ ${userOrder?.totalValue || 0}` },
              ].map((item, index) => (
                <Typography key={index} style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                  {item.label}:
                  <Typography component="span" style={{ fontWeight: "normal", marginLeft: "0.5rem" }}>
                    {item.value}
                  </Typography>
                </Typography>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: "2rem" }}>
          <h5 style={{ fontWeight: "bold", marginBottom: "1rem" }}>• Addresses</h5>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 style={{ fontWeight: "bold" }}>• Total Addresses: {userAllAddress?.length || 0}</h5>
            <Button className="btn btn-primary" onClick={() => handleOpenModal()}>
              Add Address
            </Button>
          </div>
          {userAllAddress?.length > 0 && (
            <div className="table-responsive table-shoot mt-3">
              <table className="table table-centered table-nowrap" style={{ border: "1px solid" }}>
                <thead className="thead-info" style={{ background: "rgb(140, 213, 213)" }}>
                  <tr>
                    <th style={{ width: "5%" }}>SL No.</th>
                    <th style={{ width: "37%" }}>Address</th>
                    <th style={{ width: "7%" }}>Default</th>
                    <th style={{ width: "11%" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {userAllAddress?.map((address, i) => (
                    <tr key={address._id || i}>
                      <td className="text-start">
                        <strong>{i + 1}</strong>
                      </td>
                      <td className="text-start">
                        <strong>
                          {address?.Name}-{address?.street}, {address?.city}, {address?.state}, {address?.country}, {address?.postalCode}
                        </strong>
                      </td>
                      <td className="text-center">
                        <strong>{address.isDefault ? "Yes" : "No"}</strong>
                      </td>
                      <td className="text-start">
                        <Button className="btn btn-warning btn-sm me-2" onClick={() => handleOpenModal(address)}>
                          Edit
                        </Button>
                        <Button className="btn btn-danger btn-sm" onClick={() => handledeleteAddress(address._id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Products Table Component */}
          <div style={{ marginTop: "2rem" }}>
            <h5 style={{ fontWeight: "bold", marginBottom: "1rem" }}>• Products</h5>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 style={{ fontWeight: "bold" }}>• Total Products: {products?.length || 0}</h5>
              <Button
                className="btn btn-primary"
                onClick={() => navigate(`/franchisee/products/${_id}`)}
              >
                Add Products
              </Button>
            </div>
            {products?.length > 0 ? (
              <div className="table-responsive table-shoot mt-3">
                <table className="table table-centered table-nowrap" style={{ border: "1px solid" }}>
                  <thead className="thead-info" style={{ background: "rgb(140, 213, 213)" }}>
                    <tr>
                      <th style={{ width: "5%" }}>SL No.</th>
                      <th style={{ width: "30%" }}>Name</th>
                      <th style={{ width: "25%" }}>Category</th>
                      <th style={{ width: "15%" }}>Price</th>
                      <th style={{ width: "15%" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, i) => (
                      <tr key={product._id || i}>
                        <td className="text-start">
                          <strong>{i + 1}</strong>
                        </td>
                        <td className="text-start">
                          <strong>{product?.menuItem.item || "N/A"}</strong>
                        </td>
                        <td className="text-start">
                          <strong>{product?.menuItem.category.categoryName || "N/A"}</strong>
                        </td>
                        <td className="text-start">
                          <strong>₹ {product?.price || 0}</strong>
                        </td>
                        <td className="text-start">
                          <Button
                            className="btn btn-warning btn-sm me-2"
                            onClick={() => handleOpenProductModal(product)}
                          >
                            Edit
                          </Button>
                          <Button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteProduct(product._id)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info mt-3">No products available</div>
            )}
          </div>
          <div style={{ marginTop: "2rem" }}>
  <h5 style={{ fontWeight: "bold", marginBottom: "1rem" }}>• Equipments</h5>
  <div className="d-flex justify-content-between align-items-center mb-3">
    <h5 style={{ fontWeight: "bold" }}>• Total Equipments: {equipments?.length || 0}</h5>
    <Button
      className="btn btn-primary"
      onClick={() => navigate(`/franchisee/equipments/${_id}`)}
    >
      Add Equipments
    </Button>
  </div>
  {equipments?.length > 0 ? (
    <div className="table-responsive table-shoot mt-3">
      <table className="table table-centered table-nowrap" style={{ border: "1px solid" }}>
        <thead className="thead-info" style={{ background: "rgb(140, 213, 213)" }}>
          <tr>
            <th style={{ width: "5%" }}>SL No.</th>
            <th style={{ width: "20%" }}>Name</th>
            <th style={{ width: "15%" }}>Quantity</th>
            <th style={{ width: "25%" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {equipments.map((equipment, i) => (
            <tr key={equipment._id || i}>
              <td className="text-start">
                <strong>{i + 1}</strong>
              </td>
              <td className="text-start">
                <strong>{equipment.equipmentId.name || "N/A"}</strong>
              </td>
              <td className="text-start">
                <strong>{equipment?.quantity || 0}</strong>
              </td>
              <td className="text-start">
                <Button
                  className="btn btn-warning btn-sm me-2"
                  onClick={() => handleOpenEquipmentModal(equipment)}
                >
                  Edit
                </Button>
                <Button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteEquipment(equipment._id)}
                >
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="alert alert-info mt-3">No equipments available</div>
  )}
</div>
          {/* Address Modal */}
          <Modal show={showModal} onHide={handleCloseModal} dialogClassName="modal-lg">
            <Modal.Header closeButton>
              <Modal.Title>{isEditMode ? "Edit Shipping Address" : "Add Shipping Address"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="container">
                <div className="row">
                  <div className="col-md-6">
                    <label>Name</label>
                    <input
                      type="text"
                      value={currentAddress?.Name || ""}
                      onChange={(e) => setCurrentAddress({ ...currentAddress, Name: e.target.value })}
                      className="form-control mb-3"
                      placeholder="Enter name"
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <label>GST Number</label>
                    <input
                      type="text"
                      value={currentAddress?.gstNumber || ""}
                      onChange={(e) => setCurrentAddress({ ...currentAddress, gstNumber: e.target.value })}
                      className="form-control mb-3"
                      placeholder="Enter GST number"
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      value={currentAddress?.phoneNumber || ""}
                      onChange={(e) => setCurrentAddress({ ...currentAddress, phoneNumber: e.target.value })}
                      className="form-control mb-3"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Street</label>
                    <input
                      type="text"
                      value={currentAddress?.street || ""}
                      onChange={(e) => setCurrentAddress({ ...currentAddress, street: e.target.value })}
                      className="form-control mb-3"
                      placeholder="Enter street"
                    />
                  </div>
                </div>
                <div className="row mb-4 mt-3">
                  <div className="col-md-6">
                    <Autocomplete
                      options={stateOptions}
                      value={selectedState}
                      onChange={handleStateChange}
                      renderInput={(params) => <TextField {...params} label="Select State" />}
                    />
                  </div>
                  <div className="col-md-6">
                    <Autocomplete
                      options={cityOptions}
                      value={selectedCity}
                      onChange={handleCityChange}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      renderInput={(params) => <TextField {...params} label="Select City" />}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <label>Postal Code</label>
                    <input
                      type="text"
                      value={currentAddress?.postalCode || ""}
                      onChange={(e) => setCurrentAddress({ ...currentAddress, postalCode: e.target.value })}
                      className="form-control mb-3"
                      placeholder="Enter postal code"
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Country</label>
                    <input
                      type="text"
                      disabled
                      value={currentAddress?.country || ""}
                      className="form-control mb-3"
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <label>Is Default Address</label>
                    <select
                      className="form-control mb-3"
                      value={currentAddress.isDefault ? "Yes" : "No"}
                      onChange={(e) =>
                        setCurrentAddress({ ...currentAddress, isDefault: e.target.value === "Yes" })
                      }
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={handleSaveAddress}>
                Save
              </Button>
            </Modal.Footer>
          </Modal>
          {/* Product Edit Modal */}
          <Modal show={showProductModal} onHide={handleCloseProductModal}>
            <Modal.Header closeButton>
              <Modal.Title>Edit Product Price</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="container">
                <div className="row">
                  <div className="col-12">
                    <label>Price (₹)</label>
                    <input
                      type="number"
                      value={currentProduct.price}
                      onChange={(e) =>
                        setCurrentProduct({ ...currentProduct, price: e.target.value })
                      }
                      className="form-control mb-3"
                      placeholder="Enter price"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseProductModal}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveProduct}>
                Save
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
      {/* Equipment Edit Modal */}
      <Modal show={showEquipmentModal} onHide={handleCloseEquipmentModal}>
  <Modal.Header closeButton>
    <Modal.Title>Edit Equipment Quantity</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <div className="container">
      <div className="row">
        <div className="col-12">
          <label>Quantity</label>
          <input
            type="number"
            value={currentEquipment.quantity}
            onChange={(e) =>
              setCurrentEquipment({ ...currentEquipment, quantity: e.target.value })
            }
            className="form-control mb-3"
            placeholder="Enter quantity"
            min="0"
          />
        </div>
      </div>
    </div>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={handleCloseEquipmentModal}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleSaveEquipment}>
      Save
    </Button>
  </Modal.Footer>
</Modal>
    </div>
  );
};

export default SinglePrincipalDistributorAllDetails;