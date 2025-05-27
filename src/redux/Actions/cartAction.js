import axios from "axios";

// Add to Cart
// export const addItemsToCart = (id, quantity) => async (dispatch, getState) => {
//     const { productData } = await axios.get(`/api/v1/product/${id}`);

//     dispatch({
//         type: ADD_TO_CART,
//         payload: {
//             product: productData.product._id,
//             name: productData.product.name,
//             price: productData.product.price,
//             image: productData.product.images[0].url,
//             stock: productData.product.Stock,
//             quantity,
//         },
//     });

//     localStorage.setItem("cartItems", JSON.stringify(getState().cart.cartItems));
// };
export const addItemsToCart = (id) => async (dispatch, getState) => {
    console.log(id)
    try {
        dispatch({
            type: "ADD_TO_CART_REQUIST",
        });

        const productData = await axios.get(`/api/product/getOne/${id}`);
        console.log(productData.data.product)

        dispatch({
            type: "ADD_TO_CART_SUCCESS",
            payload: {
                product: productData?.data?.product?._id,
                name: productData?.data?.product?.name,
                price: productData?.data?.product?.base_Price,
                image: productData?.data?.product?.image.url,
                // stock: productData.product.Stock,
                // quantity,
            },
        });
        localStorage.setItem("cartItems", JSON.stringify(getState().cart.cartItems));

    } catch (error) {
        console.log(error)
        dispatch({
            type: "ADD_TO_CART_FAILURE",
            payload: error.response.data.message,
        });
    }
};

// REMOVE FROM CART
export const removeItemsFromCart = (id) => async (dispatch, getState) => {
    dispatch({
        type: REMOVE_CART_ITEM,
        payload: id,
    });

    localStorage.setItem("cartItems", JSON.stringify(getState().cart.cartItems));
};

// SAVE SHIPPING INFO
// export const saveShippingInfo = (productData) => async (dispatch) => {
//     dispatch({
//         type: SAVE_SHIPPING_INFO,
//         payload: productData,
//     });

//     localStorage.setItem("shippingInfo", JSON.stringify(productData));
// };