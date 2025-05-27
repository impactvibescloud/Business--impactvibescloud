import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { Link, useParams } from "react-router-dom";
import swal from "sweetalert";
import axios from "axios";
import { isAutheticated } from "src/auth";

const ViewProductManual = () => {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const token = isAutheticated();
  const { id } = useParams();

  const getproductmanual = async () => {
    try {
      const res = await axios.get(`/api/productmanual/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // console.log(res);
      setTitle(res?.data?.productManual?.title);
      setImage(res?.data?.productManual?.product_manual);
    } catch (err) {
      console.error(err);
      swal({
        title: "Error",
        text: "Unable to fetch the blog",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
    }
  };

  useEffect(() => {
    getproductmanual();
  }, []);

  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-flex align-items-center justify-content-between">
            <div style={{ fontSize: "22px" }} className="fw-bold">
              View Product Manual
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <h4 className="mb-0"></h4>
            </div>
            <div className="page-title-right">
              <Link to="/product-manual">
                <Button
                  variant="contained"
                  color="secondary"
                  style={{
                    fontWeight: "bold",
                    marginBottom: "1rem",
                    textTransform: "capitalize",
                  }}
                >
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12 col-md-12 col-sm-12 my-1">
          <div className="card h-100">
            <div className="card-body px-5">
              <h4
                className="card-title"
                style={{
                  fontWeight: "bold",
                  fontSize: "3rem",
                  marginBottom: "1rem",
                  textTransform: "capitalize",
                }}
              >
                {title}
              </h4>
              <div className="mb-3">
                {image && (
                  image.url.endsWith('.pdf') ? (
                    <iframe
                      src={image.url}
                      title="Product Manual"
                      style={{ width: "100%", height: "80vh", border: "none" }}
                    />
                  ) : (
                    <img
                      src={image.url}
                      alt="blog"
                      style={{ width: "100%", height: "50vh" }}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProductManual;
