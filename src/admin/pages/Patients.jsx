import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Users,
  Eye,
  Pencil,
  Trash2,
  X,
  Loader2,
  Mail,
  Phone,
  Calendar,
  User,
  AlertCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  gender: "",
  address: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  medical_notes: "",
};

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // FETCH PATIENTS
  // ============================================================

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setPatients(data || []);
    } catch (err) {
      console.error("Fetch patients error:", err);
      setError(err.message || "Unable to load patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredPatients = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return patients;
    }

    return patients.filter((patient) => {
      return (
        patient.full_name?.toLowerCase().includes(value) ||
        patient.email?.toLowerCase().includes(value) ||
        patient.phone?.toLowerCase().includes(value) ||
        patient.gender?.toLowerCase().includes(value)
      );
    });
  }, [patients, search]);

  // ============================================================
  // FORM HANDLER
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // OPEN ADD
  // ============================================================

  const openAddModal = () => {
    setEditingPatient(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  // ============================================================
  // OPEN EDIT
  // ============================================================

  const openEditModal = (patient) => {
    setEditingPatient(patient);

    setForm({
      full_name: patient.full_name || "",
      email: patient.email || "",
      phone: patient.phone || "",
      date_of_birth: patient.date_of_birth || "",
      gender: patient.gender || "",
      address: patient.address || "",
      emergency_contact_name: patient.emergency_contact_name || "",
      emergency_contact_phone: patient.emergency_contact_phone || "",
      medical_notes: patient.medical_notes || "",
    });

    setError("");
    setShowModal(true);
  };

  // ============================================================
  // SAVE PATIENT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_name.trim()) {
      setError("Patient name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const patientData = {
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        address: form.address.trim() || null,
        emergency_contact_name:
          form.emergency_contact_name.trim() || null,
        emergency_contact_phone:
          form.emergency_contact_phone.trim() || null,
        medical_notes: form.medical_notes.trim() || null,
      };

      if (editingPatient) {
        const { error } = await supabase
          .from("patients")
          .update(patientData)
          .eq("id", editingPatient.id);

        if (error) {
          throw error;
        }

        setSuccess("Patient updated successfully.");
      } else {
        const { error } = await supabase
          .from("patients")
          .insert([patientData]);

        if (error) {
          throw error;
        }

        setSuccess("Patient added successfully.");
      }

      setShowModal(false);
      setForm(emptyForm);
      setEditingPatient(null);

      await fetchPatients();
    } catch (err) {
      console.error("Save patient error:", err);
      setError(err.message || "Unable to save patient.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE PATIENT
  // ============================================================

  const handleDelete = async (patient) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${patient.full_name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", patient.id);

      if (error) {
        throw error;
      }

      setPatients((prev) =>
        prev.filter((item) => item.id !== patient.id)
      );

      setSuccess("Patient deleted successfully.");

      if (selectedPatient?.id === patient.id) {
        setSelectedPatient(null);
        setShowDetails(false);
      }
    } catch (err) {
      console.error("Delete patient error:", err);
      setError(err.message || "Unable to delete patient.");
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // VIEW DETAILS
  // ============================================================

  const openDetails = (patient) => {
    setSelectedPatient(patient);
    setShowDetails(true);
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "Not provided";
    }

    return new Date(date).toLocaleDateString();
  };

  // ============================================================
  // CALCULATE AGE
  // ============================================================

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) {
      return "—";
    }

    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDifference =
      today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 &&
        today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Users size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Patients
              </h1>

              <p className="text-sm text-slate-500">
                Manage your dental clinic patients
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Patient
        </button>
      </div>

      {/* ======================================================
          ALERTS
      ======================================================= */}

      {error && !showModal && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>

          <button onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

      {/* ======================================================
          STAT CARD
      ======================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total Patients
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {patients.length}
              </h2>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Users size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          TABLE CONTAINER
      ======================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Search */}

        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="relative max-w-md">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Loading */}

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2
                size={32}
                className="animate-spin text-blue-600"
              />

              <p className="text-sm text-slate-500">
                Loading patients...
              </p>
            </div>
          </div>
        ) : filteredPatients.length === 0 ? (
          /* Empty */

          <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-5 text-slate-400">
              <Users size={35} />
            </div>

            <h3 className="text-lg font-semibold text-slate-800">
              {search
                ? "No patients found"
                : "No patients yet"}
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              {search
                ? "Try changing your search term."
                : "Add your first patient to start managing patient records."}
            </p>

            {!search && (
              <button
                onClick={openAddModal}
                className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Patient
              </button>
            )}
          </div>
        ) : (
          /* Table */

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Patient
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Contact
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Age
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Gender
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Registered
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    {/* Patient */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                          {patient.full_name
                            ?.charAt(0)
                            ?.toUpperCase() || "P"}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {patient.full_name}
                          </p>

                          <p className="text-xs text-slate-500">
                            Patient #{patient.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {patient.email && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail size={14} />
                            {patient.email}
                          </div>
                        )}

                        {patient.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone size={14} />
                            {patient.phone}
                          </div>
                        )}

                        {!patient.email && !patient.phone && (
                          <span className="text-sm text-slate-400">
                            No contact
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Age */}

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {calculateAge(patient.date_of_birth)}
                    </td>

                    {/* Gender */}

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                        {patient.gender || "Not specified"}
                      </span>
                    </td>

                    {/* Registered */}

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(patient.created_at)}
                    </td>

                    {/* Actions */}

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openDetails(patient)}
                          title="View patient"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() => openEditModal(patient)}
                          title="Edit patient"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(patient)}
                          disabled={deleting}
                          title="Delete patient"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Result count */}

        {!loading && filteredPatients.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-4">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredPatients.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {patients.length}
              </span>{" "}
              patients
            </p>
          </div>
        )}
      </div>

      {/* ======================================================
          ADD / EDIT MODAL
      ======================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingPatient
                    ? "Edit Patient"
                    : "Add Patient"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingPatient
                    ? "Update patient information"
                    : "Create a new patient record"}
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={21} />
              </button>
            </div>

            {/* Modal Body */}

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-5 sm:p-6"
            >
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Basic Information */}

              <section>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label="Full Name"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="patient@example.com"
                  />

                  <Input
                    label="Phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+251..."
                  />

                  <Input
                    label="Date of Birth"
                    name="date_of_birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={handleChange}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Gender
                    </label>

                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">
                        Select gender
                      </option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <Input
                    label="Address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Patient address"
                  />
                </div>
              </section>

              {/* Emergency Contact */}

              <section>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
                  Emergency Contact
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label="Contact Name"
                    name="emergency_contact_name"
                    value={form.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="Emergency contact name"
                  />

                  <Input
                    label="Contact Phone"
                    name="emergency_contact_phone"
                    value={form.emergency_contact_phone}
                    onChange={handleChange}
                    placeholder="+251..."
                  />
                </div>
              </section>

              {/* Medical Notes */}

              <section>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
                  Medical Information
                </h3>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Medical Notes
                  </label>

                  <textarea
                    name="medical_notes"
                    value={form.medical_notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Enter relevant medical notes..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </section>

              {/* Buttons */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : editingPatient
                    ? "Update Patient"
                    : "Add Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          PATIENT DETAILS MODAL
      ======================================================= */}

      {showDetails && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Patient Details
                </h2>

                <p className="text-sm text-slate-500">
                  Patient #{selectedPatient.id}
                </p>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={21} />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {/* Profile */}

              <div className="mb-6 flex flex-col items-center gap-3 rounded-2xl bg-slate-50 p-6 text-center sm:flex-row sm:text-left">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                  {selectedPatient.full_name
                    ?.charAt(0)
                    ?.toUpperCase() || "P"}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedPatient.full_name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Registered{" "}
                    {formatDate(selectedPatient.created_at)}
                  </p>
                </div>
              </div>

              {/* Details */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Detail
                  icon={<Mail size={17} />}
                  label="Email"
                  value={selectedPatient.email}
                />

                <Detail
                  icon={<Phone size={17} />}
                  label="Phone"
                  value={selectedPatient.phone}
                />

                <Detail
                  icon={<Calendar size={17} />}
                  label="Date of Birth"
                  value={formatDate(
                    selectedPatient.date_of_birth
                  )}
                />

                <Detail
                  icon={<User size={17} />}
                  label="Age"
                  value={
                    calculateAge(
                      selectedPatient.date_of_birth
                    ) + " years"
                  }
                />

                <Detail
                  icon={<User size={17} />}
                  label="Gender"
                  value={selectedPatient.gender}
                />

                <Detail
                  icon={<User size={17} />}
                  label="Address"
                  value={selectedPatient.address}
                />

                <Detail
                  icon={<User size={17} />}
                  label="Emergency Contact"
                  value={
                    selectedPatient.emergency_contact_name
                  }
                />

                <Detail
                  icon={<Phone size={17} />}
                  label="Emergency Phone"
                  value={
                    selectedPatient.emergency_contact_phone
                  }
                />
              </div>

              {/* Medical Notes */}

              <div className="mt-5 rounded-xl border border-slate-200 p-4">
                <h4 className="mb-2 text-sm font-semibold text-slate-700">
                  Medical Notes
                </h4>

                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {selectedPatient.medical_notes ||
                    "No medical notes available."}
                </p>
              </div>

              {/* Footer */}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    openEditModal(selectedPatient);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Pencil size={16} />
                  Edit Patient
                </button>

                <button
                  onClick={() => setShowDetails(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// INPUT COMPONENT
// ============================================================

function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

// ============================================================
// DETAIL COMPONENT
// ============================================================

function Detail({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>

      <p className="break-words text-sm font-medium capitalize text-slate-700">
        {value || "Not provided"}
      </p>
    </div>
  );
}
