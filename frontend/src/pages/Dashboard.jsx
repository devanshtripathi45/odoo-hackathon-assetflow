import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { 
  PackageSearch, Package, CalendarClock, ArrowLeftRight, 
  AlertTriangle, Wrench, Clock, CornerUpLeft 
} from "lucide-react";
import { getBookingStatusInfo } from "./Booking";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/stats")
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleMaintenanceStub = (e) => {
    e.preventDefault();
    alert("Maintenance module coming in Phase 6!");
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  const isAdminOrManager = user?.role === "ADMIN" || user?.role === "ASSET_MANAGER";
  
  const KpiCard = ({ title, value, icon, bgColor, textColor }) => (
    <div className="card p-6 border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor} ${textColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your asset management system</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {isAdminOrManager && (
            <Link to="/assets/register" className="btn-secondary btn-sm bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
              Register Asset
            </Link>
          )}
          <Link to="/booking" className="btn-secondary btn-sm bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
            Book Resource
          </Link>
          <button onClick={handleMaintenanceStub} className="btn-primary btn-sm bg-brand-600 hover:bg-brand-700">
            Raise Maintenance
          </button>
        </div>
      </div>

      {stats?.type === "MANAGER" ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <KpiCard 
              title="Assets Available" 
              value={stats.data.kpis.assetsAvailable} 
              icon={<PackageSearch className="w-6 h-6" />}
              bgColor="bg-blue-50" textColor="text-blue-600"
            />
            <KpiCard 
              title="Assets Allocated" 
              value={stats.data.kpis.assetsAllocated} 
              icon={<Package className="w-6 h-6" />}
              bgColor="bg-indigo-50" textColor="text-indigo-600"
            />
            <KpiCard 
              title="Active Bookings" 
              value={stats.data.kpis.activeBookings} 
              icon={<CalendarClock className="w-6 h-6" />}
              bgColor="bg-emerald-50" textColor="text-emerald-600"
            />
            <KpiCard 
              title="Pending Transfers" 
              value={stats.data.kpis.pendingTransfers} 
              icon={<ArrowLeftRight className="w-6 h-6" />}
              bgColor="bg-amber-50" textColor="text-amber-600"
            />
            <KpiCard 
              title="Upcoming Returns" 
              value={stats.data.kpis.upcomingReturnsCount} 
              icon={<CornerUpLeft className="w-6 h-6" />}
              bgColor="bg-purple-50" textColor="text-purple-600"
            />
            <KpiCard 
              title="Maintenance Today" 
              value={stats.data.kpis.maintenanceToday} 
              icon={<Wrench className="w-6 h-6" />}
              bgColor="bg-gray-100" textColor="text-gray-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Overdue Returns */}
            <div className="card overflow-hidden border border-red-200 shadow-sm bg-red-50/30">
              <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" /> Overdue Returns
                </h2>
                <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {stats.data.overdueReturns.length}
                </span>
              </div>
              <div className="p-0">
                {stats.data.overdueReturns.length === 0 ? (
                  <p className="p-6 text-center text-gray-500">No overdue returns at this time.</p>
                ) : (
                  <ul className="divide-y divide-red-100">
                    {stats.data.overdueReturns.map(r => (
                      <li key={r.id} className="p-4 hover:bg-red-50/50 flex justify-between items-center transition-colors">
                        <div>
                          <p className="font-medium text-gray-900">{r.asset.name}</p>
                          <p className="text-sm text-gray-600">Held by {r.holderName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">{r.daysOverdue} days overdue</p>
                          <Link to={`/assets/${r.assetId}`} className="text-xs text-brand-600 hover:underline">View Asset</Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Upcoming Returns */}
            <div className="card overflow-hidden border border-amber-200 shadow-sm bg-amber-50/30">
              <div className="px-6 py-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" /> Upcoming Returns (Next 7 Days)
                </h2>
              </div>
              <div className="p-0">
                {stats.data.upcomingReturns.length === 0 ? (
                  <p className="p-6 text-center text-gray-500">No returns scheduled in the next 7 days.</p>
                ) : (
                  <ul className="divide-y divide-amber-100">
                    {stats.data.upcomingReturns.map(r => (
                      <li key={r.id} className="p-4 hover:bg-amber-50/50 flex justify-between items-center transition-colors">
                        <div>
                          <p className="font-medium text-gray-900">{r.asset.name}</p>
                          <p className="text-sm text-gray-600">Held by {r.holderName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-amber-700">Due in {r.daysUntil} day{r.daysUntil !== 1 ? 's' : ''}</p>
                          <Link to={`/assets/${r.assetId}`} className="text-xs text-brand-600 hover:underline">View Asset</Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Employee View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* My Overdue Returns */}
            {stats?.data?.myOverdueReturns?.length > 0 && (
              <div className="card overflow-hidden border border-red-200 shadow-sm bg-red-50/30">
                <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h2 className="text-lg font-semibold text-red-800">Action Required: Overdue Returns</h2>
                </div>
                <ul className="divide-y divide-red-100">
                  {stats.data.myOverdueReturns.map(r => (
                    <li key={r.id} className="p-4 flex justify-between items-center">
                      <p className="font-medium text-gray-900">{r.asset.name}</p>
                      <Link to={`/assets/${r.assetId}`} className="text-sm text-brand-600 font-medium hover:underline">Return Now</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* My Allocated Assets */}
            <div className="card overflow-hidden border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">My Allocated Assets</h2>
              </div>
              <ul className="divide-y divide-gray-100">
                {stats?.data?.myAllocations?.length === 0 ? (
                  <li className="p-6 text-center text-gray-500">You don't have any assets allocated to you.</li>
                ) : (
                  stats.data.myAllocations.map(r => (
                    <li key={r.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">{r.asset.name}</p>
                        <p className="text-xs font-mono text-brand-600">{r.asset.assetTag}</p>
                      </div>
                      <Link to={`/assets/${r.assetId}`} className="text-sm text-brand-600 hover:underline">View</Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* My Upcoming Bookings */}
          <div className="card overflow-hidden border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">My Active Bookings</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {stats?.data?.myBookings?.length === 0 ? (
                <li className="p-6 text-center text-gray-500">You have no active bookings.</li>
              ) : (
                stats.data.myBookings.map(b => {
                  const status = getBookingStatusInfo(b);
                  return (
                    <li key={b.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-gray-900">{b.asset.name}</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(b.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(b.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                        {new Date(b.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
              <Link to="/my-bookings" className="text-sm font-medium text-brand-600 hover:text-brand-800">
                View all booking history &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
