import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { Link, useNavigate, useParams } from "react-router-dom";
import swal from "sweetalert";
import axios from "axios";
import { isAutheticated } from "src/auth";
import { CFormSelect, CInputGroup } from "@coreui/react";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

const EditAppointment = () => {
  const token = isAutheticated();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [data, setData] = useState({
    doctorId: "",
    doctorName: "",
    date: "",
    time: "",
    patientName: "",
    patientPhone: "",
  });

  const [loading, setLoading] = useState(false);

  const getDoctors = () => {
    axios
      .get("/api/specialist/getall")
      .then((res) => {
        setDoctors(res.data.specialist);
      })
      .catch((err) => {
        swal("Error", "Could not get data", "error");
      });
  };

  useEffect(() => {
    getDoctors();
  }, []);

  // doctor options with placeholder select doctor
  const doctorOptions = [
    ...doctors.map((doctor) => ({
      label: doctor.specialistName,
      value: doctor._id,
    })),
  ];

  // reusable to get weekdays from index and vice-versa
  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const getWeekday = (index) => {
    return weekdays[index];
  };
  const getWeekdayIndex = (day) => {
    return weekdays.indexOf(day);
  };

  const [availableDays, setAvailableDays] = useState([]);

  const [filterDay, setFilterDay] = useState([]);

  const [perPatientTime, setPerPatientTime] = useState();

  const [currentAppointment, setCurrentAppointment] = useState({});

  const { id } = useParams();

  // get appointment by id
  const getAppointment = () => {
    setLoading(true);
    axios
      .get(`/api/appointment/get/${id}`)
      .then((res) => {
        const appointment = res.data.appointment;

        appointment.date = new Date(appointment.date).toISOString("en-IN");
        appointment.time = new Date(appointment.time).toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        );

        setCurrentAppointment(appointment);
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

  useEffect(() => {
    setData((prev) => ({
      ...prev,
      //doctorId: currentAppointment.doctorId,
      //doctorName: currentAppointment.doctorName,
      //date: currentAppointment.date,
      ///time: currentAppointment.time,
      patientName: currentAppointment.patientName,
      patientPhone: currentAppointment.patientPhone,
    }));
  }, [currentAppointment]);

  // handle doctor change
  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    const doctor = doctors.find((doctor) => doctor._id === doctorId);
    //filter available days for selected Doctor
    const availableDays = doctor.daysAvailable.filter(
      (day) => day.available === true
    );
    // filter day number with available days for Date picker
    const filterDay = availableDays.map((day) => {
      return getWeekdayIndex(day.label);
    });
    setFilterDay(filterDay);
    setPerPatientTime(doctor.perPatientTime);
    setAvailableDays(availableDays);
    setData((prev) => ({
      ...prev,
      doctorId: doctorId,
      doctorName: doctor.specialistName,
      date: "",
      time: "",
    }));
  };

  // find selected day from available days
  const findSelectedDay = (day) => {
    const selectedDay = availableDays.filter((days) => days.label === day);
    return selectedDay;
  };

  const [timeOptions, setTimeOptions] = useState([]);

  // create time options with label and value from timeSlots array
  // const createTimeOptions = (timeSlots, patientTime) => {
  //   // create time interval of perPatientTime min from start time to end time and push it to timeOptions array with label and value
  // };

  const createTimeOptions = (timeSlots, patientTime) => {
    const timeOptions = [];

    timeSlots.forEach((timeSlot) => {
      const startTime = new Date(`January 1, 2022 ${timeSlot.startTime}`);
      const endTime = new Date(`January 1, 2022 ${timeSlot.endTime}`);

      // Create time intervals of 'patientTime' minutes from start time to end time
      let intervalTime = startTime;
      while (intervalTime < endTime) {
        const intervalEnd = new Date(
          intervalTime.getTime() + patientTime * 60000
        );
        const timeLabel = `${intervalTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })} - ${intervalEnd.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
        const timeValue = intervalTime.toISOString();
        timeOptions.push({ label: timeLabel, value: timeValue });
        intervalTime = intervalEnd;
      }
    });

    return timeOptions;
  };

  // handle date change
  const handleDateChange = async (date) => {
    const day = getWeekday(date.getDay());
    const selectedDay = findSelectedDay(day);

    const timeOptions = await createTimeOptions(
      selectedDay[0].timeSlots,
      perPatientTime
    );
    await setTimeOptions(timeOptions);
    setData((prev) => ({
      ...prev,
      date: date,
      time: "",
    }));
  };

  //   0
  // :
  // endTime
  // :
  // "20:39"
  // startTime
  // :
  // "18:37"
  // _id
  // :
  // "642a9679d243d8ac7d51fa75

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = () => {
    if (
      data.doctorName.trim() === "" ||
      data.date === "" ||
      data.time === "" ||
      data.patientName.trim() === "" ||
      data.patientPhone.trim() === ""
    ) {
      swal({
        title: "Warning",
        text: "Fill all mandatory fields",
        icon: "error",
        button: "Close",
        dangerMode: true,
      });
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.set("doctorId", data.doctorId);
    formData.set("doctorName", data.doctorName);
    formData.set("date", data.date);
    formData.set("time", data.time);
    formData.set("patientName", data.patientName);
    formData.set("patientPhone", data.patientPhone);

    axios
      .patch(`/api/appointment/update/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/formdata",
          "Access-Control-Allow-Origin": "*",
        },
      })
      .then((res) => {
        swal({
          title: "Updated",
          text: "appointment updated successfully!",
          icon: "success",
          button: "ok",
        });
        setLoading(false);
        navigate("/appointments", { replace: true });
      })
      .catch((err) => {
        setLoading(false);
        const message = err.response?.data?.message || "Something went wrong!";
        swal({
          title: "Warning",
          text: message,
          icon: "error",
          button: "Retry",
          dangerMode: true,
        });
      });
  };

  return (
    <div className="container">
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
              Edit Appointment
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <h4 className="mb-0"></h4>
            </div>

            <div className="page-title-right">
              <Button
                variant="contained"
                color="primary"
                style={{
                  fontWeight: "bold",
                  marginBottom: "1rem",
                  textTransform: "capitalize",
                  marginRight: "5px",
                }}
                onClick={() => handleSubmit()}
                disabled={loading}
              >
                {loading ? "Loading" : "Save"}
              </Button>
              <Link to="/appointments">
                <Button
                  variant="contained"
                  color="secondary"
                  style={{
                    fontWeight: "bold",
                    marginBottom: "1rem",
                    textTransform: "capitalize",
                  }}
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12 col-md-12  col-sm-12 my-1">
          <div className="card h-100">
            <div className="card-body px-5">
              <div className="mb-3">
                <label htmlFor="doctorName" className="form-label">
                  Doctor Name *
                </label>

                <select
                  type="select"
                  className="form-control"
                  id="doctorName"
                  name="doctorName"
                  onChange={(e) => handleDoctorChange(e)}
                  options={doctorOptions}
                >
                  <option hidden>Select Doctor</option>
                  {doctorOptions.map((doctor) => (
                    <option value={doctor.value} key={doctor.label}>
                      {doctor.label}
                    </option>
                  ))}
                </select>
              </div>

              {data.doctorId && (
                <div className="mb-3">
                  <label htmlFor="date" className="form-label">
                    Date *
                  </label>
                  <DatePicker
                    type="date"
                    className="form-control"
                    id="date"
                    name="date"
                    selected={data.date}
                    onChange={(e) => handleDateChange(e)}
                    dateFormat="dd/MM/yyyy"
                    minDate={new Date()}
                    placeholderText="Select a date"
                    filterDate={(date) => {
                      return filterDay.includes(date.getDay());
                    }}
                  />
                </div>
              )}

              {data.date && (
                <div className="mb-3">
                  <label htmlFor="time" className="form-label">
                    Time *
                  </label>
                  <select
                    type="select"
                    className="form-control"
                    id="time"
                    name="time"
                    value={data.time}
                    options={timeOptions}
                    onChange={(e) => handleChange(e)}
                  >
                    <option hidden>Select Time</option>
                    {timeOptions.map((time) => (
                      <option value={time.value} key={time.label}>
                        {time.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="patientName" className="form-label">
                  Patient Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="patientName"
                  value={data.patientName}
                  placeholder="Enter Patient Name"
                  maxLength="100"
                  onChange={(e) => handleChange(e)}
                ></input>
                {data.patientName ? (
                  <>
                    <small className="charLeft mt-4 fst-italic">
                      {100 - data.patientName.length} characters left
                    </small>
                  </>
                ) : (
                  <></>
                )}
              </div>
              <div className="mb-3">
                <label htmlFor="patientPhone" className="form-label">
                  Patient Phone *
                </label>
                <input
                  type="tel"
                  className="form-control"
                  id="patientPhone"
                  value={data.patientPhone}
                  placeholder="Enter Patient Phone"
                  maxLength="10"
                  onChange={(e) => handleChange(e)}
                ></input>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAppointment;
