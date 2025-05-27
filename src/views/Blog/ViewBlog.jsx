import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { Link, useParams } from "react-router-dom";
import swal from "sweetalert";
import axios from "axios";
import { Box } from "@mui/material";

const ViewBlog = () => {
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState([]);
  const [blogContent, setBlogContent] = useState(""); // Changed to string

  const { id } = useParams();

  const getBlog = async () => {
    try {
      const res = await axios.get(`/api/v1/blog/getoneblog/${id}`);

      setTitle(res?.data?.blog?.title);
      setImage(res?.data?.blog?.image);
      setTag(res?.data?.blog?.tags);
      // setBlogContent(res?.data?.blog?.blog_content);
      setBlogContent(addStylesToHTML(res?.data?.blog?.blog_content));
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
  const addStylesToHTML = (content) => {
    // Example: Add styles to <p> and <ul> elements
    content = content.replace(
      /<p>/g,
      '<p style="fontSize:1.5rem; margin-top: 1rem; text-transform: capitalize;">'
    );
    content = content.replace(/<ul>/g, '<ul style="list-style-type: circle;">');
    return content;
  };
  useEffect(() => {
    getBlog();
  }, []);

  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-flex align-items-center justify-content-between">
            <div style={{ fontSize: "22px" }} className="fw-bold">
              View Blog
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <h4 className="mb-0"></h4>
            </div>

            <div className="page-title-right">
              <Link to="/blogs">
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
              <div className="mb-3">
                {image && (
                  <img
                    src={image.url}
                    alt="blog"
                    style={{ width: "100%", height: "50vh" }}
                  />
                )}
              </div>
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
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                {tag.map((tag, index) => (
                  <div
                    key={index}
                    className="badge bg-primary font-size-14"
                    style={{ padding: "0.5rem" }}
                  >
                    #{tag}
                  </div>
                ))}
              </Box>
              <div
                dangerouslySetInnerHTML={{ __html: blogContent }}
                style={{
                  fontWeight: 600,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBlog;
