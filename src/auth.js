export const isAutheticated = () => {
  if (typeof window == "undefined") {
    return true;
  }
  if (localStorage.getItem("authToken")) {
    return localStorage.getItem("authToken");
  } else {
    return false;
  }
};

export const signout = () => {
  localStorage.removeItem("authToken");

  return true;
};
