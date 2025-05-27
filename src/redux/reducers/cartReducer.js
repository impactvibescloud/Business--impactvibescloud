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
    {
        addToCart: (state, action) => {
            const item = action.payload;

            const isItemExist = state.cartItems.find((i) => i.product === item.product);

            if (isItemExist) {
                state.cartItems.forEach((i) => {
                    if (i.product === item.product) i.quantity += 1;
                });
            } else {
                state.cartItems.push(item);
            }
        },

        decrement: (state, action) => {
            const item = action.payload;
            const pro = state.cartItems.find((i) => i.product === item.product);

            if (pro.quantity > 1) {
                state.cartItems.forEach((i) => {
                    if (i.product === item.product) i.quantity -= 1;
                });
            }
        },

        deleteFromCart: (state, action) => {
            const item = action.payload;



            state.cartItems = state.cartItems.filter((i) => i.product !== item.product);
        },

        // selectTax: (state, action) => {

        //     const tax = action.payload;

        //     const item = state.cartItems.find((i) => i.product === tax.productId);
        //     if (item) {

        //         state.cartItems.forEach((i) => {
        //             if (i.product === item.product) {

        //                 i.taxName = tax.name;
        //                 i.taxRate = tax.rate;
        //                 i.taxId = tax.taxId
        //                 let rate = tax.rate / 100
        //                 let PriceWithT = i.price;
        //                 PriceWithT += + (i.price * rate).toFixed();
        //                 i.PriceWithTax = PriceWithT

        //             }
        //         });
        //     }
        // },

        calculatePrice: (state) => {
            let sum = 0;
            state.cartItems.forEach((i) => (sum += i.price_With_Tax * i.quantity));
            state.subTotal = sum;
            // state.shippingCharge = state.subTotal > 1000 ? 0 : 200;
            // state.tax = +(state.subTotal * 0.18).toFixed();
            state.total = state.subTotal
            //  + state.tax + state.shippingCharge;
        },
        addShippingInfo: (state, action) => {
            const item = action.payload;

            state.shipingInfo = item;

        },

        deleteFromshippingInfo: (state, action) => {

            state.shipingInfo = null
            state.total = 0
            state.subTotal = 0
            state.cartItems = []

        },

    }
);




