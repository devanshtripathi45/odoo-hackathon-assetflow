import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Building2,
  PackageSearch,
  ArrowLeftRight,
  CalendarClock,
  Boxes,
  Package,
  CalendarDays,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/org-setup", label: "Organization", icon: Building2, adminOnly: true },
  { to: "/assets", label: "Assets", icon: PackageSearch },
  { to: "/allocation", label: "Allocation", icon: ArrowLeftRight },
  { to: "/booking", label: "Booking", icon: CalendarClock },
  { to: "/my-bookings", label: "My Bookings", icon: CalendarDays },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar text-white flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">AssetFlow</h1>
            <p className="text-[11px] text-gray-400 -mt-0.5">Enterprise ERP</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => !item.adminOnly || user?.role === "ADMIN")
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20"
                    : "text-gray-400 hover:text-white hover:bg-sidebar-hover"
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-[11px] text-gray-500 text-center">
          AssetFlow v1.0 • Phase 1
        </p>
      </div>
    </aside>
  );
}
