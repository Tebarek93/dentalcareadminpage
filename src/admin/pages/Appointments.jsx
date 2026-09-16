import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  CalendarDays,
  Clock,
  User,
  Stethoscope,
  ClipboardList,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const STATUS_OPTIONS = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  no_show: "bg-gray-100 text-gray-700 border-gray-200",
};

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .replace("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "-";

  const [hours, minutes] = time.split(":");

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // ==========================================
  // LOAD APPOINTMENTS
  // ==========================================

  const loadAppointments = async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          id,
          patient_id,
          doctor_id,
          service_id,
          appointment_date,
          appointment_time,
          status,
          notes,
          created_at
        `)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: false });

      if (appointmentsError) {
        throw new Error(
          `Appointments: ${appointmentsError.message}`
        );
      }

      if (!data || data.length === 0) {
        setAppointments([]);
        return;
      }

      // ==========================================
      // GET PATIENT IDS
      // ==========================================

      const patientIds = [
        ...new Set(
          data
            .map((appointment) => appointment.patient_id)
            .filter(Boolean)
        ),
      ];

      // ==========================================
      // GET DOCTOR IDS
      // ==========================================

      const doctorIds = [
        ...new Set(
          data
            .map((appointment) => appointment.doctor_id)
            .filter(Boolean)
        ),
      ];

      // ==========================================
      // GET SERVICE IDS
      // ==========================================

      const serviceIds = [
        ...new Set(
          data
            .map((appointment) => appointment.service_id)
            .filter(Boolean)
        ),
      ];

      // ==========================================
      // LOAD RELATED DATA
      // ==========================================

      let patients = [];
      let doctors = [];
      let services = [];

      if (patientIds.length > 0) {
        const { data: patientData, error: patientError } =
          await supabase
            .from("patients")
            .select(`
              id,
              full_name,
              email,
              phone,
              date_of_birth,
              gender,
              address,
              emergency_contact_name,
              emergency_contact_phone,
              medical_notes
            `)
            .in("id", patientIds);

        if (patientError) {
          throw new Error(
            `Patients: ${patientError.message}`
          );
        }

        patients = patientData || [];
      }

      if (doctorIds.length > 0) {
        const { data: doctorData, error: doctorError } =
          await supabase
            .from("doctors")
            .select(`
              id,
              full_name,
              specialization
            `)
            .in("id", doctorIds);

        if (doctorError) {
          throw new Error(
            `Doctors: ${doctorError.message}`
          );
        }

        doctors = doctorData || [];
      }

      if (serviceIds.length > 0) {
        const { data: serviceData, error: serviceError } =
          await supabase
            .from("services")
            .select(`
              id,
              name,
              price,
              duration_minutes
            `)
            .in("id", serviceIds);

        if (serviceError) {
          throw new Error(
            `Services: ${serviceError.message}`
          );
        }

        services = serviceData || [];
      }

      // ==========================================
      // CREATE LOOKUP MAPS
      // ==========================================

      const patientMap = new Map(
        patients.map((patient) => [patient.id, patient])
      );

      const doctorMap = new Map(
        doctors.map((doctor) => [doctor.id, doctor])
      );

      const serviceMap = new Map(
        services.map((service) => [service.id, service])
      );

      // ==========================================
      // COMBINE DATA
      // ==========================================

      const combinedAppointments = data.map((appointment) => ({
        ...appointment,
        patient: patientMap.get(appointment.patient_id) || null,
        doctor: doctorMap.get(appointment.doctor_id) || null,
        service: serviceMap.get(appointment.service_id) || null,
      }));

      setAppointments(combinedAppointments);
    } catch (err) {
      console.error("Appointments loading error:", err);

      setError(
        err.message ||
          "Unable to load appointment data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // ==========================================
  // FILTER APPOINTMENTS
  // ==========================================

  const filteredAppointments = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return appointments.filter((appointment) => {
      const patientName =
        appointment.patient?.full_name?.toLowerCase() || "";

      const patientEmail =
        appointment.patient?.email?.toLowerCase() || "";

      const patientPhone =
        appointment.patient?.phone?.toLowerCase() || "";

      const doctorName =
        appointment.doctor?.full_name?.toLowerCase() || "";

      const serviceName =
        appointment.service?.name?.toLowerCase() || "";

      const matchesSearch =
        !searchValue ||
        patientName.includes(searchValue) ||
        patientEmail.includes(searchValue) ||
        patientPhone.includes(searchValue) ||
        doctorName.includes(searchValue) ||
        serviceName.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  // ==========================================
  // STATUS COUNTS
  // ==========================================

  const statusCounts = useMemo(() => {
    return {
      all: appointments.length,
      pending: appointments.filter(
        (item) => item.status === "pending"
      ).length,
      confirmed: appointments.filter(
        (item) => item.status === "confirmed"
      ).length,
      completed: appointments.filter(
        (item) => item.status === "completed"
      ).length,
      cancelled: appointments.filter(
        (item) => item.status === "cancelled"
      ).length,
      no_show: appointments.filter(
        (item) => item.status === "no_show"
      ).length,
    };
  }, [appointments]);

  // ==========================================
  // UPDATE STATUS
  // ==========================================

  const updateStatus = async (appointmentId, newStatus) => {
    try {
      setUpdatingId(appointmentId);
      setError("");

      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          status: newStatus,
        })
        .eq("id", appointmentId);

      if (updateError) {
        throw new Error(
          `Status update failed: ${updateError.message}`
        );
      }

      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId
            ? {
                ...appointment,
                status: newStatus,
              }
            : appointment
        )
      );

      setSelectedAppointment((current) =>
        current?.id === appointmentId
          ? {
              ...current,
              status: newStatus,
            }
          : current
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to update appointment status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ==========================================
  // DELETE APPOINTMENT
  // ==========================================

  const deleteAppointment = async (appointmentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this appointment?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(appointmentId);
      setError("");

      const { error: deleteError } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (deleteError) {
        throw new Error(
          `Delete failed: ${deleteError.message}`
        );
      }

      setAppointments((current) =>
        current.filter(
          (appointment) =>
            appointment.id !== appointmentId
        )
      );

      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(null);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to delete appointment."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />

          <p className="text-sm text-gray-500">
            Loading appointments...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <ClipboardList className="h-4 w-4" />
            <span>Admin</span>
            <span>/</span>
            <span>Appointments</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Appointments
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor patient appointments.
          </p>
        </div>

        <button
          onClick={() => loadAppointments(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">
              Unable to process appointment data
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ======================================
          STATUS CARDS
      ====================================== */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

        <StatusCard
          label="All"
          count={statusCounts.all}
          icon={<CalendarDays className="h-5 w-5" />}
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        />

        <StatusCard
          label="Pending"
          count={statusCounts.pending}
          icon={<Clock className="h-5 w-5" />}
          active={statusFilter === "pending"}
          onClick={() => setStatusFilter("pending")}
        />

        <StatusCard
          label="Confirmed"
          count={statusCounts.confirmed}
          icon={<CheckCircle2 className="h-5 w-5" />}
          active={statusFilter === "confirmed"}
          onClick={() => setStatusFilter("confirmed")}
        />

        <StatusCard
          label="Completed"
          count={statusCounts.completed}
          icon={<CheckCircle2 className="h-5 w-5" />}
          active={statusFilter === "completed"}
          onClick={() => setStatusFilter("completed")}
        />

        <StatusCard
          label="Cancelled"
          count={statusCounts.cancelled}
          icon={<XCircle className="h-5 w-5" />}
          active={statusFilter === "cancelled"}
          onClick={() => setStatusFilter("cancelled")}
        />

        <StatusCard
          label="No Show"
          count={statusCounts.no_show}
          icon={<User className="h-5 w-5" />}
          active={statusFilter === "no_show"}
          onClick={() => setStatusFilter("no_show")}
        />

      </div>

      {/* ======================================
          SEARCH + FILTER
      ====================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 md:flex-row">

          <div className="relative flex-1">

            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search patient, doctor, service, email..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="relative md:w-52">

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {STATUS_OPTIONS.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {formatStatus(status)}
                </option>
              ))}
            </select>

          </div>

        </div>

        <div className="mt-3 text-sm text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {filteredAppointments.length}
          </span>{" "}
          appointment
          {filteredAppointments.length !== 1
            ? "s"
            : ""}
        </div>
      </div>

      {/* ======================================
          EMPTY
      ====================================== */}

      {filteredAppointments.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <CalendarDays className="h-7 w-7 text-blue-600" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No appointments found
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {search || statusFilter !== "all"
              ? "Try changing your search or filter."
              : "There are no appointments in the system yet."}
          </p>
        </div>
      ) : (
        <>
          {/* ==================================
              DESKTOP TABLE
          ================================== */}

          <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:block">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px]">

                <thead className="border-b border-gray-200 bg-gray-50">

                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Patient
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Doctor
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Service
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date & Time
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Action
                    </th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {filteredAppointments.map(
                    (appointment) => (
                      <tr
                        key={appointment.id}
                        className="transition hover:bg-gray-50"
                      >

                        {/* PATIENT */}

                        <td className="px-5 py-4">

                          <button
                            onClick={() =>
                              setSelectedAppointment(
                                appointment
                              )
                            }
                            className="text-left"
                          >
                            <p className="font-semibold text-gray-900 hover:text-blue-600">
                              {appointment.patient
                                ?.full_name ||
                                "Unknown patient"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {appointment.patient
                                ?.phone ||
                                appointment.patient
                                  ?.email ||
                                "-"}
                            </p>
                          </button>

                        </td>

                        {/* DOCTOR */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                              <Stethoscope className="h-4 w-4" />
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {appointment.doctor
                                  ?.full_name ||
                                  "Unknown doctor"}
                              </p>

                              <p className="text-xs text-gray-500">
                                {appointment.doctor
                                  ?.specialization ||
                                  "Dentist"}
                              </p>
                            </div>

                          </div>

                        </td>

                        {/* SERVICE */}

                        <td className="px-5 py-4">

                          <p className="text-sm font-medium text-gray-900">
                            {appointment.service
                              ?.name ||
                              "General appointment"}
                          </p>

                          {appointment.service && (
                            <p className="mt-1 text-xs text-gray-500">
                              {appointment.service
                                .duration_minutes || 30}{" "}
                              minutes
                            </p>
                          )}

                        </td>

                        {/* DATE */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <CalendarDays className="h-4 w-4 text-blue-600" />

                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(
                                  appointment.appointment_date
                                )}
                              </p>

                              <p className="text-xs text-gray-500">
                                {formatTime(
                                  appointment.appointment_time
                                )}
                              </p>
                            </div>

                          </div>

                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <StatusSelect
                            appointment={appointment}
                            updatingId={updatingId}
                            onChange={updateStatus}
                          />

                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-4 text-right">

                          <button
                            onClick={() =>
                              deleteAppointment(
                                appointment.id
                              )
                            }
                            disabled={
                              deletingId ===
                              appointment.id
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Delete appointment"
                          >
                            {deletingId ===
                            appointment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          </div>

          {/* ==================================
              MOBILE / TABLET CARDS
          ================================== */}

          <div className="grid gap-4 lg:hidden">

            {filteredAppointments.map(
              (appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >

                  {/* HEADER */}

                  <div className="flex items-start justify-between gap-3">

                    <button
                      onClick={() =>
                        setSelectedAppointment(
                          appointment
                        )
                      }
                      className="text-left"
                    >
                      <h3 className="font-semibold text-gray-900">
                        {appointment.patient
                          ?.full_name ||
                          "Unknown patient"}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        {appointment.patient
                          ?.phone ||
                          appointment.patient
                            ?.email ||
                          "-"}
                      </p>
                    </button>

                    <StatusSelect
                      appointment={appointment}
                      updatingId={updatingId}
                      onChange={updateStatus}
                    />

                  </div>

                  {/* INFO */}

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">

                    <InfoItem
                      icon={
                        <Stethoscope className="h-4 w-4" />
                      }
                      label="Doctor"
                      value={
                        appointment.doctor
                          ?.full_name ||
                        "Unknown doctor"
                      }
                    />

                    <InfoItem
                      icon={
                        <ClipboardList className="h-4 w-4" />
                      }
                      label="Service"
                      value={
                        appointment.service
                          ?.name ||
                        "General appointment"
                      }
                    />

                    <InfoItem
                      icon={
                        <CalendarDays className="h-4 w-4" />
                      }
                      label="Date"
                      value={formatDate(
                        appointment.appointment_date
                      )}
                    />

                    <InfoItem
                      icon={
                        <Clock className="h-4 w-4" />
                      }
                      label="Time"
                      value={formatTime(
                        appointment.appointment_time
                      )}
                    />

                  </div>

                  {/* ACTIONS */}

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">

                    <button
                      onClick={() =>
                        setSelectedAppointment(
                          appointment
                        )
                      }
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View details
                    </button>

                    <button
                      onClick={() =>
                        deleteAppointment(
                          appointment.id
                        )
                      }
                      disabled={
                        deletingId ===
                        appointment.id
                      }
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId ===
                      appointment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}

                      Delete
                    </button>

                  </div>

                </div>
              )
            )}

          </div>
        </>
      )}

      {/* ======================================
          APPOINTMENT DETAILS MODAL
      ====================================== */}

      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() =>
            setSelectedAppointment(null)
          }
          onStatusChange={updateStatus}
          updatingId={updatingId}
        />
      )}
    </div>
  );
}

// ======================================================
// STATUS CARD
// ======================================================

function StatusCard({
  label,
  count,
  icon,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left shadow-sm transition ${
        active
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
          : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/30"
      }`}
    >
      <div className="flex items-center justify-between">

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            active
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {icon}
        </div>

      </div>

      <p className="mt-3 text-xs font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-gray-900">
        {count}
      </p>
    </button>
  );
}

// ======================================================
// STATUS SELECT
// ======================================================

function StatusSelect({
  appointment,
  updatingId,
  onChange,
}) {
  const updating =
    updatingId === appointment.id;

  return (
    <div className="relative inline-block">

      {updating && (
        <Loader2 className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-blue-600" />
      )}

      <select
        value={appointment.status || "pending"}
        disabled={updating}
        onChange={(event) =>
          onChange(
            appointment.id,
            event.target.value
          )
        }
        className={`appearance-none rounded-full border px-3 py-1.5 pr-7 text-xs font-semibold outline-none transition disabled:opacity-60 ${
          statusStyles[
            appointment.status
          ] ||
          "border-gray-200 bg-gray-50 text-gray-700"
        }`}
      >
        <option value="pending">
          Pending
        </option>

        <option value="confirmed">
          Confirmed
        </option>

        <option value="completed">
          Completed
        </option>

        <option value="cancelled">
          Cancelled
        </option>

        <option value="no_show">
          No Show
        </option>
      </select>

      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2" />
    </div>
  );
}

// ======================================================
// INFO ITEM
// ======================================================

function InfoItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">

      <div className="mt-0.5 text-blue-600">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-xs text-gray-500">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-medium text-gray-900">
          {value}
        </p>

      </div>

    </div>
  );
}

// ======================================================
// DETAILS MODAL
// ======================================================

function AppointmentModal({
  appointment,
  onClose,
  onStatusChange,
  updatingId,
}) {
  const patient = appointment.patient;
  const doctor = appointment.doctor;
  const service = appointment.service;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        {/* HEADER */}

        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">

          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Appointment Details
            </h2>

            <p className="text-xs text-gray-500">
              Appointment #{appointment.id}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <XCircle className="h-5 w-5" />
          </button>

        </div>

        {/* BODY */}

        <div className="space-y-5 p-5">

          {/* DATE */}

          <div className="grid gap-3 sm:grid-cols-2">

            <InfoItem
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Appointment Date"
              value={formatDate(
                appointment.appointment_date
              )}
            />

            <InfoItem
              icon={
                <Clock className="h-4 w-4" />
              }
              label="Appointment Time"
              value={formatTime(
                appointment.appointment_time
              )}
            />

          </div>

          {/* PATIENT */}

          <div className="rounded-2xl border border-gray-200 p-4">

            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />

              <h3 className="font-semibold text-gray-900">
                Patient Information
              </h3>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">

              <InfoItem
                icon={
                  <User className="h-4 w-4" />
                }
                label="Full Name"
                value={
                  patient?.full_name ||
                  "Unknown patient"
                }
              />

              <InfoItem
                icon={
                  <ClipboardList className="h-4 w-4" />
                }
                label="Gender"
                value={
                  patient?.gender || "-"
                }
              />

              <InfoItem
                icon={
                  <CalendarDays className="h-4 w-4" />
                }
                label="Date of Birth"
                value={
                  patient?.date_of_birth
                    ? formatDate(
                        patient.date_of_birth
                      )
                    : "-"
                }
              />

              <InfoItem
                icon={
                  <Clock className="h-4 w-4" />
                }
                label="Phone"
                value={
                  patient?.phone || "-"
                }
              />

              <InfoItem
                icon={
                  <ClipboardList className="h-4 w-4" />
                }
                label="Email"
                value={
                  patient?.email || "-"
                }
              />

              <InfoItem
                icon={
                  <User className="h-4 w-4" />
                }
                label="Address"
                value={
                  patient?.address || "-"
                }
              />

            </div>

          </div>

          {/* DOCTOR */}

          <div className="rounded-2xl border border-gray-200 p-4">

            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />

              <h3 className="font-semibold text-gray-900">
                Doctor & Service
              </h3>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">

              <InfoItem
                icon={
                  <Stethoscope className="h-4 w-4" />
                }
                label="Doctor"
                value={
                  doctor?.full_name ||
                  "Unknown doctor"
                }
              />

              <InfoItem
                icon={
                  <ClipboardList className="h-4 w-4" />
                }
                label="Specialization"
                value={
                  doctor?.specialization ||
                  "-"
                }
              />

              <InfoItem
                icon={
                  <ClipboardList className="h-4 w-4" />
                }
                label="Service"
                value={
                  service?.name ||
                  "General appointment"
                }
              />

              <InfoItem
                icon={
                  <Clock className="h-4 w-4" />
                }
                label="Duration"
                value={
                  service?.duration_minutes
                    ? `${service.duration_minutes} minutes`
                    : "-"
                }
              />

            </div>

          </div>

          {/* NOTES */}

          <div>

            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              Appointment Notes
            </h3>

            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              {appointment.notes ||
                "No appointment notes provided."}
            </div>

          </div>

          {/* EMERGENCY CONTACT */}

          {(patient?.emergency_contact_name ||
            patient?.emergency_contact_phone) && (
            <div className="rounded-2xl border border-gray-200 p-4">

              <h3 className="font-semibold text-gray-900">
                Emergency Contact
              </h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">

                <InfoItem
                  icon={
                    <User className="h-4 w-4" />
                  }
                  label="Name"
                  value={
                    patient?.emergency_contact_name ||
                    "-"
                  }
                />

                <InfoItem
                  icon={
                    <ClipboardList className="h-4 w-4" />
                  }
                  label="Phone"
                  value={
                    patient?.emergency_contact_phone ||
                    "-"
                  }
                />

              </div>

            </div>
          )}

          {/* STATUS */}

          <div>

            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              Appointment Status
            </h3>

            <StatusSelect
              appointment={appointment}
              updatingId={updatingId}
              onChange={onStatusChange}
            />

          </div>

        </div>

        {/* FOOTER */}

        <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-5 py-4">

          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>

        </div>

      </div>
    </div>
  );
}