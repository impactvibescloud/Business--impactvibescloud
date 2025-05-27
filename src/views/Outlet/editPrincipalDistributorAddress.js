import { Typography } from "@mui/material";
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import swal from "sweetalert";
import { v4 as uuid } from "uuid";
import MainAddress from "./mainAddress";
import axios from "axios";
import { isAutheticated } from "src/auth";
import { useNavigate, useParams } from "react-router-dom";

export default function editPrincipalDistributorAddress() {
  const token = isAutheticated();

  const [selectUserType, setSelectUserType] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phno, setPhno] = useState("");
  const [updateBtn, setUpdateBtn] = useState(false);
  const [edit, setEdit] = useState(false);
  const navigate = useNavigate();
  const id = useParams()?.id;
  const [addressess, setAddressess] = useState([
    {
      id: uuid(),
      addressLine1: "",
      addressLine2: "",
      country: "",
      state: "",
      city: "",
      zipcode: "",
    },
  ]);

  const [view, setView] = useState("0");
  const [phnoError, setPhnoError] = useState("");
  const [emailError, setEmailError] = useState("");

  const handlePhnoChange = (e) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/[^0-9]/g, "");
    setPhno(numericValue);
    if (numericValue.length > 10 || numericValue.length < 10) {
      setPhnoError(
        "Please enter a valid phone number with a maximum of 10 digits."
      );
    } else {
      setPhno(numericValue);
      setPhnoError("");
    }
  };

  const handleEmailChange = (e) => {
    const inputValue = e.target.value;
    setEmail(inputValue);
    // Regular expression for email validation
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

    if (!emailRegex.test(inputValue)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmail(inputValue);
      setEmailError("");
    }
  };

  const handleNextClick = () => {
    if (view === "0" && selectUserType !== "") {
      setView("1");
    } else if (
      !emailError &&
      !phnoError &&
      name !== "" &&
      email !== "" &&
      phno !== "" &&
      view === "1"
    ) {
      setView("2");
    } else {
      swal({
        title: "Please fill all the required fileds correctly",
        icon: "error",
        button: "Ok",
        dangerMode: true,
      });
    }
  };

  const handleBackClick = () => {
    if (view === "1") {
      setView("0");
    } else if (view === "2") {
      setView("1");
    }
  };
  const handleAddMoreAddress = () => {
    setAddressess([
      ...addressess,
      {
        id: uuid(),
        addressLine1: "",
        addressLine2: "",
        country: "",
        state: "",
        city: "",
        zipcode: "",
      },
    ]);
  };

  const handleDelete = (id) => {
    const filteredAddress = addressess.filter((item) => item.id != id);
    setAddressess(filteredAddress);
  };
  const handleAddressChange = (id, field, value) => {
    // Find the address with the given ID
    const updatedAddresses = addressess.map((address) => {
      if (address.id === id) {
        return { ...address, [field]: value };
      }
      return address;
    });

    setAddressess(updatedAddresses);
  };

  const getOneAddress = async () => {
    axios
      .get(`/api/user-address/getOneAddress/${id}`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setSelectUserType(res?.data?.address?.userType);

        setName(res?.data?.address?.name);
        setEmail(res?.data?.address?.email);
        setPhno(res?.data?.address?.phno);
        setAddressess(res?.data?.address?.addressess);
      })
      .catch((error) => {
        swal({
          title: error,
          text: " Can not fetch the Address  ",
          icon: "error",
          button: "Retry",
          dangerMode: true,
        });
      });
  };
  const handleUpdateAddress = async () => {
    if (
      !selectUserType ||
      !name ||
      !email ||
      !phno ||
      addressess.some(addressIsEmpty)
    ) {
      swal({
        title: "Please fill all the required fields correctly",
        icon: "error",
        button: "Ok",
        dangerMode: true,
      });
    } else {
      const updatedresponse = await axios.patch(
        `/api/user-address/updateAddress/${id}`,
        {
          userType: selectUserType,
          name,
          email,
          phno,
          addressess,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (updatedresponse.status === 200) {
        swal({
          title: "Congratulations!!",
          text: "Address updated successfully!",
          icon: "success",
          button: "OK",
        });
        navigate("/users-address", { replace: true });
      } else {
        swal({
          title: "Please try again",
          text: "Cannot update something went wronge !",
          icon: "error",
          button: "OK",
        });
      }
    }
  };
  const addressIsEmpty = (address) => {
    return (
      address.addressLine1 === "" ||
      address.country === "" ||
      address.state === "" ||
      address.city === "" ||
      address.zipcode === ""
    );
  };

  useEffect(() => {
    getOneAddress();
  }, []);

  return (
    <div>
      <Box>
        <Typography
          variant="h5"
          style={{ fontWeight: "bold", marginBottom: "1rem" }}
        >
          User Address
        </Typography>
        <Box
          sx={{
            background: "#FFFFFF",
            padding: "1rem",
            width: "100%",
            borderRadius: "1rem",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="outlined"
              style={{
                textTransform: "unset",
                marginRight: "1rem",
                border: "1px red solid",
              }}
              onClick={handleBackClick}
              disabled={view === "0"}
            >
              Back
            </Button>

            {view !== "2" && (
              <Button
                variant="contained"
                style={{
                  textTransform: "unset",
                }}
                onClick={handleNextClick}
              >
                Next
              </Button>
            )}

            {view === "2" && (
              <Button
                variant="contained"
                style={{
                  textTransform: "unset",
                }}
                onClick={handleUpdateAddress}
              >
                Update address
              </Button>
            )}
          </div>
          {view === "0" && (
            <div>
              <div style={{ display: "flex" }}>
                <Typography
                  variant="h6"
                  style={{
                    fontWeight: "bold",
                    marginBottom: "1rem",
                    flex: "1",
                  }}
                >
                  Select User Type
                </Typography>
              </div>
              <FormControl style={{ width: "50%" }}>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  size="small"
                  disabled={edit}
                  placeholder="select user type"
                  value={selectUserType}
                  onChange={(e) => setSelectUserType(e.target.value)}
                >
                  <MenuItem value={"Online Customer"}>Online Customer</MenuItem>
                  <MenuItem value={"Corporate"}>Corporate</MenuItem>
                </Select>
              </FormControl>
            </div>
          )}
          {view === "1" && (
            <div>
              <Typography
                style={{ fontWeight: "bold", marginBottom: "1rem" }}
                variant="h6"
              >
                User Basic Information
              </Typography>
              <Typography
                style={{ fontWeight: "bold", marginBottom: "0.5rem" }}
              >
                Name:
              </Typography>
              <TextField
                placeholder="Name"
                type="text"
                variant="outlined"
                value={name}
                disabled={edit}
                style={{ width: "50%", marginBottom: "1rem" }}
                onChange={(e) => setName(e.target.value)}
              />
              <Typography
                style={{ fontWeight: "bold", marginBottom: "0.5rem" }}
              >
                Email:
              </Typography>
              <TextField
                placeholder="Email"
                type="email"
                variant="outlined"
                value={email}
                disabled={edit}
                style={{ width: "50%", marginBottom: "1rem" }}
                onChange={handleEmailChange}
              />
              {emailError && (
                <Typography style={{ color: "red" }}>{emailError}</Typography>
              )}
              <Typography
                style={{ fontWeight: "bold", marginBottom: "0.5rem" }}
              >
                Contact number:
              </Typography>
              <TextField
                placeholder="Contact number"
                type="text"
                variant="outlined"
                value={phno}
                disabled={edit}
                inputProps={{
                  maxLength: 10,
                }}
                style={{ width: "50%", marginBottom: "1rem" }}
                onChange={handlePhnoChange}
              />
              {phnoError && (
                <Typography style={{ color: "red" }}>{phnoError}</Typography>
              )}
            </div>
          )}
          {view === "2" && (
            <Box marginTop={2}>
              <Button
                variant="contained"
                style={{
                  marginBottom: "1rem",
                  textTransform: "unset",
                }}
                disabled={addressess.length >= 2}
                onClick={() => handleAddMoreAddress()}
              >
                Add one more address{" "}
              </Button>
              {addressess.map((address, i) => (
                <Box>
                  <Box style={{ display: "flex" }}>
                    <Typography
                      style={{
                        fontWeight: "bold",
                        margin: "1rem",
                        flex: "1",
                      }}
                      variant="h5"
                    >
                      Address {i + 1}
                    </Typography>
                    {addressess.length > 1 && (
                      <Button
                        variant="contained"
                        style={{
                          background: "red",
                          textTransform: "undet",
                          margin: "0.5rem",
                        }}
                        onClick={() => handleDelete(address.id)}
                      >
                        {" "}
                        Delete
                      </Button>
                    )}
                  </Box>

                  <MainAddress
                    key={address.id}
                    address={address}
                    edit={edit}
                    setAddressess={setAddressess}
                    onAddressChange={(field, value) =>
                      handleAddressChange(address.id, field, value)
                    }
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </div>
  );
}
