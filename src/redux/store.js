import { configureStore } from "@reduxjs/toolkit"
import { cartReducer, shipingReducer } from "./reducers/cartReducer"



// let initialState = {
//     cart: {
//         cartItems: localStorage.getItem("cartItems")
//             ? JSON.parse(localStorage.getItem("cartItems"))
//             : [],
//         subTotal: 0,
//         shipping: 0,
//         tax: 0,
//         total: 0,
//         // shippingInfo: localStorage.getItem("shippingInfo")
//         //     ? JSON.parse(localStorage.getItem("shippingInfo"))
//         //     : {},
//     },
// };

export const store = configureStore({
    reducer: {
        cart: cartReducer,
        // shipingInfo: shipingReducer
    },
    // initialState

})