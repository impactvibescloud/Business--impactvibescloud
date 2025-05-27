import React, { useState, useEffect } from "react";
import { Button } from "@mui/material";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CRow,
} from "@coreui/react";
import ProductDetails from "./Productcomponents/ProductDetails.js";
import ProductsImages from "./Productcomponents/ProductImages.js";
import { isAutheticated } from "src/auth.js";

const EditProduct = () => {
  const id = useParams()?.id;
  // console.log("id", id);
  const token = isAutheticated();
  const [productId, setProductId] = useState("");
  const [viewState, setViewState] = useState(1);
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    SKU:"",
    name: "",
    category: "",
    brand: "",
    description: "",
    price: "",
    GST: "",
    HSN_Code: "",
    product_Status: "",
  });

  ///////////////
  const getProduct = () => {
    axios
      .get(`/api/product/getOne/${id}`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        // console.log("res", res.data);
        setData((prev) => ({
          ...prev,
          ...res.data?.data,
          category: res.data?.data?.category?._id,
          brand: res.data?.data?.brand?._id,
          product_Status: res.data?.data?.product_Status,
        }));
        setProductId(res.data?.data?._id);
        setImages([...res.data?.data?.image]);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  };
  const getCategories = () => {
    axios
      .get(`/api/category/getCategories`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setCategories(res?.data?.categories);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const getbrands = () => {
    axios
      .get(`/api/brand/getBrands`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setBrands(res?.data?.brands);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getProduct();
    getCategories();
    getbrands();
  }, []);
  const handleView = (n) => {
    if (viewState === n) return;
    setViewState(n);
  };

  return (
    <CContainer>
      <CRow className="mt-3">
        <CCol md={12}>
          <div
            className="
                    page-title-box
                    d-flex
                    align-items-center
                    justify-content-between
                  "
          >
            <div style={{ fontSize: "22px" }} className="fw-bold">
              Edit Product : {data?.name && data?.name}
            </div>
            <div className="page-title-right">
              <Link to="/products">
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
        </CCol>
      </CRow>
      <CRow>
        <CCol md={9} className="mt-1">
          <CCardGroup>
            <CCard className="p-4 mb-3">
              <CCardBody>
                {viewState === 1 && (
                  <ProductDetails
                    data={{ data, setData }}
                    categories={categories}
                    brands={brands}
                    ProductId={{ productId, setProductId }}
                    loading={{ loading, setLoading }}
                  />
                )}
                {viewState === 3 && (
                  <ProductsImages
                    productId={productId}
                    data={{ images, setImages }}
                    loading={{ loading, setLoading }}
                  />
                )}
              </CCardBody>
            </CCard>
          </CCardGroup>
        </CCol>
        <CCol md={3} className="mt-1">
          <CCardGroup>
            <CCard>
              <CCardBody>
                <div className="d-grid gap-2">
                  <button
                    className={
                      viewState === 1
                        ? "btn btn-light"
                        : "btn btn-info text-white"
                    }
                    type="button"
                    onClick={() => handleView(1)}
                  >
                    Product Details
                  </button>
                  <button
                    className={
                      viewState === 3
                        ? "btn btn-light"
                        : "btn btn-info text-white"
                    }
                    type="button"
                    onClick={() => handleView(3)}
                  >
                    Images
                  </button>
                </div>
              </CCardBody>
            </CCard>
          </CCardGroup>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default EditProduct;
