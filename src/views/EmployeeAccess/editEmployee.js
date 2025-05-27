import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import _nav from "src/_nav";
import { isAutheticated } from "src/auth";

const EditEmployee = () => {
  const { id } = useParams();
  const token = isAutheticated();
  const navigate = useNavigate();

  const [employeeName, setEmployeeName] = useState("");
  const [phone, setPhone] = useState("");
  const [checkedItems, setCheckedItems] = useState({});
  const filteredNav = _nav.filter((item) => item.name !== "Employee");

  const handleCheckboxChange = (name) => (event) => {
    setCheckedItems({
      ...checkedItems,
      [name]: event.target.checked,
    });
  };

  useEffect(() => {
    const getSingleEmployee = async () => {
      try {
        const response = await axios.get(`/api/v1/admin/user/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const { name, phone, accessTo } = response.data.user;
        setEmployeeName(name);
        setPhone(phone);
        setCheckedItems(accessTo);
      } catch (error) {
        console.error("Error fetching employee:", error);
      }
    };

    getSingleEmployee();
  }, [id, token]);

  const handleUpdateEmployee = async () => {
    try {
      await axios.put(
        `/api/v1/admin/update-employee/${id}`,
        {
          name: employeeName,
          phone: phone,
          accessTo: checkedItems,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      navigate("/employee");
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  return (
    <div>
      <Box style={{ background: "#FFFFFF", color: "black", padding: "1rem" }}>
        <Typography
          style={{ margin: "0.5rem 0rem", fontWeight: "bold" }}
          variant="h6"
        >
          Update Employee
        </Typography>

        <div className="mb-3">
          <label htmlFor="title" className="form-label">
            Employee Name*
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter employee name"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="phone" className="form-label">
            Phone Number
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <Box>
          <label htmlFor="accessTo" className="form-label">
            Access to*
          </label>
          <div>
            {filteredNav.map((item, index) => (
              <div key={index}>
                <Checkbox
                  checked={checkedItems[item.name] || false}
                  onChange={handleCheckboxChange(item.name)}
                  inputProps={{ "aria-label": "controlled" }}
                />
                {item.name}
              </div>
            ))}
          </div>
        </Box>

        <div style={{ display: "flex" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdateEmployee}
            style={{
              fontWeight: "bold",
              marginBottom: "1rem",
              textTransform: "capitalize",
              marginRight: "5px",
            }}
          >
            Update Employee
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/employee")}
            style={{
              fontWeight: "bold",
              marginBottom: "1rem",
              textTransform: "capitalize",
              marginRight: "5px",
            }}
          >
            Cancel
          </Button>
        </div>
      </Box>
    </div>
  );
};

export default EditEmployee;
