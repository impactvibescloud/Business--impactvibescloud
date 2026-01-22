import "@coreui/coreui/dist/css/coreui.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import "react-app-polyfill/stable";
import "core-js";
// Main app CSS
import './App.css';
// Import our custom SCSS for consistent font styling
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";
import axios from "axios";
import { store } from "./redux/store";
import { cibGmail } from "@coreui/icons";
import { createRoot } from "react-dom/client";
import { setupAxiosInterceptors } from './utils/axiosInterceptors'
import { setupFetchInterceptor } from './utils/fetchInterceptor'
import { getBaseURL } from './config/api'
import { disableConsoleOutput } from './utils/logger'

// Configure debug mode - set to true to enable console logs
window.DEBUG_MODE = false;

// Disable non-essential console output for better performance
if (!window.DEBUG_MODE) {
  disableConsoleOutput();
}

// Configure debug mode
window.DEBUG_MODE = false; // Set this to false to disable most console logs

const setupAxios = () => {
  // Set axios baseURL based on environment. In development we keep empty
  // so local proxy/dev server can route; in production use the configured
  // API host so the browser calls the API directly.
  axios.defaults.baseURL = process.env.NODE_ENV === 'development' ? '' : getBaseURL();
  
  axios.defaults.headers = {
    "Cache-Control": "no-cache,no-store",
    Pragma: "no-cache",
    Expires: "0",
  };
  
  // Setup interceptors to handle errors gracefully
  setupAxiosInterceptors();
  
  // Setup fetch interceptor for any remaining direct fetch calls
  setupFetchInterceptor();
  
  if (window.DEBUG_MODE) {
    console.log('✅ Axios and Fetch setup complete - baseURL:', axios.defaults.baseURL);
  }
};

setupAxios();
const domNode = document.getElementById("root");
const root = createRoot(domNode);
// ReactDOM.render(
//   <Provider store={store}>
//     <App />
//   </Provider>,
//   document.getElementById("root")
// );
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
