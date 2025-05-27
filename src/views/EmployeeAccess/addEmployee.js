import { Box, Button, Typography } from "@mui/material";
import React, { useState } from "react";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { useNavigate } from "react-router-dom";
import _nav from "src/_nav";
import toast from "react-hot-toast";
import axios from "axios";

const AddEmployee = () => {
  const [employeeName, setEmployeeName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const filteredNav = _nav.filter((item) => item.name !== "Employee");
  const [checkedItems, setCheckedItems] = useState(
    filteredNav.reduce((acc, item) => {
      acc[item.name] = false;
      return acc;
    }, {})
  );

  // const filteredEntries = Object.fromEntries(
  //   Object.entries(checkedItems).filter(([key, value]) => value === true)
  // );
  // console.log(filteredEntries);
  const handleCheckboxChange = (name) => (event) => {
    setCheckedItems({
      ...checkedItems,
      [name]: event.target.checked,
    });
  };

  console.log(checkedItems);
  const generatePassword = (name, email) => {
    const combinedStr = (name + email).toLowerCase(); // Convert to lowercase for consistency
    const specialChars = "@#*!$%^&"; // Define the set of special characters
    const alphaChars = combinedStr.match(/[a-zA-Z]/g); // Filter out alphabetic characters
    const digitChars = combinedStr.match(/\d/g); // Filter out digits
    const filteredChars = combinedStr.match(/[^\W_]/g); // Filter out non-alphanumeric characters
    let passwordChars = alphaChars.concat(filteredChars); // Combine alphabetic and filtered characters

    // Ensure at least one uppercase letter
    if (!passwordChars.some((char) => char === char.toUpperCase())) {
      const uppercaseChar = String.fromCharCode(
        65 + Math.floor(Math.random() * 26)
      );
      passwordChars.push(uppercaseChar);
    }

    // Ensure at least one digit
    if (!digitChars || digitChars.length === 0) {
      const digitChar = Math.floor(Math.random() * 10).toString();
      passwordChars.push(digitChar);
    }

    // Insert a random special character at a random position in the password characters array
    const specialChar = specialChars.charAt(
      Math.floor(Math.random() * specialChars.length)
    );
    const randomIndex = Math.floor(Math.random() * (passwordChars.length + 1));
    passwordChars.splice(randomIndex, 0, specialChar);

    passwordChars = passwordChars.sort(() => Math.random() - 0.5); // Shuffle the characters
    // passwordString.charAt(0).toUpperCase() + passwordString.slice(1) + "@";
    const normalpassword = passwordChars.join("").slice(0, 8); // Take the first 8 characters
    const passwordWithspecialChar =
      normalpassword.charAt(0).toUpperCase() + normalpassword.slice(1) + "1@2";
    return passwordWithspecialChar;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    console.log("request made");
    try {
      if (!employeeName || !email || !phone) {
        throw new Error("Fill all fields!");
      }

      // Generate password based on name and email
      const generatedPassword = generatePassword(employeeName, email);
      console.log(generatedPassword); // Use generatedPassword instead of generatePassword
      // Set generated password to user state

      const response = await axios.post("/api/v1/user/register", {
        // Send user details
        name: employeeName,
        email: email,
        phone: phone,
        role: "Employee",
        accessTo: checkedItems,
        password: generatedPassword, // Send generated password to the backend
      });
      console.log(response);
      if (response.status === 201) {
        toast.success("Employee Added Successful");
        // setUserId(response.data.userId);
        navigate("/employee");
      }
    } catch (error) {
      console.log(error?.response);
      // toast.error(error?.response);
    }
  };

  return (
    <div>
      <Box style={{ background: "#FFFFFF", color: "black", padding: "1rem" }}>
        <Typography
          style={{ margin: "0.5rem 0rem", fontWeight: "bold" }}
          variant="h6"
        >
          {" "}
          Add Employee:{" "}
        </Typography>

        <div className="mb-3">
          <label htmlFor="title" className="form-label">
            Employee Name*
          </label>

          <input
            type="text"
            className="form-control"
            id="title"
            placeholder="Eg: Roshan Garg"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="title" className="form-label">
            Phone Number
          </label>

          <input
            type="text"
            className="form-control"
            id="title"
            placeholder="Eg: 8516913819"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="welcomeMsgforDes" className="form-label">
            Email*
          </label>

          <input
            type="email"
            className="form-control"
            id="welcomeMsgforDes"
            placeholder="Eg: roshan@gmailcom "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Box>
          <label htmlFor="welcomeMsgforDes" className="form-label">
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
            onClick={handleFormSubmit}
            style={{
              fontWeight: "bold",
              marginBottom: "1rem",
              textTransform: "capitalize",
              marginRight: "5px",
            }}
          >
            Save
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

export default AddEmployee;
