import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Stethoscope,
  Eye,
  Pencil,
  Trash2,
  X,
  Loader2,
  Mail,
  Phone,
  Calendar,
  User,
  Award,
  Clock,
  AlertCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  specialization: "",
  license_number: "",
  experience_years: "",
  gender: "",
  bio: "",
  consultation_fee: "",
  available_days: "",
  available_time: "",
};

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // FETCH DOCTORS
  // ============================================================

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setDoctors(data || []);
    } catch (err) {
      console.error("Fetch doctors error:", err);
      setError(err.message || "Unable to load doctors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredDoctors = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return doctors;
    }

    return doctors.filter((doctor) => {
      return (
        doctor.full_name?.toLowerCase().includes(value) ||
        doctor.email?.toLowerCase().includes(value) ||
        doctor.phone?.toLowerCase().includes(value) ||
        doctor.specialization
          ?.toLowerCase()
          .includes(value) ||
        doctor.license_number
          ?.toLowerCase()
          .includes(value)
      );
    });
  }, [doctors, search]);

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // ADD DOCTOR
  // ============================================================

  const openAddModal = () => {
    setEditingDoctor(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  // ============================================================
  // EDIT DOCTOR
  // ============================================================

  const openEditModal = (doctor) => {
    setEditingDoctor(doctor);

    setForm({
      full_name: doctor.full_name || "",
      email: doctor.email || "",
      phone: doctor.phone || "",
      specialization: doctor.specialization || "",
      license_number: doctor.license_number || "",
      experience_years:
        doctor.experience_years !== null &&
        doctor.experience_years !== undefined
          ? String(doctor.experience_years)
          : "",
      gender: doctor.gender || "",
      bio: doctor.bio || "",
      consultation_fee:
        doctor.consultation_fee !== null &&
        doctor.consultation_fee !== undefined
          ? String(doctor.consultation_fee)
          : "",
      available_days: doctor.available_days || "",
      available_time: doctor.available_time || "",
    });

    setError("");
    setShowModal(true);
  };

  // ============================================================
  // SAVE DOCTOR
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_name.trim()) {
      setError("Doctor name is required.");
      return;
    }

    if (!form.specialization.trim()) {
      setError("Specialization is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const doctorData = {
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        specialization:
          form.specialization.trim() || null,
        license_number:
          form.license_number.trim() || null,
        experience_years:
          form.experience_years !== ""
            ? Number(form.experience_years)
            : null,
        gender: form.gender || null,
        bio: form.bio.trim() || null,
        consultation_fee:
          form.consultation_fee !== ""
            ? Number(form.consultation_fee)
            : null,
        available_days:
          form.available_days.trim() || null,
        available_time:
          form.available_time.trim() || null,
      };

      if (editingDoctor) {
        const { error } = await supabase
          .from("doctors")
          .update(doctorData)
          .eq("id", editingDoctor.id);

        if (error) {
          throw error;
        }

        setSuccess("Doctor updated successfully.");
      } else {
        const { error } = await supabase
          .from("doctors")
          .insert([doctorData]);

        if (error) {
          throw error;
        }

        setSuccess("Doctor added successfully.");
      }

      setShowModal(false);
      setForm(emptyForm);
      setEditingDoctor(null);

      await fetchDoctors();
    } catch (err) {
      console.error("Save doctor error:", err);
      setError(err.message || "Unable to save doctor.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE DOCTOR
  // ============================================================

  const handleDelete = async (doctor) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Dr. ${doctor.full_name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      const { error } = await supabase
        .from("doctors")
        .delete()
        .eq("id", doctor.id);

      if (error) {
        throw error;
      }

      setDoctors((prev) =>
        prev.filter((item) => item.id !== doctor.id)
      );

      setSuccess("Doctor deleted successfully.");

      if (selectedDoctor?.id === doctor.id) {
        setSelectedDoctor(null);
        setShowDetails(false);
      }
    } catch (err) {
      console.error("Delete doctor error:", err);
      setError(err.message || "Unable to delete doctor.");
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // VIEW DETAILS
  // ============================================================

  const openDetails = (doctor) => {
    setSelectedDoctor(doctor);
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Stethoscope size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Doctors
              </h1>

              <p className="text-sm text-slate-500">
                Manage your dental clinic doctors
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Doctor
        </button>
      </div>

      {/* ======================================================
          ALERTS
      ======================================================= */}

      {error && !showModal && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">
              Something went wrong
            </p>

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
          STAT CARDS
      ======================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total Doctors
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {doctors.length}
              </h2>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Stethoscope size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Specializations
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {
                  new Set(
                    doctors
                      .map((doctor) => doctor.specialization)
                      .filter(Boolean)
                  ).size
                }
              </h2>
            </div>

            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <Award size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                With Contact Info
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {
                  doctors.filter(
                    (doctor) =>
                      doctor.email || doctor.phone
                  ).length
                }
              </h2>
            </div>

            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <Phone size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          MAIN TABLE
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
              placeholder="Search doctors..."
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
                Loading doctors...
              </p>
            </div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          /* Empty State */

          <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-5 text-slate-400">
              <Stethoscope size={35} />
            </div>

            <h3 className="text-lg font-semibold text-slate-800">
              {search
                ? "No doctors found"
                : "No doctors yet"}
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              {search
                ? "Try changing your search term."
                : "Add your first doctor to start managing your dental team."}
            </p>

            {!search && (
              <button
                onClick={openAddModal}
                className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Doctor
              </button>
            )}
          </div>
        ) : (
          /* Table */

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Doctor
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Specialization
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Contact
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Experience
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Fee
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredDoctors.map((doctor) => (
                  <tr
                    key={doctor.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    {/* Doctor */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                          {doctor.full_name
                            ?.charAt(0)
                            ?.toUpperCase() || "D"}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            Dr. {doctor.full_name}
                          </p>

                          <p className="text-xs text-slate-500">
                            License:{" "}
                            {doctor.license_number ||
                              "Not provided"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Specialization */}

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                        {doctor.specialization ||
                          "Not specified"}
                      </span>
                    </td>

                    {/* Contact */}

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {doctor.email && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail size={14} />
                            {doctor.email}
                          </div>
                        )}

                        {doctor.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone size={14} />
                            {doctor.phone}
                          </div>
                        )}

                        {!doctor.email &&
                          !doctor.phone && (
                            <span className="text-sm text-slate-400">
                              No contact
                            </span>
                          )}
                      </div>
                    </td>

                    {/* Experience */}

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {doctor.experience_years !==
                        null &&
                      doctor.experience_years !==
                        undefined
                        ? `${doctor.experience_years} years`
                        : "—"}
                    </td>

                    {/* Fee */}

                    <td className="px-5 py-4 text-sm font-medium text-slate-700">
                      {doctor.consultation_fee !==
                        null &&
                      doctor.consultation_fee !==
                        undefined
                        ? `${Number(
                            doctor.consultation_fee
                          ).toLocaleString()}`
                        : "—"}
                    </td>

                    {/* Actions */}

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            openDetails(doctor)
                          }
                          title="View doctor"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() =>
                            openEditModal(doctor)
                          }
                          title="Edit doctor"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(doctor)
                          }
                          disabled={deleting}
                          title="Delete doctor"
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

        {/* Count */}

        {!loading && filteredDoctors.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-4">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredDoctors.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {doctors.length}
              </span>{" "}
              doctors
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
            {/* Header */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingDoctor
                    ? "Edit Doctor"
                    : "Add Doctor"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingDoctor
                    ? "Update doctor information"
                    : "Create a new doctor profile"}
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={21} />
              </button>
            </div>

            {/* Form */}

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
                    placeholder="Enter doctor name"
                    required
                  />

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="doctor@example.com"
                  />

                  <Input
                    label="Phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+251..."
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

                      <option value="male">
                        Male
                      </option>

                      <option value="female">
                        Female
                      </option>

                      <option value="other">
                        Other
                      </option>
                    </select>
                  </div>

                  <Input
                    label="Specialization"
                    name="specialization"
                    value={form.specialization}
                    onChange={handleChange}
                    placeholder="e.g. Orthodontist"
                    required
                  />

                  <Input
                    label="License Number"
                    name="license_number"
                    value={form.license_number}
                    onChange={handleChange}
                    placeholder="Professional license number"
                  />

                  <Input
                    label="Experience (Years)"
                    name="experience_years"
                    type="number"
                    min="0"
                    value={form.experience_years}
                    onChange={handleChange}
                    placeholder="e.g. 8"
                  />

                  <Input
                    label="Consultation Fee"
                    name="consultation_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.consultation_fee}
                    onChange={handleChange}
                    placeholder="e.g. 500"
                  />
                </div>
              </section>

              {/* Availability */}

              <section>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
                  Availability
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label="Available Days"
                    name="available_days"
                    value={form.available_days}
                    onChange={handleChange}
                    placeholder="e.g. Monday, Wednesday, Friday"
                  />

                  <Input
                    label="Available Time"
                    name="available_time"
                    value={form.available_time}
                    onChange={handleChange}
                    placeholder="e.g. 09:00 AM - 05:00 PM"
                  />
                </div>
              </section>

              {/* Bio */}

              <section>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
                  Professional Information
                </h3>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Doctor Bio
                  </label>

                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Write a short professional biography..."
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
                    : editingDoctor
                    ? "Update Doctor"
                    : "Add Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          DETAILS MODAL
      ======================================================= */}

      {showDetails && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Doctor Details
                </h2>

                <p className="text-sm text-slate-500">
                  Doctor #{selectedDoctor.id}
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

              <div className="mb-6 flex flex-col items-center gap-4 rounded-2xl bg-slate-50 p-6 text-center sm:flex-row sm:text-left">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                  {selectedDoctor.full_name
                    ?.charAt(0)
                    ?.toUpperCase() || "D"}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Dr. {selectedDoctor.full_name}
                  </h3>

                  <p className="mt-1 font-medium text-blue-600">
                    {selectedDoctor.specialization ||
                      "Dental Doctor"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Registered{" "}
                    {formatDate(
                      selectedDoctor.created_at
                    )}
                  </p>
                </div>
              </div>

              {/* Information */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Detail
                  icon={<Mail size={17} />}
                  label="Email"
                  value={selectedDoctor.email}
                />

                <Detail
                  icon={<Phone size={17} />}
                  label="Phone"
                  value={selectedDoctor.phone}
                />

                <Detail
                  icon={<Award size={17} />}
                  label="Specialization"
                  value={selectedDoctor.specialization}
                />

                <Detail
                  icon={<Award size={17} />}
                  label="License Number"
                  value={selectedDoctor.license_number}
                />

                <Detail
                  icon={<Calendar size={17} />}
                  label="Experience"
                  value={
                    selectedDoctor.experience_years !==
                      null &&
                    selectedDoctor.experience_years !==
                      undefined
                      ? `${selectedDoctor.experience_years} years`
                      : null
                  }
                />

                <Detail
                  icon={<User size={17} />}
                  label="Gender"
                  value={selectedDoctor.gender}
                />

                <Detail
                  icon={<Clock size={17} />}
                  label="Available Days"
                  value={selectedDoctor.available_days}
                />

                <Detail
                  icon={<Clock size={17} />}
                  label="Available Time"
                  value={selectedDoctor.available_time}
                />

                <Detail
                  icon={<Award size={17} />}
                  label="Consultation Fee"
                  value={
                    selectedDoctor.consultation_fee !==
                      null &&
                    selectedDoctor.consultation_fee !==
                      undefined
                      ? Number(
                          selectedDoctor.consultation_fee
                        ).toLocaleString()
                      : null
                  }
                />
              </div>

              {/* Bio */}

              <div className="mt-5 rounded-xl border border-slate-200 p-4">
                <h4 className="mb-2 text-sm font-semibold text-slate-700">
                  Professional Bio
                </h4>

                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {selectedDoctor.bio ||
                    "No professional biography available."}
                </p>
              </div>

              {/* Footer */}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    setShowDetails(false);
                    openEditModal(selectedDoctor);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Pencil size={16} />
                  Edit Doctor
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
// INPUT
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
// DETAIL
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
