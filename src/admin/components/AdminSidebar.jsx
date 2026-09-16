import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Stethoscope,
  ClipboardList,
  Clock3,
  CreditCard,
  Settings,
  X,
  LogOut,
  HeartPulse,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AdminSidebar({
  mobileOpen,
  setMobileOpen,
}) {
  const navigate = useNavigate();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Appointments",
      path: "/admin/appointments",
      icon: CalendarDays,
    },
    {
      name: "Patients",
      path: "/admin/patients",
      icon: Users,
    },
    {
      name: "Doctors",
      path: "/admin/doctors",
      icon: Stethoscope,
    },
    {
      name: "Services",
      path: "/admin/services",
      icon: ClipboardList,
    },
    {
      name: "Schedule",
      path: "/admin/schedule",
      icon: Clock3,
    },
    {
      name: "Payments",
      path: "/admin/payments",
      icon: CreditCard,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();

    navigate("/admin/login");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed
          top-0
          left-0
          z-50
          h-screen
          w-72
          bg-slate-950
          text-white
          flex
          flex-col
          transition-transform
          duration-300
          lg:translate-x-0
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* Logo */}
        <div className="h-20 px-5 border-b border-slate-800 flex items-center justify-between">

          <NavLink
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center">
              <HeartPulse size={24} />
            </div>

            <div>
              <h1 className="font-bold text-lg">
                DentalCare
              </h1>

              <p className="text-xs text-slate-400">
                Administration
              </p>
            </div>
          </NavLink>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800"
          >
            <X size={22} />
          </button>

        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">

          <p className="px-3 mb-3 text-xs uppercase tracking-wider text-slate-500 font-semibold">
            Main Menu
          </p>

          <div className="space-y-1">

            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className={({ isActive }) =>
                    `
                    flex items-center gap-3
                    px-4 py-3
                    rounded-xl
                    text-sm font-medium
                    transition
                    ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                    }
                    `
                  }
                >
                  <Icon size={19} />

                  <span>
                    {item.name}
                  </span>
                </NavLink>
              );
            })}

          </div>

        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-slate-800">

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
          >
            <LogOut size={19} />

            <span className="font-medium">
              Logout
            </span>
          </button>

        </div>

      </aside>
    </>
  );
}