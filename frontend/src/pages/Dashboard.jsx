import { LayoutDashboard, TrendingUp, Package, Users } from "lucide-react";

const stats = [
  { label: "Total Assets", value: "—", icon: Package, color: "bg-blue-500" },
  { label: "Active Employees", value: "—", icon: Users, color: "bg-emerald-500" },
  { label: "Allocations", value: "—", icon: TrendingUp, color: "bg-amber-500" },
  { label: "Pending Bookings", value: "—", icon: LayoutDashboard, color: "bg-purple-500" },
];

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your asset management system</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="card p-12 text-center">
        <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <LayoutDashboard className="w-8 h-8 text-brand-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Dashboard Analytics</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Rich analytics and charts coming in Phase 2. Head to Organization Setup to get started.
        </p>
      </div>
    </div>
  );
}
