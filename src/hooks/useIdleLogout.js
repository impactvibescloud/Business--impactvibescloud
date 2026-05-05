import { useEffect } from "react";
import { signOutAsync } from "../auth";

// 30 minutes of no input → notify backend, clear local session, redirect to /.
//
// Activity events deliberately exclude `mousemove` — it fires from optical
// mouse drift even when nobody is at the desk, which would reset a 30-min
// timer continuously and ensure auto-logout never triggers.
//
// The localStorage-stamped cross-tab check catches the case where a tab
// gets backgrounded and its setTimeout is throttled by the browser.

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_KEY = "jc_business_last_active";
const LOGGED_OUT_KEY = "jc_business_logged_out";

// Force a redirect to the login page. Used by every logout path AND by
// the self-heal check in the hook below.
const redirectToLogin = (reason) => {
  if (window.location.pathname === "/") return;
  const target = `/?reason=${encodeURIComponent(reason || "idle")}`;
  try {
    // replace() is more decisive than setting `href` — it skips the
    // history entry for the now-broken protected page (so a back-button
    // press doesn't return to a logged-out dashboard) and is less likely
    // to be coalesced away by queued micro-tasks.
    window.location.replace(target);
  } catch {
    try {
      window.location.href = target;
    } catch {
      try {
        window.location.reload();
      } catch {
        /* extremely unusual */
      }
    }
  }
};

const performLogout = (reason) => {
  // signOutAsync now fires the backend ping in keepalive mode and clears
  // local state synchronously, so we never block on a hung API call.
  try {
    signOutAsync();
  } catch {
    /* ignore — local clear must always proceed */
  }
  try {
    localStorage.setItem(LOGGED_OUT_KEY, "1");
  } catch {
    /* ignore */
  }
  redirectToLogin(reason);
};

export default function useIdleLogout(timeoutMs = IDLE_TIMEOUT_MS) {
  useEffect(() => {
    let idleTimer = null;
    let crossTabInterval = null;
    let selfHealInterval = null;

    const stamp = () => {
      try {
        localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
        localStorage.removeItem(LOGGED_OUT_KEY);
      } catch {
        /* ignore */
      }
    };

    const resetTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      stamp();
      idleTimer = setTimeout(
        () => performLogout("Automatic — no activity for 30 minutes"),
        timeoutMs,
      );
    };

    const events = ["mousedown", "keydown", "wheel", "touchstart"];
    events.forEach((evt) => document.addEventListener(evt, resetTimer));

    const checkCrossTab = () => {
      try {
        if (localStorage.getItem(LOGGED_OUT_KEY)) return;
        const last = parseInt(localStorage.getItem(ACTIVITY_KEY) || "0", 10);
        if (!last) return;
        if (Date.now() - last > timeoutMs) {
          const token = localStorage.getItem("authToken");
          if (token) performLogout("Automatic — cross-tab inactivity");
        }
      } catch {
        /* ignore */
      }
    };

    crossTabInterval = setInterval(
      checkCrossTab,
      Math.min(30_000, Math.max(5_000, Math.floor(timeoutMs / 60))),
    );

    // Multi-tab safety net.
    //
    // If ANOTHER tab clears the auth token (manual signout, idle timeout
    // elsewhere), this tab's React tree is still mounted on the protected
    // layout. Every API call now 401s and the user sees the dashboard
    // chrome with empty data — "logged out but still inside the app".
    //
    // The `storage` event fires in OTHER tabs when one tab mutates
    // localStorage. We listen for `authToken` removal or LOGGED_OUT_KEY
    // being set, and redirect this tab to the login page.
    const onStorage = (e) => {
      if (!e.key) return;
      if (e.key === "authToken" && e.newValue == null) {
        redirectToLogin("session-ended-other-tab");
        return;
      }
      if (e.key === LOGGED_OUT_KEY && e.newValue === "1") {
        redirectToLogin("session-ended-other-tab");
      }
    };
    window.addEventListener("storage", onStorage);

    // Self-heal: every few seconds, if we're rendering a protected page
    // but the token is gone, force the redirect. Catches every edge case
    // where the token was cleared without a corresponding navigation
    // (queued micro-tasks, throttled tabs, manual localStorage clears).
    const selfHealCheck = () => {
      if (window.location.pathname === "/") return;
      const token = localStorage.getItem("authToken");
      if (!token) redirectToLogin("session-ended");
    };
    selfHealInterval = setInterval(selfHealCheck, 5_000);

    resetTimer();

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (crossTabInterval) clearInterval(crossTabInterval);
      if (selfHealInterval) clearInterval(selfHealInterval);
      events.forEach((evt) => document.removeEventListener(evt, resetTimer));
      window.removeEventListener("storage", onStorage);
    };
  }, [timeoutMs]);
}
