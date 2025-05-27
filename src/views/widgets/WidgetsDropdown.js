import React, { useEffect, useState } from "react";
import {
  CRow,
  CCol,
  CDropdown,
  CDropdownMenu,
  CDropdownItem,
  CDropdownToggle,
  CWidgetStatsA,
} from "@coreui/react";
import { getStyle } from "@coreui/utils";
import { CChartBar, CChartLine } from "@coreui/react-chartjs";
import CIcon from "@coreui/icons-react";
import { cilArrowBottom, cilArrowTop, cilOptions } from "@coreui/icons";
import { BeatLoader } from "react-spinners";
import { isAutheticated } from "src/auth";
import axios from "axios";
{
  /* <BeatLoader color="#36d7b7" /> */
}
const WidgetsDropdown = ({
  users,
  salescoordinator,
  territorymanager,
  retaildistributor,
  Brand,
  services,
  category,
  outlets,
  orders,
}) => {
  console.log(category)
  // const WidgetsDropdown = ({ users, category, service, Requests }) => {
  //   const token = isAutheticated();
  //   const [orders, setOrders] = useState([]);
  //   const [todayorders, setTodayOrders] = useState([]);
  //   const [monthorders, setMonthOrders] = useState([]);
  //   const [yearorders, setYearOrders] = useState([]);
  //   const [lastyearorders, setLastYearOrders] = useState([]);
  //   const [processingorders, setProcessingOrders] = useState([]);
  //   const [dispatchedorders, setDispatchedOrders] = useState([]);
  //   const [deliveredorders, setDeliveredOrders] = useState([]);
  //   const [cancelledorders, setCancelledOrders] = useState([]);
  //   const getAllOrder = async () => {
  //     let res = await axios.get(`/api/order/getAll/`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     // console.log(res.data);
  //     setOrders(res?.data?.order);
  //     setTodayOrders(
  //       res?.data?.order?.filter((order) => {
  //         return (
  //           new Date(order.createdAt).toDateString() === new Date().toDateString()
  //         );
  //       })
  //     );
  //     setMonthOrders(
  //       res?.data?.order?.filter((order) => {
  //         return new Date(order.createdAt).getMonth() === new Date().getMonth();
  //       })
  //     );
  //     setYearOrders(
  //       res?.data?.order?.filter((order) => {
  //         return (
  //           new Date(order.createdAt).getFullYear() === new Date().getFullYear()
  //         );
  //       })
  //     );
  //     setLastYearOrders(
  //       res?.data?.order?.filter((order) => {
  //         return (
  //           new Date(order.createdAt).getFullYear() ===
  //           new Date().getFullYear() - 1
  //         );
  //       })
  //     );
  //   };
  //   const getProcessingOrder = async () => {
  //     let res = await axios.get(`/api/order/getAll/processing`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     // console.log(res.data);
  //     setProcessingOrders(res?.data?.order);
  //   };
  //   const getDispatchedOrder = async () => {
  //     let res = await axios.get(`/api/order/getAll/dispatched`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     // console.log(res.data);
  //     setDispatchedOrders(res?.data?.order);
  //   };
  //   const getDeliveredOrder = async () => {
  //     let res = await axios.get(`/api/order/getAll/delivered`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     // console.log(res.data);
  //     setDeliveredOrders(res?.data?.order);
  //   };
  //   const getCancelledOrder = async () => {
  //     let res = await axios.get(`/api/order/getAll/cancelled`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     // console.log(res.data);
  //     setCancelledOrders(res?.data?.order);
  //   };

  //   useEffect(() => {
  //     getAllOrder();
  //     getProcessingOrder();
  //     getDispatchedOrder();
  //     getDeliveredOrder();
  //     getCancelledOrder();
  //   }, [token]);
  //   const date = new Date();
  //   const day = date.getDate();
  //   const suffix =
  //     day === 1 || day === 21 || day === 31
  //       ? "st"
  //       : day === 2 || day === 22
  //       ? "nd"
  //       : day === 3 || day === 23
  //       ? "rd"
  //       : "th";
  //   const month = date.toLocaleDateString("en-US", { month: "long" });
  //   const formattedDate = `${day}${suffix} ${month}`;
  //   // console.log(formattedDate);
  //   const year = date.toLocaleDateString("en-US", { year: "numeric" });
  //   const formattedmonth = `${month} ${year}`;
  return (
    <>
      {/* <h4>Users</h4> */}
      {/* <h4>Principal Distributor</h4> */}
      {/* <CRow>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{users}</>}
            title="Total Principal Distributor"
          />
        </CCol> */}
        {/* </CRow> */}
        {/* <h4>Retail Distributor</h4> */}
        {/* <CRow> */}
        {/* <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{retaildistributor}</>}
            title="Total Reatil Distributor"
          />
        </CCol> */}
        {/* </CRow> */}
        {/* <h4>Sales Coordinator</h4> */}
        {/* <CRow> */}
        {/* <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{salescoordinator}</>}
            title="Total Sales Coordinator"
          />
        </CCol> */}
        {/* </CRow> */}
        {/* <h4>Territory Manager</h4> */}
        {/* <CRow> */}
        {/* <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{territorymanager}</>}
            title="Total Territory Manager"
          />
        </CCol>
      </CRow> */}
      {/* <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{Requests.length}</>}
            title="Contact Requests"
          />
        </CCol> */}
      {/* <CCol sm={6} lg={3}>
        <CWidgetStatsA
          className="mb-4"
          color="warning"
          value={
            <>
              {requirement.length}

            </>
          }
          title="Requirements"

        />
      </CCol>
      <CCol sm={6} lg={3}>
        <CWidgetStatsA
          className="mb-4"
          color="danger"
          value={
            <>
              {news.length}

            </>
          }
          title="Total News"

        />
      </CCol>
      <CCol sm={6} lg={3}>
        <CWidgetStatsA
          className="mb-4"
          color="success"
          value={
            <>
              {offer.length}

            </>
          }
          title="Total Offers"

        />
      </CCol>
      <CCol sm={6} lg={3}>
        <CWidgetStatsA
          className="mb-4"
          color="dark"
          value={
            <>
              {event.length}

            </>
          }
          title="Total Events"

        /> */}
      {/* </CCol> */}
      {/* </CRow> */}
      <h4>Services, Categories and Outlets</h4>
      <CRow>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{services}</>}
            title="Total services"
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{category}</>}
            title="Total Categories"
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{outlets}</>}
            title="Total Outlets"
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{orders}</>}
            title="Total Orders"
          />
        </CCol>
        {/* <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{Brand}</>}
            title="Total Brands"
          />
        </CCol> */}
      </CRow>
      {/* <h4>Orders</h4>
      <CRow>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{orders.length}</>}
            title="Total orders"
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{todayorders.length}</>}
            title={`Orders for ${formattedDate}`}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{monthorders.length}</>}
            title={`Orders for ${formattedmonth}`}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{yearorders.length}</>}
            title={`Orders for ${year}`}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={<>{lastyearorders.length}</>}
            title={`Orders for ${year - 1}`}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="dark"
            value={<>{processingorders.length}</>}
            title="Orders - Processing"
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="warning"
            value={<>{dispatchedorders.length}</>}
            title="Orders - Dispatched"
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="success"
            value={<>{deliveredorders.length}</>}
            title="Orders - Delivered"
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="danger"
            value={<>{cancelledorders.length}</>}
            title="Orders - Cancelled"
          />
        </CCol> 
      </CRow> */}
    </>
  );
};

export default WidgetsDropdown;
