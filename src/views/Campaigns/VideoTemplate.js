import React, { useState } from "react";
import Button from "@mui/material/Button";
import styled from "styled-components";
import axios from "axios";
import { isAutheticated } from "src/auth";

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  grid-gap: 0px;
`;

const GridItem = styled.div`
  display: grid;
  font-size: 20px;
  text-align: center;
`;

const UploadContainer = styled.div`
  width: 100%;
  border: 1.5px dashed gray;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

const UploadButton = styled.button`
  margin-top: 20px;
  border: none;
  font-size: 15px;
  padding: 10px;
`;

const VideoPreview = styled.video`
  width: 100%;
  height: 20rem;
  margin-top: 50px;
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
`;

const VideoTemplate = ({ props }) => {
  const token = isAutheticated();
  const { data, setData, handleView } = props;
  const [selectedFile, setSelectedFile] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [audioUrl, setAudioUrl] = useState();
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState("");

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setData((prev) => ({
      ...prev,
      [e.target.id]: file,
    }));

    setSelectedFile(URL.createObjectURL(file));

    setIsLoading(true);
    try {
      const formData = new FormData();
      console.log(data.video);
      formData.append("videoTemplate", data.video);
      // console.log(Object.fromEntries(formData));
      const response = await axios.post("/api/campaign/convert", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
          "Access-Control-Allow-Origin": "*",
        },
      });

      const { success, message, text, audio, voiceId } = response.data;
      if (success) {
        setAudioUrl(audio);
        setTranscribedText(text);
        setElevenLabsVoiceId(voiceId);
        setIsLoading(false);
        swal({
          title: "Converted",
          text: "Text Extracted Successfully",
          icon: "success",
          button: "Close",
        });
      } else {
        swal({
          title: "API Error",
          text: message,
          icon: "error",
          button: "Close",
        });
        setIsLoading(false);
        console.log("API Error:", message);
      }
    } catch (error) {
      swal({
        title: "Network Error",
        text: error.message,
        icon: "error",
        button: "Close",
      });
      setIsLoading(false);
      console.log("Network Error:", error);
    }
  };

  const handleDelete = () => {
    setSelectedFile(null);
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-flex align-items-center justify-content-between">
            <div style={{ fontSize: "22px" }} className="fw-bold">
              Upload Video to Create Template
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
                onClick={() => {
                  handleView(1);
                }}
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
                onClick={() => {
                  handleView(3);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-12 col-md-12 col-lg-12">
          <div style={{ padding: "10px" }}>
            <a href={audioUrl} target="_blank">
              Your audioUrl: {audioUrl ? audioUrl : null}
            </a>
            <p>
              {elevenLabsVoiceId ? `Your VoiceId: ${elevenLabsVoiceId}` : null}
            </p>
          </div>
          <GridContainer>
            <GridItem
              style={{
                overflowY: "auto",
                height: "30rem",
                textAlign: "left",
              }}
            >
              {isLoading
                ? "Please wait. We are converting your video to text ..."
                : transcribedText || "Transcribed Text will be displayed here"}
            </GridItem>
            <GridItem style={{ width: "30rem" }}>
              <>
                {selectedFile ? (
                  <>
                    <VideoPreview controls src={selectedFile}>
                      Your browser does not support the video tag.
                    </VideoPreview>
                    <DeleteButton onClick={handleDelete}>&times;</DeleteButton>
                  </>
                ) : (
                  <UploadContainer>
                    <input
                      type="file"
                      id="video"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      style={{ display: "none" }}
                    />
                    <label htmlFor="video">
                      {isLoading
                        ? "Please wait. We are converting your video to text ..."
                        : "Upload Your Videos to extract text from it"}
                    </label>
                    <UploadButton
                      onClick={() => document.getElementById("video").click()}
                    >
                      SELECT FILES
                    </UploadButton>
                  </UploadContainer>
                )}
              </>
            </GridItem>
          </GridContainer>
        </div>
      </div>
    </div>
  );
};

export default VideoTemplate;
