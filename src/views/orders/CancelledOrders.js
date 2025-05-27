// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import axios from "axios";
// import { isAutheticated } from "src/auth";

// function CancelledOrders() {
//   const token = isAutheticated();
//   const [loading, setLoading] = useState(true);
//   const [success, setSuccess] = useState(true);
//   const [cancelledOrdersData, setCancelledOrdersData] = useState([]);

//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemPerPage, setItemPerPage] = useState(10);
//   const [showData, setShowData] = useState(cancelledOrdersData);

//   const handleShowEntries = (e) => {
//     setCurrentPage(1);
//     setItemPerPage(e.target.value);
//   };

//   useEffect(() => {
//     function getProcessingOrder() {
//       axios
//         .get(`/api/order/getAll/cancelled`, {
//           headers: {
//             "Access-Control-Allow-Origin": "*",
//             Authorization: `Bearer ${token}`,
//           },
//         })
//         .then((res) => {
//           setCancelledOrdersData(res.data.order);
//           setLoading(false);
//         })
//         .catch((err) => {
//           console.log(err);
//           setLoading(false);
//         });
//     }
//     getProcessingOrder();
//   }, []);

//   useEffect(() => {
//     const loadData = () => {
//       const indexOfLastPost = currentPage * itemPerPage;
//       const indexOfFirstPost = indexOfLastPost - itemPerPage;
//       setShowData(cancelledOrdersData.slice(indexOfFirstPost, indexOfLastPost));
//     };
//     loadData();
//   }, [currentPage, itemPerPage, cancelledOrdersData]);

//   return (
//     <div className="main-content">
//       <div className="page-content">
//         <div className="container-fluid">
//           <div className="row">
//             <div className="col-12">
//               <div
//                 className="
//                     page-title-box
//                     d-flex
//                     align-items-center
//                     justify-content-between
//                   "
//               >
//                 <div style={{ fontSize: "22px" }} className="fw-bold">
//                   Cancelled Orders
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="row">
//             <div className="col-lg-12">
//               <div className="card">
//                 <div className="card-body">
//                   <div className="row ml-0 mr-0 mb-10">
//                     <div className="col-sm-12 col-md-12">
//                       <div className="dataTables_length">
//                         <label className="w-100">
//                           Show
//                           <select
//                             style={{ width: "10%" }}
//                             name=""
//                             onChange={(e) => handleShowEntries(e)}
//                             className="
//                                 select-w
//                                 custom-select custom-select-sm
//                                 form-control form-control-sm
//                               "
//                           >
//                             <option value="10">10</option>
//                             <option value="25">25</option>
//                             <option value="50">50</option>
//                             <option value="100">100</option>
//                           </select>
//                           entries
//                         </label>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="table-responsive table-shoot mt-3">
//                     <table
//                       className="table table-centered table-nowrap"
//                       style={{ border: "1px solid" }}
//                     >
//                       <thead
//                         className="thead-light"
//                         style={{ background: "#ecdddd" }}
//                       >
//                         <tr>
//                           <th className="text-start">Order ID</th>
//                           <th className="text-start">Customer</th>
//                           <th className="text-start">Order value</th>
//                           <th className="text-start">Order At</th>
//                           <th className="text-start">Status</th>
//                           <th className="text-start">Actions</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {!loading && showData.length === 0 && (
//                           <tr className="text-center">
//                             <td colSpan="6">
//                               <h5>No Data Available</h5>
//                             </td>
//                           </tr>
//                         )}
//                         {loading ? (
//                           <tr>
//                             <td className="text-center" colSpan="6">
//                               Loading...
//                             </td>
//                           </tr>
//                         ) : (
//                           showData.map((order, i) => {
//                             return (
//                               <tr key={i}>
//                                 <td className="text-start">{order?.orderID}</td>
//                                 <td className="text-start">
//                                   {order?.user?.name}
//                                 </td>
//                                 <td className="text-start">
//                                   ₹{order?.total_amount}
//                                 </td>
//                                 <td className="text-start">
//                                   {new Date(order?.paidAt).toLocaleString(
//                                     "en-IN",
//                                     {
//                                       month: "short",
//                                       day: "numeric",
//                                       year: "numeric",
//                                       hour: "2-digit",
//                                       minute: "numeric",
//                                       hour12: true,
//                                     }
//                                   )}
//                                 </td>
//                                 <td className="text-start">
//                                   <span className="badge text-bg-danger text-white">
//                                     {order?.orderStatus}
//                                   </span>
//                                 </td>
//                                 <td className="text-start">
//                                   {/* <Link to={`/orders/${order.orderStatus}/${order._id}`}> */}
//                                   <Link
//                                     to={`/orders/${order.orderStatus}/${order._id}`}
//                                   >
//                                     <button
//                                       style={{ color: "white" }}
//                                       type="button"
//                                       className="
//                                       btn btn-primary btn-sm
//                                     waves-effect waves-light
//                                     btn-table
//                                     ms-2 mt-1
//                                   "
//                                     >
//                                       View
//                                     </button>
//                                   </Link>
//                                 </td>
//                               </tr>
//                             );
//                           })
//                         )}
//                       </tbody>
//                     </table>
//                   </div>

//                   <div className="row mt-20">
//                     <div className="col-sm-12 col-md-6 mb-20">
//                       <div
//                         className="dataTables_info"
//                         id="datatable_info"
//                         role="status"
//                         aria-live="polite"
//                       >
//                         Showing {currentPage * itemPerPage - itemPerPage + 1} to{" "}
//                         {Math.min(
//                           currentPage * itemPerPage,
//                           cancelledOrdersData.length
//                         )}{" "}
//                         of {cancelledOrdersData.length} entries
//                       </div>
//                     </div>

//                     <div className="col-sm-12 col-md-6">
//                       <div className="d-flex">
//                         <ul className="pagination ms-auto">
//                           <li
//                             className={
//                               currentPage === 1
//                                 ? "paginate_button page-item previous disabled"
//                                 : "paginate_button page-item previous"
//                             }
//                           >
//                             <span
//                               className="page-link"
//                               style={{ cursor: "pointer" }}
//                               onClick={() => setCurrentPage((prev) => prev - 1)}
//                             >
//                               Previous
//                             </span>
//                           </li>

//                           {!(currentPage - 1 < 1) && (
//                             <li className="paginate_button page-item">
//                               <span
//                                 className="page-link"
//                                 style={{ cursor: "pointer" }}
//                                 onClick={(e) =>
//                                   setCurrentPage((prev) => prev - 1)
//                                 }
//                               >
//                                 {currentPage - 1}
//                               </span>
//                             </li>
//                           )}

//                           <li className="paginate_button page-item active">
//                             <span
//                               className="page-link"
//                               style={{ cursor: "pointer" }}
//                             >
//                               {currentPage}
//                             </span>
//                           </li>

//                           {!(
//                             (currentPage + 1) * itemPerPage - itemPerPage >
//                             cancelledOrdersData.length - 1
//                           ) && (
//                             <li className="paginate_button page-item ">
//                               <span
//                                 className="page-link"
//                                 style={{ cursor: "pointer" }}
//                                 onClick={() => {
//                                   setCurrentPage((prev) => prev + 1);
//                                 }}
//                               >
//                                 {currentPage + 1}
//                               </span>
//                             </li>
//                           )}

//                           <li
//                             className={
//                               !(
//                                 (currentPage + 1) * itemPerPage - itemPerPage >
//                                 cancelledOrdersData.length - 1
//                               )
//                                 ? "paginate_button page-item next"
//                                 : "paginate_button page-item next disabled"
//                             }
//                           >
//                             <span
//                               className="page-link"
//                               style={{ cursor: "pointer" }}
//                               onClick={() => setCurrentPage((prev) => prev + 1)}
//                             >
//                               Next
//                             </span>
//                           </li>
//                         </ul>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default CancelledOrders;

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TablePagination,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Skeleton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { isAutheticated } from "src/auth";

const CancelledOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchField, setSearchField] = useState("Order ID");
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();
  const token = isAutheticated();

  // Fetch orders with pagination
  const fetchOrders = async (page, limit) => {
    setLoading(true);
    try {
      const response = await axios.get("/api/get-cancelled-order-admin", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: page + 1, // Adjusting for zero-based index in the UI
          limit,
          searchField,
          searchText,
        },
      });
      // console.log(response);
      setOrders(response?.data?.cancelledOrders);
      setTotalOrders(response?.data?.totalOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page, rowsPerPage);
  }, [page, rowsPerPage, searchField, searchText]);

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  const handleSearchFieldChange = (event) => {
    setSearchField(event.target.value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredOrders = orders?.filter((order) => {
    if (searchField === "Order ID") {
      return order.uniqueId.toLowerCase().includes(searchText.toLowerCase());
    }
    if (searchField === "Status") {
      return order.status.toLowerCase().includes(searchText.toLowerCase());
    }
    return true;
  });

  return (
    <Box>
      <Typography variant="h4" mb={2} textAlign="center">
        Cancelled Order Placed List
      </Typography>
      <Box display="flex" mb={2} alignItems="center">
        <FormControl variant="outlined" sx={{ minWidth: 150, mr: 2 }}>
          <InputLabel id="search-field-label">Search By</InputLabel>
          <Select
            labelId="search-field-label"
            id="search-field"
            value={searchField}
            onChange={handleSearchFieldChange}
            label="Search By"
          >
            <MenuItem value="Order ID">Order ID</MenuItem>
            <MenuItem value="Status">Status</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label={`Search by ${searchField}`}
          variant="outlined"
          value={searchText}
          onChange={handleSearchChange}
          fullWidth
        />
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Order Value</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from(new Array(rowsPerPage)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <Skeleton height={40} />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{order.uniqueId}</TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toDateString()}
                    <span>, {formatAMPM(order.createdAt)}</span>
                  </TableCell>
                  <TableCell>{order.orderItem.length}</TableCell>
                  <TableCell>₹ {order.grandTotal.toFixed(2)}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() =>
                        navigate(`/orders/${order.status}/${order._id}`)
                      }
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1">Data not found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalOrders}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

// Helper function to format time as AM/PM
const formatAMPM = (date) => {
  var hours = new Date(date).getHours();
  var minutes = new Date(date).getMinutes();
  var ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  var strTime = hours + ":" + minutes + " " + ampm;
  return strTime;
};

export default CancelledOrders;
