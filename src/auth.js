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

// Keys this app accumulates in localStorage that are tied to the signed-in
// session. Listed centrally so signOut clears them all — previously only
// authToken was removed, leaving businessId/branchId/cache from the prior
// user accessible to whoever logged in next on a shared workstation.
const SESSION_KEYS = [
  "authToken",
  "businessId",
  "branchId",
  "sessionStart",
  "lastAPICall",
  "apiCache",
];

export const signout = () => {
  try {
    for (const k of SESSION_KEYS) {
      try { localStorage.removeItem(k); } catch (e) {}
    }
    try { sessionStorage.removeItem("authToken"); } catch (e) {}
  } catch (e) {}
  return true;
};

// Async variant that also tells the server the session is over. Use this
// from logout buttons; it best-effort-calls /v1/user/logout but always
// completes the local clear so a network failure can't strand the user
// signed-in client-side.
export const signOutAsync = async () => {
  const token =
    typeof localStorage !== "undefined" && localStorage.getItem("authToken");
  if (token) {
    try {
      const baseUrl =
        (typeof window !== "undefined" &&
          window.location &&
          window.location.origin) ||
        "";
      await fetch(`${baseUrl}/api/v1/user/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        keepalive: true,
      }).catch(() => {});
    } catch (e) {}
  }
  signout();
  return true;
};
