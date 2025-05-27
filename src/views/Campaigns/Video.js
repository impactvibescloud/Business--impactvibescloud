import React, { useState } from "react";
import Button from "@mui/material/Button";
import axios from "axios";
import toast from "react-hot-toast";
import { isAutheticated } from "src/auth";

const Video = ({ props }) => {
  const token = isAutheticated();
  const { data, setData, handleView } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState({});

  const handleVideoUpload = (e, index) => {
    const file = e.target.files[0];
    setData((prev) => ({
      ...prev,
      videos: prev.videos.map((video, i) =>
        i === index ? { ...video, title: URL.createObjectURL(file) } : video
      ),
    }));
    setVideos((prev) => ({
      ...prev,
      [e.target.id]: file,
    }));
  };

  const addRecord = () => {
    setData((prev) => ({
      ...prev,
      videos: [...prev.videos, null],
    }));
  };

  const deleteRecord = (index) => {
    if (index >= 2) {
      setData((prev) => ({
        ...prev,
        videos: prev.videos.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const selectedVideos = Object.values(videos);

    if (!selectedVideos || selectedVideos.length === 0) {
      console.error("No videos to merge.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    // console.log(selectedVideos);
    selectedVideos.forEach((video) => {
      formData.append("videos", video);
      // console.log(Object.fromEntries(formData));
    });

    try {
      const response = await axios.post("/api/campaign/merge", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
          "Access-Control-Allow-Origin": "*",
        },
      });

      if (response.status === 200) {
        console.log("Video merged successfully");
        setIsLoading(false);
        handleView(6);
      } else {
        console.log("Failed to merge videos");
        setIsLoading(false);
        toast.error("Failed to merge videos");
      }
    } catch (error) {
      console.log("An error occurred while merging videos:", error);
      setIsLoading(false);
      toast.error(error.message);
    }
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <div
            className="
                page-title-box
                d-flex
                align-items-center
                justify-content-between
              "
          >
            <div style={{ fontSize: "22px" }} className="fw-bold">
              Videos
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <h4 className="mb-0"></h4>
            </div>

            <div className="page-title-right">
              <Button
                variant="contained"
                color="secondary"
                style={{
                  fontWeight: "bold",
                  marginBottom: "1rem",
                  textTransform: "capitalize",
                  marginRight: "5px",
                }}
                onClick={() => props.handleView(4)}
              >
                Prev
              </Button>
              <Button
                variant="contained"
                color="secondary"
                style={{
                  fontWeight: "bold",
                  marginBottom: "1rem",
                  textTransform: "capitalize",
                }}
                onClick={() => props.handleView(6)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-2">
        <div className="col-sm-12 col-md-12 col-lg-12 my-1">
          <div className="card h-100">
            <div className="card-body px-5">
              {data?.videos.map((video, index) => (
                <div className="mb-3" key={index}>
                  <label
                    htmlFor={`videoTitle${index + 1}`}
                    className="form-label"
                  >
                    Upload Video
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id={`videoTitle${index + 1}`}
                    onChange={(e) => handleVideoUpload(e, index)}
                    accept=".mp4"
                  />
                  {index >= 2 && (
                    <div className="col-12">
                      <button
                        onClick={() => {
                          deleteRecord(index);
                        }}
                        className="btn btn-danger btn-sm rounded-5 fw-bold mt-2"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <div className="col-md-12">
                <button onClick={addRecord} className="btn btn-secondary">
                  Add another record
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-12">
        <button onClick={handleSubmit} className="btn btn-primary">
          {isLoading ? "Merging" : "Merge Videos"}
        </button>
      </div>
    </div>
  );
};

export default Video;
