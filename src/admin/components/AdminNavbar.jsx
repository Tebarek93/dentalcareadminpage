import {
  Menu,
  Bell,
  UserCircle,
} from "lucide-react";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminNavbar({
  setMobileOpen,
}) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    setProfile(data);
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-30">

      <div className="h-full px-4 sm:px-6 flex items-center justify-between">

        {/* Left */}
        <div className="flex items-center gap-4">

          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 text-slate-700"
          >
            <Menu size={23} />
          </button>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Admin Dashboard
            </h2>

            <p className="hidden sm:block text-xs text-slate-500">
              Manage your dental clinic
            </p>
          </div>

        </div>

        {/* Right */}
        <div className="flex items-center gap-3">

          <button className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-600">

            <Bell size={21} />

            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />

          </button>

          <div className="hidden sm:block h-8 w-px bg-slate-200" />

          <div className="flex items-center gap-3">

            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "Admin"}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <UserCircle size={25} />
              </div>
            )}

            <div className="hidden md:block">

              <p className="text-sm font-semibold text-slate-900">
                {profile?.full_name || "Administrator"}
              </p>

              <p className="text-xs text-slate-500">
                {profile?.email || ""}
              </p>

            </div>

          </div>

        </div>

      </div>

    </header>
  );
}