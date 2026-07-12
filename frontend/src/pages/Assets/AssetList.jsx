import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { Plus, Search, Filter } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function getStatusBadgeClass(status) {
  switch (status) {
    case "AVAILABLE": return "badge bg-emerald-100 text-emerald-800";
    case "ALLOCATED": return "badge bg-blue-100 text-blue-800";
    case "RESERVED": return "badge bg-purple-100 text-purple-800";
    case "UNDER_MAINTENANCE": return "badge bg-yellow-100 text-yellow-800";
    case "LOST": return "badge bg-red-100 text-red-800";
    case "RETIRED": 
    case "DISPOSED": return "badge bg-gray-200 text-gray-700";
    default: return "badge bg-gray-100 text-gray-700";
  }
}

export function formatStatus(status) {
  return status.replace(/_/g, " ");
}

export default function AssetList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = async () => {
    try {
      const [assetsRes, catsRes] = await Promise.all([
        api.get("/assets", { params: { search, category: categoryFilter, status: statusFilter } }),
        api.get("/assets/categories")
      ]);
      setAssets(assetsRes.data);
      setCategories(catsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, categoryFilter, statusFilter]);

  const canRegister = user?.role === "ADMIN" || user?.role === "ASSET_MANAGER";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Directory</h1>
          <p className="text-gray-500 mt-1">Manage and track all company assets</p>
        </div>
        {canRegister && (
          <Link to="/assets/register" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Register Asset
          </Link>
        )}
      </div>

      <div className="card mb-6 p-4 flex flex-wrap gap-4 items-center bg-white shadow-sm border border-gray-200">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by tag, name, serial..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48 relative">
          <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            className="input-field pl-9"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="w-48 relative">
           <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            className="input-field pl-9"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="RESERVED">Reserved</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="LOST">Lost</option>
            <option value="RETIRED">Retired</option>
            <option value="DISPOSED">Disposed</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Asset Tag</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assets.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No assets found matching the criteria.</td></tr>
                ) : (
                  assets.map((asset) => (
                    <tr 
                      key={asset.id} 
                      className="hover:bg-brand-50/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/assets/${asset.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-semibold text-brand-700 bg-brand-50 px-2 py-1 rounded">{asset.assetTag}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{asset.name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{asset.category.name}</td>
                      <td className="px-6 py-4">
                        <span className={getStatusBadgeClass(asset.status)}>
                          {formatStatus(asset.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{asset.location || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-400 italic">Unallocated</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
