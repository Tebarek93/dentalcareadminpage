import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Bell,
  CalendarDays,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function Settings() {
  const [settingsId, setSettingsId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [form, setForm] = useState({
    clinic_name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    logo_url: "",
    opening_time: "08:00",
    closing_time: "17:00",
    appointment_duration: 30,
    enable_online_booking: true,
    enable_email_notifications: true,
    enable_sms_notifications: false,
  });

  // ==========================================
  // LOAD SETTINGS
  // ==========================================

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const { data, error } =
        await supabase
          .from("clinic_settings")
          .select("*")
          .order("id", {
            ascending: true,
          })
          .limit(1)
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setSettingsId(data.id);

        setForm({
          clinic_name:
            data.clinic_name || "",

          description:
            data.description || "",

          phone:
            data.phone || "",

          email:
            data.email || "",

          address:
            data.address || "",

          logo_url:
            data.logo_url || "",

          opening_time:
            data.opening_time
              ? String(
                  data.opening_time
                ).slice(0, 5)
              : "08:00",

          closing_time:
            data.closing_time
              ? String(
                  data.closing_time
                ).slice(0, 5)
              : "17:00",

          appointment_duration:
            data.appointment_duration ||
            30,

          enable_online_booking:
            data.enable_online_booking ??
            true,

          enable_email_notifications:
            data.enable_email_notifications ??
            true,

          enable_sms_notifications:
            data.enable_sms_notifications ??
            false,
        });
      }
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load clinic settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // ==========================================
  // HANDLE CHANGE
  // ==========================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setMessage("");
    setError("");
  };

  // ==========================================
  // SAVE SETTINGS
  // ==========================================

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.clinic_name.trim()) {
      setError(
        "Clinic name is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const settingsData = {
        clinic_name:
          form.clinic_name.trim(),

        description:
          form.description.trim() ||
          null,

        phone:
          form.phone.trim() || null,

        email:
          form.email.trim() || null,

        address:
          form.address.trim() || null,

        logo_url:
          form.logo_url.trim() || null,

        opening_time:
          form.opening_time,

        closing_time:
          form.closing_time,

        appointment_duration:
          Number(
            form.appointment_duration
          ) || 30,

        enable_online_booking:
          form.enable_online_booking,

        enable_email_notifications:
          form.enable_email_notifications,

        enable_sms_notifications:
          form.enable_sms_notifications,

        updated_at:
          new Date().toISOString(),
      };

      let result;

      // Existing settings
      if (settingsId) {
        result = await supabase
          .from("clinic_settings")
          .update(settingsData)
          .eq("id", settingsId)
          .select()
          .single();
      } else {
        // First settings record
        result = await supabase
          .from("clinic_settings")
          .insert([
            settingsData,
          ])
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      if (result.data) {
        setSettingsId(
          result.data.id
        );
      }

      setMessage(
        "Clinic settings saved successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    fetchSettings();
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
              Loading settings...
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
          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <SettingsIcon size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Settings
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage your dental clinic information and preferences.
              </p>
            </div>

          </div>
        </div>

        <button
          type="button"
          onClick={resetForm}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Reload
        </button>

      </div>

      {/* ======================================
          SUCCESS
      ====================================== */}

      {message && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">

          <CheckCircle size={19} />

          <span>{message}</span>

        </div>
      )}

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">

          <AlertCircle size={19} />

          <span>{error}</span>

        </div>
      )}

      <form onSubmit={handleSave}>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* ==================================
              MAIN SETTINGS
          ================================== */}

          <div className="space-y-6 xl:col-span-2">

            {/* CLINIC INFORMATION */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 p-5 sm:p-6">

                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Building2 size={21} />
                  </div>

                  <div>

                    <h2 className="font-bold text-slate-900">
                      Clinic Information
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Basic information about your clinic.
                    </p>

                  </div>

                </div>

              </div>

              <div className="space-y-5 p-5 sm:p-6">

                {/* CLINIC NAME */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Clinic Name *
                  </label>

                  <input
                    type="text"
                    name="clinic_name"
                    value={
                      form.clinic_name
                    }
                    onChange={
                      handleChange
                    }
                    required
                    placeholder="Enter clinic name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* DESCRIPTION */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    rows="4"
                    placeholder="Describe your dental clinic..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* PHONE + EMAIL */}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone
                    </label>

                    <div className="relative">

                      <Phone
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="tel"
                        name="phone"
                        value={
                          form.phone
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Clinic phone number"
                        className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                    </div>

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email
                    </label>

                    <div className="relative">

                      <Mail
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="email"
                        name="email"
                        value={
                          form.email
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Clinic email"
                        className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                    </div>

                  </div>

                </div>

                {/* ADDRESS */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Address
                  </label>

                  <div className="relative">

                    <MapPin
                      size={17}
                      className="absolute left-3 top-4 text-slate-400"
                    />

                    <textarea
                      name="address"
                      value={
                        form.address
                      }
                      onChange={
                        handleChange
                      }
                      rows="3"
                      placeholder="Clinic address"
                      className="w-full resize-none rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                  </div>

                </div>

                {/* LOGO */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Logo URL
                  </label>

                  <input
                    type="url"
                    name="logo_url"
                    value={
                      form.logo_url
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="https://example.com/logo.png"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Enter a publicly accessible image URL for your clinic logo.
                  </p>

                </div>

              </div>

            </section>

            {/* BUSINESS HOURS */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 p-5 sm:p-6">

                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                    <Clock size={21} />
                  </div>

                  <div>

                    <h2 className="font-bold text-slate-900">
                      Business Hours
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Set your clinic's normal operating hours.
                    </p>

                  </div>

                </div>

              </div>

              <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Opening Time
                  </label>

                  <input
                    type="time"
                    name="opening_time"
                    value={
                      form.opening_time
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Closing Time
                  </label>

                  <input
                    type="time"
                    name="closing_time"
                    value={
                      form.closing_time
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

              </div>

            </section>

            {/* APPOINTMENT SETTINGS */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 p-5 sm:p-6">

                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                    <CalendarDays size={21} />
                  </div>

                  <div>

                    <h2 className="font-bold text-slate-900">
                      Appointment Settings
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Configure how appointments work.
                    </p>

                  </div>

                </div>

              </div>

              <div className="space-y-4 p-5 sm:p-6">

                {/* DURATION */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Default Appointment Duration
                  </label>

                  <select
                    name="appointment_duration"
                    value={
                      form.appointment_duration
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >

                    <option value="15">
                      15 minutes
                    </option>

                    <option value="30">
                      30 minutes
                    </option>

                    <option value="45">
                      45 minutes
                    </option>

                    <option value="60">
                      60 minutes
                    </option>

                    <option value="90">
                      90 minutes
                    </option>

                    <option value="120">
                      120 minutes
                    </option>

                  </select>

                </div>

                {/* ONLINE BOOKING */}

                <ToggleSetting
                  name="enable_online_booking"
                  checked={
                    form.enable_online_booking
                  }
                  onChange={
                    handleChange
                  }
                  title="Online Booking"
                  description="Allow patients to request appointments online."
                />

              </div>

            </section>

          </div>

          {/* ==================================
              RIGHT SIDEBAR
          ================================== */}

          <div className="space-y-6">

            {/* LOGO PREVIEW */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <h2 className="font-bold text-slate-900">
                Clinic Logo
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Preview your clinic logo.
              </p>

              <div className="mt-5 flex min-h-[180px] items-center justify-center rounded-2xl bg-slate-50">

                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt="Clinic logo"
                    className="max-h-32 max-w-[80%] object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className="text-center">

                    <Building2
                      size={40}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm text-slate-400">
                      No logo configured
                    </p>

                  </div>
                )}

              </div>

            </section>

            {/* NOTIFICATIONS */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 p-5">

                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                    <Bell size={21} />
                  </div>

                  <div>

                    <h2 className="font-bold text-slate-900">
                      Notifications
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Manage clinic notifications.
                    </p>

                  </div>

                </div>

              </div>

              <div className="space-y-1 p-5">

                <ToggleSetting
                  name="enable_email_notifications"
                  checked={
                    form.enable_email_notifications
                  }
                  onChange={
                    handleChange
                  }
                  title="Email Notifications"
                  description="Receive appointment notifications by email."
                />

                <ToggleSetting
                  name="enable_sms_notifications"
                  checked={
                    form.enable_sms_notifications
                  }
                  onChange={
                    handleChange
                  }
                  title="SMS Notifications"
                  description="Send appointment notifications by SMS."
                />

              </div>

            </section>

            {/* SAVE */}

            <div className="sticky bottom-4">

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                <Save size={18} />

                {saving
                  ? "Saving..."
                  : "Save Settings"}

              </button>

            </div>

          </div>

        </div>

      </form>

    </div>
  );
}

// ==========================================
// TOGGLE SETTING
// ==========================================

function ToggleSetting({
  name,
  checked,
  onChange,
  title,
  description,
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl p-3 transition hover:bg-slate-50">

      <div className="flex-1">

        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>

      </div>

      <div className="relative shrink-0">

        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />

        <div className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-blue-600" />

        <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />

      </div>

    </label>
  );
}