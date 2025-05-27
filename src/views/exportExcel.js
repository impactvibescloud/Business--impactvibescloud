import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { isAutheticated } from "src/auth";
import axios from "axios";

function ExportToExcel() {
  const token = isAutheticated();
  const [newOrdersData, setNewOrdersData] = useState([]);

  const data = [
    { name: "John", email: "john@example.com", age: 28 },
    { name: "Jane", email: "jane@example.com", age: 32 },
    // ... more data
  ];
  useEffect(() => {
    function getNewOrder() {
      axios
        .get(`/api/order/getAll/new`, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          console.log(res);
          const filteredOrders = res.data.order.filter(
            (order) => order.orderType === "WebSite"
          );

          setNewOrdersData(filteredOrders);
          //   setLoading(false);
        })
        .catch((err) => {
          console.log(err);
          //   setLoading(false);
        });
    }
    getNewOrder();
  }, []);

  const exportToExcel = () => {
    const flattenedData = newOrdersData.map((order) => ({
      ...order,
      // Flatten shippingInfo object
      shippingInfo: JSON.stringify(order.shippingInfo),
      // Concatenate item names into a single string
      items: order.items.map((item) => item.name).join(", "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "exportedData.xlsx");
  };

  return (
    <div className="App">
      <button onClick={exportToExcel}>Export as Excel</button>
    </div>
  );
}

export default ExportToExcel;
