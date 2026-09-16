import { useEffect, useState } from "react";

import {
  Users,
  Stethoscope,
  CalendarDays,
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";

import { Link } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    services: 0,
    appointments: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });

  const [appointments, setAppointments] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [
        patients,
        doctors,
        services,
        appointments,
        pending,
        confirmed,
        completed,
        cancelled,
      ] = await Promise.all([
        getCount("patients"),
        getCount("doctors"),
        getCount("services"),
        getCount("appointments"),

        getStatusCount(
          "appointments",
          "pending"
        ),

        getStatusCount(
          "appointments",
          "confirmed"
        ),

        getStatusCount(
          "appointments",
          "completed"
        ),

        getStatusCount(
          "appointments",
          "cancelled"
        ),
      ]);

      setStats({
        patients,
        doctors,
        services,
        appointments,
        pending,
        confirmed,
        completed,
        cancelled,
      });

      await loadRecentAppointments();
    } catch (error) {
      console.error(error);

      setErrorMessage(
        "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  const getCount = async (table) => {
    const { count, error } = await supabase
      .from(table)
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) {
      throw error;
    }

    return count || 0;
  };

  const getStatusCount = async (
    table,
    status
  ) => {
    const { count, error } = await supabase
      .from(table)
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", status);

    if (error) {
      throw error;
    }

    return count || 0;
  };

  const loadRecentAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        notes,

        patients (
          id,
          full_name,
          phone
        ),

        doctors (
          id,
          full_name,
          specialization
        ),

        services (
          id,
          name
        )
      `)
      .order("appointment_date", {
        ascending: false,
      })
      .order("appointment_time", {
        ascending: false,
      })
      .limit(6);

    if (error) {
      throw error;
    }

    setAppointments(data || []);
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "-";

    const [hours, minutes] =
      time.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes)
    );

    return date.toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const statusClass = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-50 text-blue-700";

      case "completed":
        return "bg-cyan-50 text-cyan-700";

      case "cancelled":
        return "bg-red-50 text-red-700";

      case "no_show":
        return "bg-orange-50 text-orange-700";

      default:
        return "bg-amber-50 text-amber-700";
    }
  };

  const statCards = [
    {
      title: "Total Patients",
      value: stats.patients,
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Doctors",
      value: stats.doctors,
      icon: Stethoscope,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
    {
      title: "Services",
      value: stats.services,
      icon: ClipboardList,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Appointments",
      value: stats.appointments,
      icon: CalendarDays,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
  ];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <p className="text-sm font-medium text-blue-600">
            Overview
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Dashboard
          </h1>

          <p className="text-slate-500 mt-1">
            Monitor your dental clinic activity.
          </p>
        </div>

        <Link
          to="/admin/appointments"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition"
        >
          <CalendarDays size={18} />
          Manage Appointments
        </Link>

      </div>

      {/* Error */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {errorMessage}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
            >

              <div className="flex items-center justify-between">

                <div
                  className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}
                >
                  <Icon
                    size={23}
                    className={stat.iconColor}
                  />
                </div>

              </div>

              <p className="text-sm text-slate-500 mt-5">
                {stat.title}
              </p>

              <p className="text-3xl font-bold text-slate-900 mt-1">
                {loading ? "..." : stat.value}
              </p>

            </div>
          );
        })}

      </div>

      {/* Appointment Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <StatusCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          className="text-amber-600 bg-amber-50"
          loading={loading}
        />

        <StatusCard
          title="Confirmed"
          value={stats.confirmed}
          icon={CalendarDays}
          className="text-blue-600 bg-blue-50"
          loading={loading}
        />

        <StatusCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          className="text-cyan-600 bg-cyan-50"
          loading={loading}
        />

        <StatusCard
          title="Cancelled"
          value={stats.cancelled}
          icon={XCircle}
          className="text-red-600 bg-red-50"
          loading={loading}
        />

      </div>

      {/* Recent Appointments */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent Appointments
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Latest appointments from your database.
            </p>
          </div>

          <Link
            to="/admin/appointments"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View All
            <ArrowRight size={16} />
          </Link>

        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-50">

              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">

                <th className="px-6 py-4">
                  Patient
                </th>

                <th className="px-6 py-4">
                  Doctor
                </th>

                <th className="px-6 py-4">
                  Service
                </th>

                <th className="px-6 py-4">
                  Date
                </th>

                <th className="px-6 py-4">
                  Status
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {!loading &&
                appointments.map(
                  (appointment) => (
                    <tr
                      key={appointment.id}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-6 py-4">

                        <p className="font-semibold text-slate-900">
                          {appointment.patients?.full_name ||
                            "Unknown Patient"}
                        </p>

                        <p className="text-xs text-slate-500">
                          {appointment.patients?.phone ||
                            ""}
                        </p>

                      </td>

                      <td className="px-6 py-4">

                        <p className="text-sm font-medium text-slate-900">
                          {appointment.doctors?.full_name ||
                            "Unknown Doctor"}
                        </p>

                        <p className="text-xs text-slate-500">
                          {appointment.doctors?.specialization ||
                            ""}
                        </p>

                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {appointment.services?.name ||
                          "No service"}
                      </td>

                      <td className="px-6 py-4">

                        <p className="text-sm font-medium text-slate-900">
                          {formatDate(
                            appointment.appointment_date
                          )}
                        </p>

                        <p className="text-xs text-slate-500">
                          {formatTime(
                            appointment.appointment_time
                          )}
                        </p>

                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${statusClass(
                            appointment.status
                          )}`}
                        >
                          {appointment.status?.replace(
                            "_",
                            " "
                          )}
                        </span>

                      </td>

                    </tr>
                  )
                )}

            </tbody>

          </table>

        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-100">

          {!loading &&
            appointments.map(
              (appointment) => (
                <div
                  key={appointment.id}
                  className="p-5"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>
                      <h3 className="font-bold text-slate-900">
                        {appointment.patients?.full_name ||
                          "Unknown Patient"}
                      </h3>

                      <p className="text-sm text-slate-500 mt-1">
                        Dr.{" "}
                        {appointment.doctors?.full_name ||
                          "Unknown Doctor"}
                      </p>

                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusClass(
                        appointment.status
                      )}`}
                    >
                      {appointment.status?.replace(
                        "_",
                        " "
                      )}
                    </span>

                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">

                    <div>
                      <p className="text-xs text-slate-400">
                        Service
                      </p>

                      <p className="font-medium text-slate-700 mt-1">
                        {appointment.services?.name ||
                          "No service"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Date
                      </p>

                      <p className="font-medium text-slate-700 mt-1">
                        {formatDate(
                          appointment.appointment_date
                        )}
                      </p>
                    </div>

                  </div>

                </div>
              )
            )}

        </div>

        {/* Empty */}
        {!loading &&
          appointments.length === 0 && (
            <div className="py-12 text-center">

              <CalendarDays
                size={40}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 font-semibold text-slate-700">
                No appointments found
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Appointments will appear here when patients book.
              </p>

            </div>
          )}

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center">

            <div className="w-8 h-8 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />

            <p className="text-sm text-slate-500 mt-3">
              Loading real database data...
            </p>

          </div>
        )}

      </div>

    </div>
  );
}


/* ==========================================
   STATUS CARD
========================================== */

function StatusCard({
  title,
  value,
  icon: Icon,
  className,
  loading,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">

      <div className="flex items-center gap-3">

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${className}`}
        >
          <Icon size={19} />
        </div>

        <div>

          <p className="text-xs text-slate-500">
            {title}
          </p>

          <p className="text-xl font-bold text-slate-900">
            {loading ? "..." : value}
          </p>

        </div>

      </div>

    </div>
  );
}