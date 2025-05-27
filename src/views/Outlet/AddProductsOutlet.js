import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { 
  Button, 
  TextField, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions,
  Container,
  Grid,
  Divider,
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { AddShoppingCart, RemoveShoppingCart, Save } from '@mui/icons-material';

const AddProductsOutlet = () => {
  const [products, setProducts] = useState([]);
  const [prevAddedProducts, setPrevAddedProducts] = useState([]);
  const [outletProducts, setOutletProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const outletId = useParams().id;
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/outlet/get');
        const allProducts = response.data.data;
    
        // Fetch previously added products
        const addedResponse = await axios.get(`/api/outlet/get/${outletId}`);
        const addedProducts = addedResponse.data.data.map(product => product.menuItem._id);
    
        // Filter out previously added products
        const filteredProducts = addedProducts.length === 0 ? allProducts : allProducts.filter(
          product => !addedProducts.includes(product._id)
        );
    
        setProducts(filteredProducts);
        setPrevAddedProducts(addedProducts);
      } catch (error) {
        console.error(error);
        setNotification({
          open: true,
          message: 'Failed to load products',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [outletId]);

  const handlePriceChange = (productId, price) => {
    setOutletProducts((prevProducts) => ({
      ...prevProducts,
      [productId]: { price, added: true },
    }));
  };

  const handleAddRemove = (productId) => {
    setOutletProducts((prevProducts) => {
      const product = prevProducts[productId];
      if (product && product.added) {
        return { ...prevProducts, [productId]: { ...product, added: false } };
      } else {
        const productItem = products.find(p => p._id === productId);
        return { ...prevProducts, [productId]: { price: productItem.price, added: true } };
      }
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const productsToAdd = Object.keys(outletProducts)
        .filter(productId => outletProducts[productId].added)
        .map((productId) => ({
          menuItem: productId,
          outlet: outletId,
          price: outletProducts[productId].price,
        }));

      await axios.post('/api/outlet/add', { products: productsToAdd });
      setNotification({
        open: true,
        message: 'Products added to outlet successfully',
        severity: 'success'
      });

      // Refresh the product list to exclude newly added products
      const response = await axios.get('/api/outlet/get');
      const allProducts = response.data.data;
      const addedResponse = await axios.get(`/api/outlet/get/${outletId}`);
      const addedProducts = addedResponse.data.data.map(product => product.menuItem._id);
      const filteredProducts = allProducts.filter(
        product => !addedProducts.includes(product._id)
      );
      setProducts(filteredProducts);
      setOutletProducts({}); // Reset selected products
    } catch (error) {
      console.error(error);
      setNotification({
        open: true,
        message: 'Failed to add products to outlet',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const getDisplayPrice = (product) => {
    const outletProduct = outletProducts[product._id];
    if (outletProduct?.added && outletProduct?.price !== undefined) {
      return outletProduct.price;
    }
    return product.price;
  };

  const groupedProducts = {};
  products.forEach((product) => {
    if (!groupedProducts[product.category.categoryName]) {
      groupedProducts[product.category.categoryName] = [];
    }
    groupedProducts[product.category.categoryName].push(product);
  });

  if (loading && products.length === 0) {
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container className="py-8">
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Typography variant="h4" component="h1" className="font-bold text-gray-800">
          Outlet Products Management
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Save />}
          onClick={handleSave}
          disabled={loading}
        >
          Save Outlet Products
        </Button>
      </Box>
      {Object.keys(groupedProducts).length === 0 ? (
        <Typography variant="h6" color="text.secondary" className="text-center">
          No new products available to add
        </Typography>
      ) : (
        Object.keys(groupedProducts).map((categoryName) => (
          <Box key={categoryName} className="mx-10">
            <Box className="my-4">
              <Typography variant="h5" component="h2" className="font-semibold text-gray-700">
                {categoryName}
              </Typography>
              <Divider className="mt-2" />
            </Box>
            <Grid container spacing={3}>
              {groupedProducts[categoryName].map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                  <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
                    <Box className="h-64 flex items-center justify-center bg-gray-50 p-2">
                      <CardMedia
                        component="img"
                        image={product.photo}
                        alt={product.item}
                        className="max-h-full max-w-full object-contain"
                        sx={{ objectFit: 'contain' }}
                      />
                    </Box>
                    <CardContent className="flex-grow">
                      <Typography variant="h6" component="div" className="font-medium mb-2 text-gray-800">
                        {product.item}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="mb-3">
                        Original Price: ₹{product.price}
                      </Typography>
                      <TextField
                        label="Outlet Price"
                        type="number"
                        size="small"
                        fullWidth
                        variant="outlined"
                        value={getDisplayPrice(product)}
                        onChange={(e) => handlePriceChange(product._id, e.target.value)}
                        className="mb-2"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">₹</InputAdornment>
                          ),
                        }}
                        helperText={outletProducts[product._id]?.added 
                          ? "Discounted price (edit to change)" 
                          : "Original price (click Add to modify)"}
                        disabled={!outletProducts[product._id]?.added}
                      />
                    </CardContent>
                    <CardActions className="bg-gray-50">
                      <Button
                        fullWidth
                        variant={outletProducts[product._id]?.added ? "outlined" : "contained"}
                        color={outletProducts[product._id]?.added ? "error" : "primary"}
                        onClick={() => handleAddRemove(product._id)}
                        startIcon={outletProducts[product._id]?.added ? <RemoveShoppingCart /> : <AddShoppingCart />}
                        className={outletProducts[product._id]?.added ? "text-red-500 border-red-500" : "bg-blue-600 hover:bg-blue-700"}
                      >
                        {outletProducts[product._id]?.added ? 'Remove' : 'Add to Outlet'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddProductsOutlet;