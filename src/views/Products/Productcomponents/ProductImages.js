import axios from "axios";
import React, { useEffect, useState } from "react";
import swal from "sweetalert";
import { isAutheticated } from "src/auth";

const ProductsImages = (props) => {
  const token = isAutheticated();
  const productId = props.productId;
  const { images, setImages } = props.data;
  const { loading, setLoading } = props.loading;

  const [imagePreview, setImagePreview] = useState([]);
  const [localImages, setLocalImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  useEffect(() => {
    if (images?.length > 0) {
      setImagePreview(images.map((img) => ({ url: img.url, public_id: img.public_id })));
    }
  }, [images]);

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    const imagePreviews = files.map((file) => {
      return {
        url: URL.createObjectURL(file),
        file,
      };
    });
    setLocalImages((prevImages) => [...prevImages, ...imagePreviews]);
  };

  const handleDeleteImage = (url, public_id) => {
    if (public_id) {
      // Mark image for removal
      setRemovedImages((prevRemoved) => [...prevRemoved, public_id]);
      const encodedPublicId = encodeURIComponent(public_id);
      
      // Retrieve the authentication token
      const token = isAutheticated(); // Ensure this function correctly retrieves the token
  
      // console.log("public_id:", public_id); // Log to debug
      // console.log("encodedPublicId:", encodedPublicId); // Log to debug
  
      // Delete image from Cloudinary
      axios.delete(`/api/product/deleteImage/${encodedPublicId}`, {
        headers: {
          Authorization: `Bearer ${token}` // Include the token in the headers
        }
      })
        .then(() => {
          setImagePreview((prevImages) => prevImages.filter((img) => img.url !== url));
          swal("Success", "Image deleted successfully", "success");
        })
        .catch((err) => {
          console.error(err.response?.data); // Log error for debugging
          swal("Error", "Failed to delete image", "error");
        });
    } else {
      // Delete local image
      setLocalImages((prevImages) => prevImages.filter((img) => img.url !== url));
    }
  };
  

  const handleSubmit = () => {
    setLoading(true);
    const formData = new FormData();

    // Append local images to formData
    localImages.forEach((img) => formData.append('images', img.file));

    // Append removedImages as a JSON string
    formData.append('removedImages', JSON.stringify(removedImages));

    axios.patch(`/api/product/update/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        setImages(res.data.images);
        setLocalImages([]);
        setRemovedImages([]);
        swal("Success", "Product updated successfully", "success");
      })
      .catch((err) => {
        console.error(err.response.data); // Log the error for debugging
        swal("Error", "Failed to update product", "error");
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <div className="d-flex justify-content-between">
        <h5>Product Images</h5>
      </div>
      <div className="my-3">
        <div className="row">
          <div className="col-lg-9">
            <input
              type="file"
              className="form-control"
              id="image"
              accept="image/*"
              multiple
              onChange={handleChange}
            />
          </div>
          <div className="col-lg-3">
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!productId || loading}
            >
              {productId
                ? loading
                  ? "Loading"
                  : "Upload"
                : "Product Details not saved"}
            </button>
          </div>
        </div>
        <p className="pt-1 pl-2 text-secondary">
          Upload jpg, jpeg, and png only*
        </p>
      </div>
      <div className="row">
        {imagePreview.map((img) => (
          <div key={img.url} className="col-lg-3 mb-3 position-relative">
            <img src={img.url} alt="Preview" className="img-thumbnail" />
            <button
              className="btn btn-danger position-absolute top-0 end-0 m-2"
              onClick={() => handleDeleteImage(img.url, img.public_id)}
            >
              &times;
            </button>
          </div>
        ))}
        {localImages.map((img) => (
          <div key={img.url} className="col-lg-3 mb-3 position-relative">
            <img src={img.url} alt="Preview" className="img-thumbnail" />
            <button
              className="btn btn-danger position-absolute top-0 end-0 m-2"
              onClick={() => handleDeleteImage(img.url)}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default ProductsImages;
