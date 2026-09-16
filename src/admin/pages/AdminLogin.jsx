import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  LogIn,
  HeartPulse,
  AlertCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage(
        "Please enter your email and password."
      );

      return;
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error(
          "Login failed. Please try again."
        );
      }

      // Check admin role
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

      if (profileError) {
        await supabase.auth.signOut();
        throw profileError;
      }

      if (profile?.role !== "admin") {
        await supabase.auth.signOut();

        throw new Error(
          "This account does not have administrator access."
        );
      }

      navigate("/admin");
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error.message ||
          "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">

          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/20">
            <HeartPulse size={32} />
          </div>

          <h1 className="text-2xl font-bold text-white mt-5">
            DentalCare
          </h1>

          <p className="text-slate-400 mt-1">
            Administrator Portal
          </p>

        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">

          <h2 className="text-2xl font-bold text-slate-900">
            Welcome Back
          </h2>

          <p className="text-slate-500 mt-2">
            Sign in to manage your dental clinic.
          </p>

          {errorMessage && (
            <div className="mt-6 flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">

              <AlertCircle
                size={20}
                className="shrink-0"
              />

              <p className="text-sm">
                {errorMessage}
              </p>

            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >

            {/* Email */}
            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>

              <div className="relative">

                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="admin@example.com"
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

            {/* Password */}
            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>

              <div className="relative">

                <Lock
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold transition"
            >

              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />

                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={19} />

                  Sign In
                </>
              )}

            </button>

          </form>

        </div>

      </div>

    </div>
  );
}