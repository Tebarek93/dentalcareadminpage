import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  UserRound,
  Stethoscope,
  X,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function Schedule() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedDate, setSelectedDate] = useState(
    formatDate(new Date())
  );

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [view, setView] = useState("day");

  // ==========================================
  // LOAD DATA
  // ==========================================

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        appointmentsResult,
        doctorsResult,
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select("*")
          .order("appointment_time", {
            ascending: true,
          }),

        supabase
          .from("doctors")
          .select("*")
          .order("full_name", {
            ascending: true,
          }),
      ]);

      if (appointmentsResult.error) {
        throw appointmentsResult.error;
      }

      if (doctorsResult.error) {
        throw doctorsResult.error;
      }

      setAppointments(appointmentsResult.data || []);
      setDoctors(doctorsResult.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Unable to load schedule."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  // ==========================================
  // DATE HELPERS
  // ==========================================

  function formatDate(date) {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function parseDate(dateString) {
    const [year, month, day] =
      dateString.split("-").map(Number);

    return new Date(
      year,
      month - 1,
      day
    );
  }

  function changeDate(days) {
    const date = parseDate(selectedDate);

    date.setDate(
      date.getDate() + days
    );

    setSelectedDate(
      formatDate(date)
    );
  }

  function goToday() {
    setSelectedDate(
      formatDate(new Date())
    );
  }

  // ==========================================
  // WEEK DATES
  // ==========================================

  const weekDates = useMemo(() => {
    const date = parseDate(selectedDate);

    const day = date.getDay();

    const mondayOffset =
      day === 0 ? -6 : 1 - day;

    const monday = new Date(date);

    monday.setDate(
      date.getDate() + mondayOffset
    );

    return Array.from(
      { length: 7 },
      (_, index) => {
        const current = new Date(
          monday
        );

        current.setDate(
          monday.getDate() + index
        );

        return {
          date: formatDate(current),
          dayName: current.toLocaleDateString(
            "en-US",
            {
              weekday: "short",
            }
          ),
          dayNumber: current.getDate(),
        };
      }
    );
  }, [selectedDate]);

  // ==========================================
  // FILTER APPOINTMENTS
  // ==========================================

  const dayAppointments = useMemo(() => {
    return appointments
      .filter(
        (appointment) =>
          appointment.appointment_date ===
          selectedDate
      )
      .sort((a, b) =>
        String(
          a.appointment_time || ""
        ).localeCompare(
          String(
            b.appointment_time || ""
          )
        )
      );
  }, [
    appointments,
    selectedDate,
  ]);

  // ==========================================
  // STATISTICS
  // ==========================================

  const todayCount =
    dayAppointments.length;

  const scheduledCount =
    dayAppointments.filter(
      (item) =>
        item.status === "scheduled" ||
        item.status === "confirmed"
    ).length;

  const completedCount =
    dayAppointments.filter(
      (item) =>
        item.status === "completed"
    ).length;

  const cancelledCount =
    dayAppointments.filter(
      (item) =>
        item.status === "cancelled"
    ).length;

  // ==========================================
  // DOCTOR NAME
  // ==========================================

  const getDoctorName = (
    doctorId
  ) => {
    const doctor = doctors.find(
      (item) =>
        String(item.id) ===
        String(doctorId)
    );

    return (
      doctor?.full_name ||
      "Unknown Doctor"
    );
  };

  // ==========================================
  // STATUS STYLE
  // ==========================================

  const getStatusStyle = (
    status
  ) => {
    switch (
      String(status || "").toLowerCase()
    ) {
      case "confirmed":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";

      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";

      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (
    time
  ) => {
    if (!time) {
      return "--:--";
    }

    const [hour, minute] =
      String(time)
        .split(":")
        .map(Number);

    if (
      Number.isNaN(hour) ||
      Number.isNaN(minute)
    ) {
      return time;
    }

    const date = new Date();

    date.setHours(
      hour,
      minute,
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  // ==========================================
  // FORMAT DATE TITLE
  // ==========================================

  const formattedSelectedDate =
    parseDate(
      selectedDate
    ).toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-slate-500">
              Loading schedule...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Schedule
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage and view your clinic appointment schedule.
          </p>
        </div>

        <button
          onClick={fetchSchedule}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw size={17} />

          Refresh
        </button>
      </div>

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ======================================
          STATISTICS
      ====================================== */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Today's Appointments"
          value={todayCount}
          icon={<CalendarDays size={21} />}
          iconClass="bg-blue-100 text-blue-600"
        />

        <StatCard
          title="Scheduled"
          value={scheduledCount}
          icon={<Clock size={21} />}
          iconClass="bg-amber-100 text-amber-600"
        />

        <StatCard
          title="Completed"
          value={completedCount}
          icon={<UserRound size={21} />}
          iconClass="bg-emerald-100 text-emerald-600"
        />

        <StatCard
          title="Cancelled"
          value={cancelledCount}
          icon={<X size={21} />}
          iconClass="bg-red-100 text-red-600"
        />

      </div>

      {/* ======================================
          CALENDAR CARD
      ====================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ====================================
            CALENDAR HEADER
        ==================================== */}

        <div className="border-b border-slate-200 p-4 sm:p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-2">

              <button
                onClick={() =>
                  changeDate(-1)
                }
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={goToday}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Today
              </button>

              <button
                onClick={() =>
                  changeDate(1)
                }
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              >
                <ChevronRight size={18} />
              </button>

            </div>

            <div className="text-center">

              <h2 className="text-lg font-bold text-slate-900">
                {formattedSelectedDate}
              </h2>

            </div>

            <div className="flex justify-center rounded-lg bg-slate-100 p-1">

              <button
                onClick={() =>
                  setView("day")
                }
                className={`rounded-md px-4 py-2 text-sm font-semibold ${
                  view === "day"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Day
              </button>

              <button
                onClick={() =>
                  setView("week")
                }
                className={`rounded-md px-4 py-2 text-sm font-semibold ${
                  view === "week"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Week
              </button>

            </div>

          </div>

        </div>

        {/* ====================================
            WEEK VIEW
        ==================================== */}

        {view === "week" && (
          <div className="grid grid-cols-2 border-b border-slate-200 sm:grid-cols-4 lg:grid-cols-7">

            {weekDates.map(
              (item) => {

                const count =
                  appointments.filter(
                    (appointment) =>
                      appointment.appointment_date ===
                      item.date
                  ).length;

                const isSelected =
                  item.date ===
                  selectedDate;

                return (
                  <button
                    key={item.date}
                    onClick={() =>
                      setSelectedDate(
                        item.date
                      )
                    }
                    className={`border-b border-r border-slate-100 p-4 text-center transition ${
                      isSelected
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold uppercase ${
                        isSelected
                          ? "text-blue-600"
                          : "text-slate-400"
                      }`}
                    >
                      {item.dayName}
                    </p>

                    <p
                      className={`mt-1 text-xl font-bold ${
                        isSelected
                          ? "text-blue-700"
                          : "text-slate-900"
                      }`}
                    >
                      {item.dayNumber}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {count} appointment
                      {count !== 1
                        ? "s"
                        : ""}
                    </p>
                  </button>
                );
              }
            )}

          </div>
        )}

        {/* ====================================
            APPOINTMENTS
        ==================================== */}

        <div className="p-4 sm:p-6">

          {dayAppointments.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center text-center">

              <div className="rounded-full bg-blue-50 p-5 text-blue-600">
                <CalendarDays size={32} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                No appointments
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                There are no appointments scheduled for this date.
              </p>

            </div>
          ) : (
            <div className="space-y-3">

              {dayAppointments.map(
                (appointment) => (

                  <button
                    key={appointment.id}
                    onClick={() =>
                      setSelectedAppointment(
                        appointment
                      )
                    }
                    className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm sm:p-5"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

                      {/* TIME */}

                      <div className="flex shrink-0 items-center gap-3 lg:w-32 lg:flex-col lg:items-start">

                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                          <Clock size={20} />
                        </div>

                        <div>
                          <p className="font-bold text-slate-900">
                            {formatTime(
                              appointment.appointment_time
                            )}
                          </p>

                          <p className="text-xs text-slate-500">
                            Appointment
                          </p>
                        </div>

                      </div>

                      {/* DETAILS */}

                      <div className="flex-1 border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-bold text-slate-900">
                            {appointment.patient_name ||
                              "Patient"}
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                              appointment.status
                            )}`}
                          >
                            {appointment.status ||
                              "scheduled"}
                          </span>

                        </div>

                        <div className="mt-2 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:gap-5">

                          <span className="flex items-center gap-2">
                            <Stethoscope size={15} />

                            {getDoctorName(
                              appointment.doctor_id
                            )}
                          </span>

                          {appointment.service_name && (
                            <span>
                              {appointment.service_name}
                            </span>
                          )}

                        </div>

                      </div>

                      {/* ARROW */}

                      <ChevronRight
                        size={20}
                        className="hidden text-slate-300 transition group-hover:text-blue-500 lg:block"
                      />

                    </div>

                  </button>

                )
              )}

            </div>
          )}

        </div>

      </div>

      {/* ======================================
          DETAILS MODAL
      ====================================== */}

      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 p-5">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Appointment Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Appointment #{selectedAppointment.id}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedAppointment(
                    null
                  )
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            {/* BODY */}

            <div className="space-y-5 p-5">

              <InfoRow
                label="Date"
                value={
                  selectedAppointment.appointment_date ||
                  "Not provided"
                }
                icon={
                  <CalendarDays size={17} />
                }
              />

              <InfoRow
                label="Time"
                value={formatTime(
                  selectedAppointment.appointment_time
                )}
                icon={
                  <Clock size={17} />
                }
              />

              <InfoRow
                label="Patient"
                value={
                  selectedAppointment.patient_name ||
                  "Patient"
                }
                icon={
                  <UserRound size={17} />
                }
              />

              <InfoRow
                label="Doctor"
                value={getDoctorName(
                  selectedAppointment.doctor_id
                )}
                icon={
                  <Stethoscope size={17} />
                }
              />

              <InfoRow
                label="Service"
                value={
                  selectedAppointment.service_name ||
                  "Not provided"
                }
                icon={
                  <Stethoscope size={17} />
                }
              />

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </p>

                <span
                  className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                    selectedAppointment.status
                  )}`}
                >
                  {selectedAppointment.status ||
                    "scheduled"}
                </span>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Notes
                  </p>

                  <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {selectedAppointment.notes}
                  </div>
                </div>
              )}

            </div>

            {/* FOOTER */}

            <div className="border-t border-slate-200 p-5">

              <button
                onClick={() =>
                  setSelectedAppointment(
                    null
                  )
                }
                className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// ==========================================
// STAT CARD
// ==========================================

function StatCard({
  title,
  value,
  icon,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`rounded-xl p-3 ${iconClass}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

// ==========================================
// INFO ROW
// ==========================================

function InfoRow({
  label,
  value,
  icon,
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
        {icon}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>

    </div>
  );
}