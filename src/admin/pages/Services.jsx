import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  Stethoscope,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function Services() {
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "30",
    is_active: true,
  });

  // ============================
  // FETCH SERVICES
  // ============================

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setServices(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // ============================
  // FORM CHANGE
  // ============================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ============================
  // OPEN ADD
  // ============================

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      name: "",
      description: "",
      price: "",
      duration_minutes: "30",
      is_active: true,
    });

    setShowModal(true);
  };

  // ============================
  // OPEN EDIT
  // ============================

  const openEditModal = (service) => {
    setEditingId(service.id);

    setForm({
      name: service.name || "",
      description: service.description || "",
      price: service.price ?? "",
      duration_minutes: service.duration_minutes ?? "30",
      is_active: service.is_active ?? true,
    });

    setShowModal(true);
  };

  // ============================
  // SAVE SERVICE
  // ============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Service name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const serviceData = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        duration_minutes: Number(form.duration_minutes) || 30,
        is_active: form.is_active,
      };

      let result;

      if (editingId) {
        result = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", editingId);
      } else {
        result = await supabase
          .from("services")
          .insert([serviceData]);
      }

      if (result.error) throw result.error;

      setShowModal(false);
      setEditingId(null);

      setForm({
        name: "",
        description: "",
        price: "",
        duration_minutes: "30",
        is_active: true,
      });

      await fetchServices();
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to save service.");
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // DELETE SERVICE
  // ============================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchServices();
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to delete service.");
    }
  };

  // ============================
  // VIEW DETAILS
  // ============================

  const openDetails = (service) => {
    setSelectedService(service);
    setShowDetails(true);
  };

  // ============================
  // SEARCH
  // ============================

  const filteredServices = services.filter((service) => {
    const text = search.toLowerCase();

    return (
      service.name?.toLowerCase().includes(text) ||
      service.description?.toLowerCase().includes(text)
    );
  });

  // ============================
  // STATISTICS
  // ============================

  const totalServices = services.length;

  const activeServices = services.filter(
    (service) => service.is_active
  ).length;

  const inactiveServices = services.filter(
    (service) => !service.is_active
  ).length;

  const averagePrice =
    services.length > 0
      ? services.reduce(
          (total, service) => total + Number(service.price || 0),
          0
        ) / services.length
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* ================= HEADER ================= */}

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Dental Services
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage the dental services provided by your clinic.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={19} />
          Add Service
        </button>
      </div>

      {/* ================= ERROR ================= */}

      {error && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>

          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ================= STATS ================= */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Services"
          value={totalServices}
          icon={<Stethoscope size={21} />}
          iconClass="bg-blue-100 text-blue-600"
        />

        <StatCard
          title="Active Services"
          value={activeServices}
          icon={<CheckCircle size={21} />}
          iconClass="bg-emerald-100 text-emerald-600"
        />

        <StatCard
          title="Inactive Services"
          value={inactiveServices}
          icon={<XCircle size={21} />}
          iconClass="bg-red-100 text-red-600"
        />

        <StatCard
          title="Average Price"
          value={`${averagePrice.toFixed(2)} ETB`}
          icon={<DollarSign size={21} />}
          iconClass="bg-indigo-100 text-indigo-600"
        />
      </div>

      {/* ================= CONTENT ================= */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* SEARCH */}

        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="relative max-w-md">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* ================= LOADING ================= */}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          </div>
        ) : filteredServices.length === 0 ? (
          /* ================= EMPTY ================= */

          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 rounded-full bg-blue-50 p-4 text-blue-600">
              <Stethoscope size={30} />
            </div>

            <h3 className="text-lg font-semibold text-slate-900">
              No services found
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              {search
                ? "No services match your search."
                : "Start by adding your first dental service."}
            </p>

            {!search && (
              <button
                onClick={openAddModal}
                className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Service
              </button>
            )}
          </div>
        ) : (
          /* ================= TABLE ================= */

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Service
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Price
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Duration
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {service.name}
                        </p>

                        <p className="mt-1 max-w-sm truncate text-sm text-slate-500">
                          {service.description || "No description"}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-900">
                        {Number(service.price || 0).toFixed(2)} ETB
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock size={16} />
                        {service.duration_minutes || 30} min
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {service.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle size={14} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                          <XCircle size={14} />
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openDetails(service)}
                          title="View"
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() => openEditModal(service)}
                          title="Edit"
                          className="rounded-lg border border-blue-100 p-2 text-blue-600 transition hover:bg-blue-50"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(service.id)}
                          title="Delete"
                          className="rounded-lg border border-red-100 p-2 text-red-600 transition hover:bg-red-50"
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
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId ? "Edit Service" : "Add Service"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingId
                    ? "Update the service information."
                    : "Add a new dental service."}
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              {/* Service Name */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Service Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Dental Cleaning"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Description */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Describe this dental service..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Price + Duration */}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Price (ETB)
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Duration (minutes)
                  </label>

                  <input
                    type="number"
                    name="duration_minutes"
                    value={form.duration_minutes}
                    onChange={handleChange}
                    min="1"
                    placeholder="30"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Status */}

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Active Service
                  </p>

                  <p className="text-xs text-slate-500">
                    Active services can be displayed and booked.
                  </p>
                </div>
              </label>

              {/* Buttons */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Service"
                    : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DETAILS MODAL ================= */}

      {showDetails && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-xl font-bold text-slate-900">
                Service Details
              </h2>

              <button
                onClick={() => setShowDetails(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="rounded-xl bg-blue-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-600 p-3 text-white">
                    <Stethoscope size={24} />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedService.name}
                    </h3>

                    <p className="text-sm text-slate-500">
                      Dental Service
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
                  Description
                </p>

                <p className="text-sm leading-6 text-slate-700">
                  {selectedService.description ||
                    "No description available."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Price</p>

                  <p className="mt-1 font-bold text-slate-900">
                    {Number(selectedService.price || 0).toFixed(2)} ETB
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Duration</p>

                  <p className="mt-1 font-bold text-slate-900">
                    {selectedService.duration_minutes || 30} minutes
                  </p>
                </div>
              </div>

              <div>
                {selectedService.is_active ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle size={16} />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                    <XCircle size={16} />
                    Inactive
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 p-5">
              <button
                onClick={() => setShowDetails(false)}
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

// ============================
// STAT CARD
// ============================

function StatCard({ title, value, icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}