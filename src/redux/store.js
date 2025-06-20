import { configureStore } from "@reduxjs/toolkit";
import { cartReducer, shipingReducer } from "./reducers/cartReducer";
import { coreUIReducer } from "./reducers/coreUIReducer"; // <-- Add this

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    // shipingInfo: shipingReducer,
    coreUI: coreUIReducer, // <-- Register reducer here
  },
});
