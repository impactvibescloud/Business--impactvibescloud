import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { Link, useParams } from "react-router-dom";
import swal from "sweetalert";
import axios from "axios";
import DOMPurify from "dompurify";
import { Box } from "@mui/material";

const ViewBlog = () => {
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState([]);
  const [blogContent, setBlogContent] = useState("");

  const { id } = useParams();

  // The blog body is HTML authored by trusted business users, but it still
  // round-trips through the API and is injected via dangerouslySetInnerHTML.
  // DOMPurify is the only correct way to defend against XSS here — the previous
  // regex-based "addStyles" was not a sanitizer and left attribute-based
  // injection paths (`<img onerror>`, `<a href="javascript:">`, etc.) wide open.
  const sanitizeBlogHtml = (raw) => {
    if (!raw || typeof raw !== "string") return "";
    return DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    });
  };

  useEffect(() => {
    let cancelled = false;
    const getBlog = async () => {
      try {
        const res = await axios.get(`/api/v1/blog/getoneblog/${id}`);
        if (cancelled) return;
        setTitle(res?.data?.blog?.title || "");
        setImage(res?.data?.blog?.image || null);
        setTag(Array.isArray(res?.data?.blog?.tags) ? res.data.blog.tags : []);
        setBlogContent(sanitizeBlogHtml(res?.data?.blog?.blog_content));
      } catch (err) {
        if (cancelled) return;
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
    getBlog();
    return () => {
      cancelled = true;
    };
  }, [id]);

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
                    alt={title ? `${title} cover` : "Blog cover image"}
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
                {tag.map((t) => (
                  <div
                    key={`tag-${t}`}
                    className="badge bg-primary font-size-14"
                    style={{ padding: "0.5rem" }}
                  >
                    #{t}
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
