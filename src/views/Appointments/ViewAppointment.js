import axios from "axios";
import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@mui/material/Button";

const ViewAppointment = () => {
  const [appointmentData, setAppointmentData] = useState();

  const [loading, setLoading] = useState(false);

  const { id } = useParams();

  const getAppointment = () => {
    setLoading(true);
    axios
      .get(`/api/appointment/get/${id}`)
      .then(async (res) => {
        res.data.appointment.date = await new Date(
          res.data.appointment?.date
        ).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        // add leading zeros to single digit dates
        res.data.appointment.date = await res.data.appointment.date.replace(
          /(\d{1,2})\s(\w{3})\s(\d{4})/,
          function (match, day, month, year) {
            return `${day.padStart(2, "0")} ${month} ${year}`;
          }
        );
        setAppointmentData(res.data.appointment);
        setLoading(false);
      })
      .catch((err) => {
        swal("Error", "Could not get data", "error");
        setLoading(false);
      });
  };

  useEffect(() => {
    getAppointment();
  }, []);

  const navigate = useNavigate();

  return (
    <div>
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
            Appointment
          </div>

          <div className="page-title-right">
            <Button
              variant="contained"
              color="primary"
              style={{
                fontWeight: "bold",
                marginBottom: "1rem",
                textTransform: "capitalize",
              }}
              onClick={() => {
                navigate("/appointments/", { replace: true });
              }}
            >
              Back
            </Button>
          </div>
        </div>
      </div>

      {loading && <div>Loading...</div>}
      {!loading && !appointmentData && <div>No data found</div>}
      {!loading && appointmentData && (
        <div>
          <table className="table table-striped">
            <tbody>
              <tr>
                <th scope="col">Appointment ID</th>
                <td>{appointmentData?._id}</td>
              </tr>
              <tr>
                <th scope="col">Appointment Number</th>
                <td>{appointmentData?.appointmentNumber}</td>
              </tr>
              <tr>
                <th scope="col">Patient Name</th>
                <td>{appointmentData?.patientName}</td>
              </tr>
              <tr>
                <th scope="col">Patient Phone</th>
                <td>{appointmentData?.patientPhone}</td>
              </tr>
              <tr>
                <th scope="col">Doctor Name</th>
                <td>{appointmentData?.doctorName}</td>
              </tr>
              <tr>
                <th scope="col">Appointment Date</th>
                <td>
                  {appointmentData?.date ? (
                    appointmentData?.date
                  ) : (
                    <span className="text-danger">Not Set</span>
                  )}
                </td>
              </tr>
              <tr>
                <th scope="col">Appointment Time</th>
                <td>
                  {new Date(appointmentData?.time).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                </td>
              </tr>
              <tr>
                <th scope="col">Appointment Created</th>
                <td>
                  {new Date(appointmentData?.createdAt).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",

                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewAppointment;
