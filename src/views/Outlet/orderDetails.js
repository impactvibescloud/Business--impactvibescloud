import axios from "axios";
import React, { useState, useEffect } from "react";
import { isAutheticated } from "src/auth";
import swal from "sweetalert";

const OrderDetails = ({ _id, setLoading1 }) => {
  const token = isAutheticated();
  const [userOrder, setUserOrder] = useState();
  //   const [loading, setLoading] = useState(true);

  const getOrders = async () => {
    try {
      const response = await axios.get(`/api/single-pd-order/${_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserOrder(response.data.orders);
      setLoading1(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      swal({
        title: "Warning",
        text: error.message,
        icon: "error",
        button: "Close",
        dangerMode: true,
      });
      setLoading1(false);
    }
  };

  useEffect(() => {
    getOrders();
  }, [_id]);
  // console.log(userOrder, "userOrder");

  //   if (loading) {
  //     return <div>Loading...</div>;
  //   }

  return (
    <>
      <td className="text-start">
        {userOrder?.length > 0
          ? new Date(userOrder[0]?.createdAt).toLocaleString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            })
          : userOrder
          ? "No Purchase"
          : "Error"}
      </td>
      <td className="text-start">
        {userOrder?.length > 0
          ? userOrder?.length
          : userOrder
          ? "No Order"
          : "Error"}
      </td>
    </>
  );
};

export default OrderDetails;
