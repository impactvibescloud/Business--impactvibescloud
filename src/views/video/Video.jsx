import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Container,
  Paper,
  IconButton,
  CircularProgress,
  Divider,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MovieIcon from '@mui/icons-material/Movie';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

// Enhanced styling for cards with smooth hover effects
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
  },
}));

// Styled upload area with visual feedback
const UploadArea = styled(Box)(({ theme, isDragActive }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: isDragActive ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
}));

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [videoName, setVideoName] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [thumbnails, setThumbnails] = useState({});
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteLoading, setDeleteLoading] = useState({});
  const fileInputRef = useRef(null);

  // Generate thumbnail for a video URL
  const generateThumbnail = async (videoUrl, videoId) => {
    if (thumbnails[videoId]) return;

    try {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.currentTime = 2; // Capture frame at 2 seconds

      await new Promise((resolve) => {
        video.onloadeddata = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailUrl = canvas.toDataURL('image/jpeg');

      setThumbnails((prev) => ({ ...prev, [videoId]: thumbnailUrl }));
    } catch (error) {
      console.error(`Error generating thumbnail for video ${videoId}:`, error);
      setThumbnails((prev) => ({
        ...prev,
        [videoId]: 'https://via.placeholder.com/320x180?text=Error',
      }));
    }
  };

  // Modified to match original behavior but keep preview functionality
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // This is the original behavior - just set the file
    setVideoFile(file);
    
    // Add preview functionality
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Auto-generate a name if empty (optional feature)
    if (!videoName) {
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setVideoName(fileName);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        // Match original behavior - just set the file
        setVideoFile(file);
        
        // Add preview
        setPreviewUrl(URL.createObjectURL(file));
        
        // Optional name generation
        if (!videoName) {
          const fileName = file.name.replace(/\.[^/.]+$/, "");
          setVideoName(fileName);
        }
      }
    }
  };

  // Upload video function
  const handleAddVideo = async () => {
    if (!videoFile || !videoName) return;

    // Add loading state
    setLoading(true);

    const formData = new FormData();
    formData.append('videoFile', videoFile);
    formData.append('name', videoName);

    try {
      const response = await axios.post('/api/videos/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Update videos state with new video
      setVideos(prevVideos => [...prevVideos, response.data.video]);
      setVideoName('');
      setVideoFile(null);
      setPreviewUrl('');
      setSuccessMessage('Video uploaded successfully!');
    } catch (error) {
      console.error('Error uploading video:', error);
      setError('Failed to upload video');
    } finally {
      setLoading(false);
    }
  };

  // Improved delete function with loading state
  const handleDeleteVideo = async (videoId) => {
    // Set loading state for this specific delete operation
    setDeleteLoading(prev => ({ ...prev, [videoId]: true }));
    
    try {
      await axios.delete(`/api/videos/delete/${videoId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      // Update UI by removing the video from state
      setVideos(prevVideos => prevVideos.filter(video => video._id !== videoId));
      
      // Also clean up the thumbnail from state
      setThumbnails(prev => {
        const newThumbnails = { ...prev };
        delete newThumbnails[videoId];
        return newThumbnails;
      });
      
      setSuccessMessage('Video deleted successfully!');
    } catch (error) {
      console.error('Error deleting video:', error);
      setError('Failed to delete video. Ensure you are authorized.');
    } finally {
      // Clear loading state for this delete operation
      setDeleteLoading(prev => {
        const newState = { ...prev };
        delete newState[videoId];
        return newState;
      });
    }
  };

  // Fetch videos on component mount
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get('/api/videos/get-all');
        setVideos(response.data);
        // Generate thumbnails for each video
        response.data.forEach((video) => {
          generateThumbnail(video.video.url, video._id);
        });
      } catch (error) {
        console.error('Error fetching videos:', error);
        setError('Failed to load videos');
      }
    };
    fetchVideos();
  }, []);

  // Cleanup previews when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearFile = () => {
    setVideoFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clear success message after display
  const handleSuccessClose = () => {
    setSuccessMessage('');
  };
  
  // Clear error message
  const handleErrorClose = () => {
    setError(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Success message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSuccessClose} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
      
      {/* Error message */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleErrorClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Upload Section */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mb: 6, 
          borderRadius: 3,
          background: 'linear-gradient(to right, #ffffff, #f9f9f9)'
        }}
      >
        <Box display="flex" alignItems="center" mb={4}>
          <VideoLibraryIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" color="primary" fontWeight="500">
            Video Library
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={4}>
          {/* Left column: Upload area */}
          <Grid item xs={12} md={6}>
            <UploadArea
              isDragActive={isDragActive}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{ height: '100%', minHeight: previewUrl ? 'auto' : 250 }}
            >
              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="video/*"
                onChange={handleVideoChange}
              />
              
              {previewUrl ? (
                <>
                  <Box sx={{ width: '100%', mb: 2, position: 'relative' }}>
                    <video
                      width="100%"
                      height="auto"
                      controls
                      style={{ borderRadius: 8, maxHeight: 240 }}
                    >
                      <source src={previewUrl} />
                      Your browser does not support the video tag.
                    </video>
                    <Chip 
                      label={videoFile?.name || 'Selected Video'} 
                      sx={{ mt: 1 }}
                      onDelete={clearFile}
                    />
                  </Box>
                </>
              ) : (
                <>
                  <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" align="center">
                    Drag and drop video here
                  </Typography>
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
                    or click to browse files
                  </Typography>
                </>
              )}
            </UploadArea>
          </Grid>
          
          {/* Right column: Name input and upload button */}
          <Grid item xs={12} md={6}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <TextField
                fullWidth
                label="Video Title"
                value={videoName}
                onChange={(e) => setVideoName(e.target.value)}
                variant="outlined"
                margin="normal"
                sx={{ mb: 3 }}
              />
              
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleAddVideo}
                disabled={!videoFile || !videoName || loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <MovieIcon />}
                sx={{ 
                  py: 1.5,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  boxShadow: 2
                }}
              >
                {loading ? 'Uploading...' : 'Upload Video'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Video Gallery Header */}
      <Box mb={4} display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" fontWeight="500">
          My Videos
        </Typography>
        <Chip 
          icon={<VideoLibraryIcon />} 
          label={`${videos.length} videos`} 
          color="primary" 
          variant="outlined" 
        />
      </Box>

      {/* Video Cards Grid */}
      {videos.length > 0 ? (
        <Grid container spacing={3}>
          {videos.map((video) => (
            <Grid item xs={12} sm={6} md={4} key={video._id}>
              <StyledCard>
                <Box sx={{ position: 'relative', bgcolor: '#000', overflow: 'hidden' }}>
                  <video
                    width="100%"
                    height="180"
                    controls
                    preload="metadata"
                    poster={thumbnails[video._id]}
                  >
                    <source src={video.video.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  
                  <Box 
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      background: 'rgba(0,0,0,0.4)',
                      transition: 'opacity 0.2s ease',
                      '&:hover': {
                        opacity: 1,
                      }
                    }}
                  >
                    <IconButton 
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.9)',
                        '&:hover': {
                          bgcolor: 'white',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="500" gutterBottom noWrap>
                    {video.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {new Date(video.createdAt || Date.now()).toLocaleDateString()}
                  </Typography>
                  
                  <Box mt={2} display="flex" justifyContent="flex-end">
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteVideo(video._id)}
                      disabled={deleteLoading[video._id]}
                      size="small"
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(211, 47, 47, 0.04)' 
                        } 
                      }}
                    >
                      {deleteLoading[video._id] ? (
                        <CircularProgress size={20} color="error" />
                      ) : (
                        <DeleteIcon />
                      )}
                    </IconButton>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box textAlign="center" py={8}>
          <MovieIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No videos uploaded yet
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Upload your first video to get started
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Videos;