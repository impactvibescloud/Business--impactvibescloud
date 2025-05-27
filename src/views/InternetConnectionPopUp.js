import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

const InternetConnectionPopUp = () => {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOnline(window.navigator.onLine);

      // If the internet connection is reestablished, reload the page
      if (window.navigator.onLine) {
        window.location.reload();
      }
    };

    // Add event listeners to detect online/offline status changes
    window.addEventListener("online", handleOnlineStatusChange);
    window.addEventListener("offline", handleOnlineStatusChange);

    // Cleanup: remove event listeners when the component is unmounted
    return () => {
      window.removeEventListener("online", handleOnlineStatusChange);
      window.removeEventListener("offline", handleOnlineStatusChange);
    };
  }, []);

  return (
    <div>
      {!isOnline &&
        swal({
          title: "Warning",
          text: "Internet connection is lost. Please check your connection.",
          icon: "warning",
          button: {
            text: "Retry",
            value: "retry",
          },
          dangerMode: true,
        }).then((value) => {
          if (value === "retry") {
            window.location.reload(); // Reload the page
          }
        })}
    </div>
  );
};

export default InternetConnectionPopUp;
