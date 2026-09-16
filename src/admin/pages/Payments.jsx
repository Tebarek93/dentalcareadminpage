import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [form, setForm] = useState({
    appointment_id: "",
    patient_id: "",
    amount: "",
    payment_method: "cash",
    payment_status: "pending",
    transaction_reference: "",
    payment_date: "",
    notes: "",
  });

  // ==========================================
  // FETCH DATA
  // ==========================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        paymentsResult,
        patientsResult,
        appointmentsResult,
      ] = await Promise.all([
        supabase
          .from("payments")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("patients")
          .select("*")
          .order("full_name", {
            ascending: true,
          }),

        supabase
          .from("appointments")
          .select("*")
          .order("appointment_date", {
            ascending: false,
          }),
      ]);

      if (paymentsResult.error) {
        throw paymentsResult.error;
      }

      if (patientsResult.error) {
        throw patientsResult.error;
      }

      if (appointmentsResult.error) {
        throw appointmentsResult.error;
      }

      setPayments(paymentsResult.data || []);
      setPatients(patientsResult.data || []);
      setAppointments(
        appointmentsResult.data || []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load payment data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Automatically select patient
    // when appointment is selected

    if (name === "appointment_id" && value) {
      const appointment =
        appointments.find(
          (item) =>
            String(item.id) ===
            String(value)
        );

      if (appointment?.patient_id) {
        setForm((prev) => ({
          ...prev,
          appointment_id: value,
          patient_id:
            appointment.patient_id,
        }));
      }
    }
  };

  // ==========================================
  // OPEN ADD
  // ==========================================

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      appointment_id: "",
      patient_id: "",
      amount: "",
      payment_method: "cash",
      payment_status: "pending",
      transaction_reference: "",
      payment_date: new Date()
        .toISOString()
        .slice(0, 16),
      notes: "",
    });

    setShowModal(true);
  };

  // ==========================================
  // OPEN EDIT
  // ==========================================

  const openEditModal = (payment) => {
    setEditingId(payment.id);

    setForm({
      appointment_id:
        payment.appointment_id || "",

      patient_id:
        payment.patient_id || "",

      amount:
        payment.amount ?? "",

      payment_method:
        payment.payment_method ||
        "cash",

      payment_status:
        payment.payment_status ||
        "pending",

      transaction_reference:
        payment.transaction_reference ||
        "",

      payment_date: payment.payment_date
        ? new Date(
            payment.payment_date
          )
            .toISOString()
            .slice(0, 16)
        : "",

      notes: payment.notes || "",
    });

    setShowModal(true);
  };

  // ==========================================
  // SAVE PAYMENT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patient_id) {
      setError(
        "Please select a patient."
      );
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError(
        "Please enter a valid payment amount."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const paymentData = {
        appointment_id:
          form.appointment_id
            ? Number(form.appointment_id)
            : null,

        patient_id:
          Number(form.patient_id),

        amount:
          Number(form.amount),

        payment_method:
          form.payment_method,

        payment_status:
          form.payment_status,

        transaction_reference:
          form.transaction_reference.trim() ||
          null,

        payment_date:
          form.payment_date
            ? new Date(
                form.payment_date
              ).toISOString()
            : new Date().toISOString(),

        notes:
          form.notes.trim() || null,
      };

      let result;

      if (editingId) {
        result = await supabase
          .from("payments")
          .update(paymentData)
          .eq("id", editingId);
      } else {
        result = await supabase
          .from("payments")
          .insert([
            paymentData,
          ]);
      }

      if (result.error) {
        throw result.error;
      }

      setShowModal(false);

      setEditingId(null);

      await fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to save payment."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this payment?"
      );

    if (!confirmed) return;

    try {
      setError("");

      const { error } =
        await supabase
          .from("payments")
          .delete()
          .eq("id", id);

      if (error) {
        throw error;
      }

      await fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to delete payment."
      );
    }
  };

  // ==========================================
  // PATIENT NAME
  // ==========================================

  const getPatientName = (
    patientId
  ) => {
    const patient =
      patients.find(
        (item) =>
          String(item.id) ===
          String(patientId)
      );

    return (
      patient?.full_name ||
      "Unknown Patient"
    );
  };

  // ==========================================
  // FILTER
  // ==========================================

  const filteredPayments =
    useMemo(() => {
      const text =
        search.toLowerCase();

      return payments.filter(
        (payment) => {
          const patientName =
            getPatientName(
              payment.patient_id
            ).toLowerCase();

          const reference =
            (
              payment.transaction_reference ||
              ""
            ).toLowerCase();

          const matchesSearch =
            patientName.includes(text) ||
            reference.includes(text) ||
            String(
              payment.id
            ).includes(text);

          const matchesStatus =
            statusFilter === "all" ||
            payment.payment_status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      payments,
      patients,
      search,
      statusFilter,
    ]);

  // ==========================================
  // STATISTICS
  // ==========================================

  const totalPaid = payments
    .filter(
      (payment) =>
        payment.payment_status ===
        "paid"
    )
    .reduce(
      (total, payment) =>
        total +
        Number(
          payment.amount || 0
        ),
      0
    );

  const pendingAmount = payments
    .filter(
      (payment) =>
        payment.payment_status ===
        "pending"
    )
    .reduce(
      (total, payment) =>
        total +
        Number(
          payment.amount || 0
        ),
      0
    );

  const partialAmount = payments
    .filter(
      (payment) =>
        payment.payment_status ===
        "partial"
    )
    .reduce(
      (total, payment) =>
        total +
        Number(
          payment.amount || 0
        ),
      0
    );

  const totalTransactions =
    payments.length;

  // ==========================================
  // STATUS STYLE
  // ==========================================

  const getStatusStyle = (
    status
  ) => {
    switch (
      String(status || "").toLowerCase()
    ) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "partial":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "refunded":
        return "bg-purple-50 text-purple-700 border-purple-200";

      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // ==========================================
  // PAYMENT METHOD
  // ==========================================

  const formatPaymentMethod = (
    method
  ) => {
    if (!method) return "Unknown";

    return method
      .replace("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

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
              Loading payments...
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
            Payments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage clinic payments and transactions.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">

          <button
            onClick={fetchData}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Payment
          </button>

        </div>
      </div>

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>

          <button
            onClick={() =>
              setError("")
            }
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ======================================
          STATISTICS
      ====================================== */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Paid"
          value={`${totalPaid.toFixed(
            2
          )} ETB`}
          icon={
            <DollarSign size={21} />
          }
          iconClass="bg-emerald-100 text-emerald-600"
        />

        <StatCard
          title="Pending"
          value={`${pendingAmount.toFixed(
            2
          )} ETB`}
          icon={
            <Clock size={21} />
          }
          iconClass="bg-amber-100 text-amber-600"
        />

        <StatCard
          title="Partial"
          value={`${partialAmount.toFixed(
            2
          )} ETB`}
          icon={
            <AlertCircle size={21} />
          }
          iconClass="bg-blue-100 text-blue-600"
        />

        <StatCard
          title="Transactions"
          value={totalTransactions}
          icon={
            <CheckCircle size={21} />
          }
          iconClass="bg-indigo-100 text-indigo-600"
        />

      </div>

      {/* ======================================
          PAYMENTS TABLE
      ====================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* FILTER BAR */}

        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">

          {/* SEARCH */}

          <div className="relative w-full lg:max-w-md">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search patient or transaction..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">
              All Status
            </option>

            <option value="paid">
              Paid
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="partial">
              Partial
            </option>

            <option value="refunded">
              Refunded
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>

        </div>

        {/* TABLE */}

        {filteredPayments.length === 0 ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

            <div className="rounded-full bg-blue-50 p-5 text-blue-600">
              <DollarSign size={32} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              No payments found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              No payment records match your current filters.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px]">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Patient
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Method
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredPayments.map(
                  (payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >

                      {/* PATIENT */}

                      <td className="px-5 py-4">

                        <p className="font-semibold text-slate-900">
                          {getPatientName(
                            payment.patient_id
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Payment #
                          {payment.id}
                        </p>

                      </td>

                      {/* AMOUNT */}

                      <td className="px-5 py-4">

                        <span className="font-bold text-slate-900">
                          {Number(
                            payment.amount || 0
                          ).toFixed(2)}{" "}
                          ETB
                        </span>

                      </td>

                      {/* METHOD */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatPaymentMethod(
                          payment.payment_method
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            payment.payment_status
                          )}`}
                        >
                          {formatPaymentMethod(
                            payment.payment_status
                          )}
                        </span>

                      </td>

                      {/* DATE */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {payment.payment_date
                          ? new Date(
                              payment.payment_date
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() => {
                              setSelectedPayment(
                                payment
                              );
                              setShowDetails(
                                true
                              );
                            }}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                            title="View"
                          >
                            <Eye
                              size={17}
                            />
                          </button>

                          <button
                            onClick={() =>
                              openEditModal(
                                payment
                              )
                            }
                            className="rounded-lg border border-blue-100 p-2 text-blue-600 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Pencil
                              size={17}
                            />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                payment.id
                              )
                            }
                            className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2
                              size={17}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ======================================
          ADD / EDIT MODAL
      ====================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 p-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  {editingId
                    ? "Edit Payment"
                    : "Add Payment"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Record a clinic payment.
                </p>

              </div>

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5 sm:p-6"
            >

              {/* APPOINTMENT */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Appointment
                </label>

                <select
                  name="appointment_id"
                  value={
                    form.appointment_id
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >

                  <option value="">
                    No appointment
                  </option>

                  {appointments.map(
                    (appointment) => (
                      <option
                        key={
                          appointment.id
                        }
                        value={
                          appointment.id
                        }
                      >
                        Appointment #
                        {
                          appointment.id
                        }{" "}
                        -{" "}
                        {
                          appointment.appointment_date
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* PATIENT */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Patient *
                </label>

                <select
                  name="patient_id"
                  value={
                    form.patient_id
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >

                  <option value="">
                    Select patient
                  </option>

                  {patients.map(
                    (patient) => (
                      <option
                        key={patient.id}
                        value={patient.id}
                      >
                        {
                          patient.full_name
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* AMOUNT */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Amount (ETB) *
                </label>

                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={
                    handleChange
                  }
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* METHOD + STATUS */}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Payment Method
                  </label>

                  <select
                    name="payment_method"
                    value={
                      form.payment_method
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >

                    <option value="cash">
                      Cash
                    </option>

                    <option value="card">
                      Card
                    </option>

                    <option value="bank_transfer">
                      Bank Transfer
                    </option>

                    <option value="mobile_money">
                      Mobile Money
                    </option>

                    <option value="other">
                      Other
                    </option>

                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Payment Status
                  </label>

                  <select
                    name="payment_status"
                    value={
                      form.payment_status
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >

                    <option value="pending">
                      Pending
                    </option>

                    <option value="paid">
                      Paid
                    </option>

                    <option value="partial">
                      Partial
                    </option>

                    <option value="refunded">
                      Refunded
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>

                  </select>

                </div>

              </div>

              {/* TRANSACTION */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Transaction Reference
                </label>

                <input
                  type="text"
                  name="transaction_reference"
                  value={
                    form.transaction_reference
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Optional transaction/reference number"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* DATE */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Payment Date
                </label>

                <input
                  type="datetime-local"
                  name="payment_date"
                  value={
                    form.payment_date
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* NOTES */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={
                    handleChange
                  }
                  rows="3"
                  placeholder="Optional payment notes..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Payment"
                    : "Save Payment"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ======================================
          DETAILS MODAL
      ====================================== */}

      {showDetails &&
        selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-200 p-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Payment Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Payment #
                    {
                      selectedPayment.id
                    }
                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowDetails(
                      false
                    )
                  }
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>

              </div>

              <div className="space-y-5 p-5 sm:p-6">

                <div className="rounded-2xl bg-blue-50 p-5">

                  <p className="text-sm text-blue-600">
                    Payment Amount
                  </p>

                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {Number(
                      selectedPayment.amount ||
                        0
                    ).toFixed(2)}{" "}
                    ETB
                  </p>

                </div>

                <DetailRow
                  label="Patient"
                  value={getPatientName(
                    selectedPayment.patient_id
                  )}
                />

                <DetailRow
                  label="Payment Method"
                  value={formatPaymentMethod(
                    selectedPayment.payment_method
                  )}
                />

                <DetailRow
                  label="Status"
                  value={formatPaymentMethod(
                    selectedPayment.payment_status
                  )}
                />

                <DetailRow
                  label="Transaction Reference"
                  value={
                    selectedPayment.transaction_reference ||
                    "Not provided"
                  }
                />

                <DetailRow
                  label="Payment Date"
                  value={
                    selectedPayment.payment_date
                      ? new Date(
                          selectedPayment.payment_date
                        ).toLocaleString()
                      : "Not provided"
                  }
                />

                {selectedPayment.notes && (
                  <div>

                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Notes
                    </p>

                    <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {
                        selectedPayment.notes
                      }
                    </div>

                  </div>
                )}

              </div>

              <div className="border-t border-slate-200 p-5">

                <button
                  onClick={() =>
                    setShowDetails(
                      false
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
// DETAIL ROW
// ==========================================

function DetailRow({
  label,
  value,
}) {
  return (
    <div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>

    </div>
  );
}