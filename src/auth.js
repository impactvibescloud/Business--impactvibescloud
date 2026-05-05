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

// Sync variant that also tells the server the session is over. Use this
// from logout buttons; it FIRES (does not await) /v1/user/logout in
// keepalive mode so the request continues after page navigation, then
// always completes the local clear immediately.
//
// IMPORTANT: this used to be async + awaited the fetch. If the API hung
// (cold start, slow network), the await blocked the caller and the
// downstream redirect never fired — the user stayed on the protected
// page and looked like they were still logged in. Fire-and-forget fixes
// that.
//
// The backend route is auth-gated and accepts both GET and POST.
export const signOutAsync = () => {
  const token =
    typeof localStorage !== "undefined" && localStorage.getItem("authToken");
  if (token) {
    try {
      const baseUrl =
        (typeof window !== "undefined" &&
          window.location &&
          window.location.origin) ||
        "";
      fetch(`${baseUrl}/api/v1/user/logout`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        keepalive: true,
      }).catch(() => {});
    } catch (e) {}
  }
  signout();
  return true;
};
