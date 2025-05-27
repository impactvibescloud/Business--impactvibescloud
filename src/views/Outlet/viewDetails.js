import { Typography } from "@mui/material";
import { Box, Button, Paper } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isAutheticated } from "src/auth";
import { Country, State, City } from "country-state-city";

const activeStyle = {
  background: "black",
  margin: "1rem",
  textTransform: "unset",
  color: "white",
};
const inActive = {
  background: "blue",
  margin: "1rem",
  textTransform: "unset",
  color: "white",
};

export default function ViewAddress() {
  const [selectUserType, setSelectUserType] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phno, setPhno] = useState("");
  const token = isAutheticated();
  const navigate = useNavigate();
  const id = useParams()?.id;
  const [addressess, setAddressess] = useState([]);

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
  useEffect(() => {
    getOneAddress();
  }, []);
  const [activeTab, setActiveTab] = useState("userType");
  return (
    <div>
      <Box>
        <Button
          variant="contained"
          style={activeTab === "userType" ? activeStyle : inActive}
          onClick={() => setActiveTab("userType")}
        >
          User Type
        </Button>
        <Button
          variant="contained"
          style={activeTab === "basicInfo" ? activeStyle : inActive}
          onClick={() => setActiveTab("basicInfo")}
        >
          User Basic Information
        </Button>
        <Button
          variant="contained"
          style={activeTab === "userAddress" ? activeStyle : inActive}
          onClick={() => setActiveTab("userAddress")}
        >
          User Address
        </Button>
        {activeTab === "userType" && (
          <Box>
            <Typography
              style={{
                fontWeight: "bold",
                background: "white",
                padding: "2rem",
              }}
              variant="h5"
            >
              User Type :{" "}
              <strong style={{ color: "green" }}>{selectUserType}</strong>
            </Typography>
          </Box>
        )}
        {activeTab === "basicInfo" && (
          <Box>
            <Paper elevation={0} style={{ padding: "1rem" }}>
              <Typography variant="h4">User Basic Information</Typography>
              <Typography
                style={{
                  margin: "1rem 0rem",
                }}
                variant="h5"
              >
                User Name : <strong style={{ color: "green" }}>{name}</strong>
              </Typography>
              <Typography
                style={{
                  margin: "1rem 0rem",
                }}
                variant="h5"
              >
                User email : <strong style={{ color: "green" }}>{email}</strong>
              </Typography>
              <Typography
                style={{
                  margin: "1rem 0rem",
                }}
                variant="h5"
              >
                User phone number :{" "}
                <strong style={{ color: "green" }}>{phno}</strong>
              </Typography>
            </Paper>
          </Box>
        )}
        {activeTab === "userAddress" && (
          <Box>
            <Paper elevation={0} style={{ padding: "1rem" }}>
              <Typography variant="h4">User Address</Typography>
              {addressess.map((address, i) => (
                <Box margin={"1rem 0rem"} key={i}>
                  <Typography
                    style={{
                      margin: "1rem 0rem",
                    }}
                    variant="h5"
                  >
                    Address line 1 :{" "}
                    <strong style={{ color: "green" }}>
                      {address.addressLine1 == ""
                        ? "not available"
                        : address.addressLine1}
                    </strong>
                  </Typography>
                  <Typography
                    style={{
                      margin: "1rem 0rem",
                    }}
                    variant="h5"
                  >
                    Address line 2 :{" "}
                    <strong style={{ color: "green" }}>
                      {address.addressLine2 == ""
                        ? "not available"
                        : address.addressLine2}
                    </strong>
                  </Typography>
                  <Typography
                    style={{
                      margin: "1rem 0rem",
                    }}
                    variant="h5"
                  >
                    Country :{" "}
                    <strong style={{ color: "green" }}>
                      {Country.getCountryByCode(address.country).name}
                    </strong>
                  </Typography>
                  <Typography
                    style={{
                      margin: "1rem 0rem",
                    }}
                    variant="h5"
                  >
                    State :{" "}
                    <strong style={{ color: "green" }}>
                      {
                        State.getStateByCodeAndCountry(
                          address.state,
                          address.country
                        ).name
                      }
                    </strong>
                  </Typography>
                  <Typography
                    style={{
                      margin: "1rem 0rem",
                    }}
                    variant="h5"
                  >
                    City :{" "}
                    <strong style={{ color: "green" }}>{address.city}</strong>
                  </Typography>
                  <Typography
                    style={{
                      margin: "1rem 0rem",
                    }}
                    variant="h5"
                  >
                    Zipcode :{" "}
                    <strong style={{ color: "green" }}>
                      {address.zipcode}
                    </strong>
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Box>
        )}
      </Box>
    </div>
  );
}
