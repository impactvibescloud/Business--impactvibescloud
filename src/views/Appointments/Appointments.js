import axios from "axios";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAutheticated } from "../../auth";
import Button from "@mui/material/Button";
import { Link } from "@mui/material";
import {
  DataGrid,
  GridCellProps,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import CIcon from "@coreui/icons-react";
import { cilTrash } from "@coreui/icons";

const Appointments = () => {
  const token = isAutheticated();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(true);
  const [AppointmentData, setAppointmentData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [showData, setShowData] = useState(AppointmentData);

  const handleShowEntries = (e) => {
    setCurrentPage(1);
    setItemPerPage(e.target.value);
  };

  const getAppointmentData = async () => {
    axios
      .get(`/api/appointment/getAll/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        // convert date from utc to local

        const appointments = res.data.appointments;

        appointments.forEach((item) => {
          //convert date from utc to local and make it in dd/mm/yyyy format month is in short form like jan,feb and add 0 before single digit date like 01,02
          item.date = new Date(item.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          // add leading zeros to single digit dates
          item.date = item.date.replace(
            /(\d{1,2})\s(\w{3})\s(\d{4})/,
            function (match, day, month, year) {
              return `${day.padStart(2, "0")} ${month} ${year}`;
            }
          );

          //convert time from utc to local till minutes
          item.time = new Date(item.time).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          });
        });

        // sort by date
        // appointments.sort((a, b) => {
        //   return new Date(b.date) - new Date(a.date);
        // });

        // sort by date in descending order
        appointments.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        setAppointmentData(appointments);

        setLoading(false);
      })

      .catch((err) => {
        setLoading(false);
      });
  };

  // create columns for data grid table from appointment data
  const columns = [
    {
      field: "doctorName",
      headerName: "Doctor Name",
      minWidth: 180,
      flex: 1,
      editable: false,
    },
    {
      field: "patientName",
      headerName: "Patient Name",
      minWidth: 150,
      flex: 1,
      editable: false,
    },
    {
      field: "patientPhone",
      headerName: "Patient Phone",
      minWidth: 150,
      flex: 1,
      editable: false,
    },
    {
      field: "date",
      headerName: "Date",
      minWidth: 120,
      flex: 1,
      editable: false,
    },
    {
      field: "time",
      headerName: "Time",
      minWidth: 110,
      flex: 1,
      editable: false,
    },

    {
      field: "action",
      headerName: "Action",
      minWidth: 180,
      flex: 1,
      // view edit and delete
      renderCell: (params) => {
        return (
          <div>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleView(params.row._id)}
            >
              View
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    getAppointmentData();
  }, [success]);

  useEffect(() => {
    const loadData = () => {
      const indexOfLastPost = currentPage * itemPerPage;
      const indexOfFirstPost = indexOfLastPost - itemPerPage;
      setShowData(AppointmentData.slice(indexOfFirstPost, indexOfLastPost));
    };
    loadData();
  }, [currentPage, itemPerPage, AppointmentData]);

  // create rows for data grid table from appointment data
  const rows = showData.map((item, index) => {
    return {
      id: index + 1,
      appointmentNumber: item.appointmentNumber,
      _id: item._id,
      doctorName: item.doctorName,
      date: item.date,
      time: item.time,
      patientName: item.patientName,
      patientPhone: item.patientPhone,
    };
  });

  const handleDelete = (id) => {
    swal({
      title: "Are you sure?",
      icon: "error",
      buttons: {
        Yes: { text: "Yes", value: true },
        Cancel: { text: "Cancel", value: "cancel" },
      },
    }).then((value) => {
      if (value === true) {
        axios
          .delete(`/api/appointment/delete/${id}`, {
            headers: {
              "Access-Control-Allow-Origin": "*",
              Authorization: `Bearer ${token}`,
            },
          })
          .then((res) => {
            swal({
              title: "Success",
              text: "Appointment deleted successfully!",
              icon: "success",
              button: "Ok",
            });
            setSuccess((prev) => !prev);
          })
          .catch((err) => {
            swal({
              title: "Warning",
              text: "Something went wrong!",
              icon: "error",
              button: "Retry",
              dangerMode: true,
            });
          });
      }
    });
  };

  const handleView = (id) => {
    navigate(`/appointment/view/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/appointment/edit/${id}`);
  };

  const handleSearch = (e) => {
    const searchValue = e.target.value;
    const filteredData = AppointmentData.filter((item) => {
      return (
        item.appointmentNumber
          .toLowerCase()
          .includes(searchValue.toLowerCase()) ||
        item.doctorName.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.patientName.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.patientPhone.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.date.toLowerCase().includes(searchValue.toLowerCase())
      );
    });
    setShowData(filteredData);
  };

  // const handlePageChange = (e, page) => {
  //   setCurrentPage(page);
  // };

  function compareDates(a, b) {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA < dateB) {
      return -1;
    }
    if (dateA > dateB) {
      return 1;
    }
    return 0;
  }

  const initialSortModel = [
    {
      field: "date",
      sort: "asc",
    },
  ];

  const getRowClassName = (params) => {
    // get row date and current date in same format and compare
    const rowDate = new Date(params.row.date);
    const currentDate = new Date().setHours(0, 0, 0, 0);

    if (rowDate < currentDate) {
      return "past-row";
    }

    // if (params.row.id === 2) {
    //   return "highlighted-row";
    // }
    return "";
  };

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div
                className="
                    page-title-box
                    d-flex
                    align-items-center
                    justify-content-between
                  "
              >
                <div style={{ fontSize: "22px" }} className="fw-bold">
                  Appointments
                </div>

                {/*<div className="page-title-right">
                  <Button
                    variant="contained"
                    color="primary"
                    style={{
                      fontWeight: "bold",
                      marginBottom: "1rem",
                      textTransform: "capitalize",
                    }}
                    onClick={() => {
                      navigate("/appointment/new", { replace: true });
                    }}
                  >
                    Add New Appointment
                  </Button>
                </div>
                  */}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-12">
              <div className="card">
                <div className="card-body">
                  <div className="row ml-0 mr-0 mb-10">
                    <div className="col-sm-12 col-md-12">
                      <div className="dataTables_length">
                        <label className="w-100">
                          Show entries
                          <select
                            style={{ width: "10%" }}
                            name=""
                            onChange={(e) => handleShowEntries(e)}
                            className="
                                select-w
                                custom-select custom-select-sm
                                form-control form-control-sm
                              "
                          >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>

                  {!loading ? (
                    <div className="row mt-20">
                      <div className="col-sm-12 col-md-12">
                        <div className="dataTables_length">
                          <label className="w-100">
                            Search
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Search by doctor name, patient name, patient phone, date"
                              onChange={(e) => handleSearch(e)}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div style={{ height: 400, width: "100%" }}>
                    <DataGrid
                      getRowHeight={() => "auto"}
                      columns={columns}
                      rows={rows}
                      pageSize={itemPerPage}
                      rowCount={AppointmentData.length}
                      className="table-responsive"
                      getRowClassName={getRowClassName}
                      sx={{
                        "& .MuiDataGrid-cell": {
                          display: "block",
                        },
                        ".MuiDataGrid-root .MuiDataGrid-cell": {
                          whiteSpace: "normal",
                          wordWrap: "breakWord",
                        },
                      }}
                      initialState={{
                        ...rows.initialState,
                        sorting: {
                          ...rows.initialState?.sorting,
                          sortModel: [
                            {
                              field: "date",
                              sort: "desc",
                            },
                          ],
                          sortComparator: { compareDates },
                        },
                      }}
                      {...rows}
                    />
                  </div>

                  <div className="row mt-20">
                    <div className="col-sm-12 col-md-6 mb-20">
                      <div
                        className="dataTables_info"
                        id="datatable_info"
                        role="status"
                        aria-live="polite"
                      >
                        Showing {currentPage * itemPerPage - itemPerPage + 1} to{" "}
                        {Math.min(
                          currentPage * itemPerPage,
                          AppointmentData.length
                        )}{" "}
                        of {AppointmentData.length} entries
                      </div>
                    </div>

                    <div className="col-sm-12 col-md-6">
                      <div className="d-flex">
                        <ul className="pagination ms-auto">
                          <li
                            className={
                              currentPage === 1
                                ? "paginate_button page-item previous disabled"
                                : "paginate_button page-item previous"
                            }
                          >
                            <span
                              className="page-link"
                              style={{ cursor: "pointer" }}
                              onClick={() => setCurrentPage((prev) => prev - 1)}
                            >
                              Previous
                            </span>
                          </li>

                          {!(currentPage - 1 < 1) && (
                            <li className="paginate_button page-item">
                              <span
                                className="page-link"
                                style={{ cursor: "pointer" }}
                                onClick={(e) =>
                                  setCurrentPage((prev) => prev - 1)
                                }
                              >
                                {currentPage - 1}
                              </span>
                            </li>
                          )}

                          <li className="paginate_button page-item active">
                            <span
                              className="page-link"
                              style={{ cursor: "pointer" }}
                            >
                              {currentPage}
                            </span>
                          </li>

                          {!(
                            (currentPage + 1) * itemPerPage - itemPerPage >
                            AppointmentData.length - 1
                          ) && (
                            <li className="paginate_button page-item ">
                              <span
                                className="page-link"
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                  setCurrentPage((prev) => prev + 1);
                                }}
                              >
                                {currentPage + 1}
                              </span>
                            </li>
                          )}

                          <li
                            className={
                              !(
                                (currentPage + 1) * itemPerPage - itemPerPage >
                                AppointmentData.length - 1
                              )
                                ? "paginate_button page-item next"
                                : "paginate_button page-item next disabled"
                            }
                          >
                            <span
                              className="page-link"
                              style={{ cursor: "pointer" }}
                              onClick={() => setCurrentPage((prev) => prev + 1)}
                            >
                              Next
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
