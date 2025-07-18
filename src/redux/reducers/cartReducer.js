import { createReducer } from "@reduxjs/toolkit";
let initialState = localStorage.getItem("cartItems") ? JSON.parse(localStorage.getItem("cartItems")) : ({
    cartItems: [],
    subTotal: 0,
    shippingCharge: 0,
    tax: 0,
    total: 0,
    shipingInfo: null,
})




export const cartReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase('addToCart', (state, action) => {
                const item = action.payload;

                const isItemExist = state.cartItems.find((i) => i.product === item.product);

                if (isItemExist) {
                    state.cartItems.forEach((i) => {
                        if (i.product === item.product) i.quantity += 1;
                    });
                } else {
                    state.cartItems.push(item);
                }
            })
            .addCase('decrement', (state, action) => {
                const item = action.payload;
                const pro = state.cartItems.find((i) => i.product === item.product);

                if (pro.quantity > 1) {
                    state.cartItems.forEach((i) => {
                        if (i.product === item.product) i.quantity -= 1;
                    });
                }
            })
            .addCase('deleteFromCart', (state, action) => {
                const item = action.payload;
                state.cartItems = state.cartItems.filter((i) => i.product !== item.product);
            })
            .addCase('calculatePrice', (state) => {
                let sum = 0;
                state.cartItems.forEach((i) => (sum += i.price_With_Tax * i.quantity));
                state.subTotal = sum;
                state.total = state.subTotal
            })
            .addCase('addShippingInfo', (state, action) => {
                const item = action.payload;
                state.shipingInfo = item;
            })
            .addCase('deleteFromshippingInfo', (state, action) => {
                state.shipingInfo = null
                state.total = 0
                state.subTotal = 0
                state.cartItems = []
            });
    }
);




