import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { ArrowLeft, Edit2, Check, X, Package, FileText, Image as ImageIcon, CornerUpLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getStatusBadgeClass, formatStatus } from "./AssetList";
import AllocateModal from "./AllocateModal";

export default function AssetDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("allocation"); // "allocation" | "maintenance"
  const [allocationHistory, setAllocationHistory] = useState([]);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [returning, setReturning] = useState(false);

  const canEdit = user?.role === "ADMIN" || user?.role === "ASSET_MANAGER";

  const fetchAsset = async () => {
    try {
      const res = await api.get(`/assets/${id}`);
      setAsset(res.data);
      setForm({
        name: res.data.name,
        serialNumber: res.data.serialNumber || "",
        condition: res.data.condition,
        location: res.data.location || "",
        isBookable: res.data.isBookable,
        status: res.data.status,
      });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) navigate("/assets");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/allocations/history/${id}`);
      setAllocationHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { 
    fetchAsset(); 
    fetchHistory();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      await api.put(`/assets/${id}`, form);
      setIsEditing(false);
      fetchAsset();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update asset");
      setSaving(false);
    }
  };

  const handleReturn = async () => {
    if (!window.confirm("Are you sure you want to mark this asset as returned?")) return;
    setReturning(true);
    try {
      await api.post(`/allocations/return/${id}`);
      fetchAsset();
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to return asset");
    } finally {
      setReturning(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  if (!asset) return null;

  const photoUrl = asset.photoPath ? `http://localhost:5000/uploads/${asset.photoPath}` : null;
  const docUrl = asset.documentPath ? `http://localhost:5000/uploads/${asset.documentPath}` : null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/assets" className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
              {!isEditing && (
                <span className={getStatusBadgeClass(asset.status)}>{formatStatus(asset.status)}</span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-0.5 font-mono">{asset.assetTag} • {asset.category.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditing && canEdit && (asset.status === "AVAILABLE" || asset.status === "ALLOCATED") && (
            <button onClick={() => setShowAllocateModal(true)} className="btn-primary btn-sm">
              Allocate
            </button>
          )}
          {!isEditing && canEdit && asset.status === "ALLOCATED" && (
            <button onClick={handleReturn} disabled={returning} className="btn-secondary btn-sm flex items-center gap-1.5">
              <CornerUpLeft className="w-4 h-4" /> {returning ? "Returning..." : "Return Asset"}
            </button>
          )}
          {canEdit && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="btn-secondary btn-sm flex items-center gap-1.5">
              <Edit2 className="w-4 h-4" /> Edit Asset
            </button>
          )}
          {isEditing && (
            <div className="flex items-center gap-2">
              <button onClick={() => setIsEditing(false)} className="btn-secondary btn-sm flex items-center gap-1.5" disabled={saving}>
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSave} className="btn-primary btn-sm flex items-center gap-1.5" disabled={saving}>
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />} Save
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Core Details Card */}
        <div className="lg:col-span-2 card p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-400" /> Asset Details
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-1">Name</p>
              {isEditing ? (
                <input type="text" name="name" className="input-field py-1.5 text-sm" value={form.name} onChange={handleChange} />
              ) : <p className="text-sm font-medium text-gray-900">{asset.name}</p>}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-1">Status (Manual Override)</p>
              {isEditing ? (
                <select name="status" className="input-field py-1.5 text-sm" value={form.status} onChange={handleChange}>
                  <option value="AVAILABLE">Available</option>
                  <option value="ALLOCATED">Allocated</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="LOST">Lost</option>
                  <option value="RETIRED">Retired</option>
                  <option value="DISPOSED">Disposed</option>
                </select>
              ) : <p className="text-sm text-gray-900">{formatStatus(asset.status)}</p>}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-1">Serial Number</p>
              {isEditing ? (
                <input type="text" name="serialNumber" className="input-field py-1.5 text-sm" value={form.serialNumber} onChange={handleChange} />
              ) : <p className="text-sm text-gray-900 font-mono">{asset.serialNumber || "—"}</p>}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-1">Condition</p>
              {isEditing ? (
                <select name="condition" className="input-field py-1.5 text-sm" value={form.condition} onChange={handleChange}>
                  <option value="NEW">New</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              ) : <p className="text-sm text-gray-900">{asset.condition}</p>}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-1">Location</p>
              {isEditing ? (
                <input type="text" name="location" className="input-field py-1.5 text-sm" value={form.location} onChange={handleChange} />
              ) : <p className="text-sm text-gray-900">{asset.location || "—"}</p>}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-1">Bookable</p>
              {isEditing ? (
                <div className="flex items-center gap-2 mt-1.5">
                  <input type="checkbox" name="isBookable" id="isBookable" checked={form.isBookable} onChange={handleChange} className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500" />
                  <label htmlFor="isBookable" className="text-sm text-gray-700">Yes, allow booking</label>
                </div>
              ) : <p className="text-sm text-gray-900">{asset.isBookable ? "Yes" : "No"}</p>}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-1">Acquisition</p>
              <p className="text-sm text-gray-900">
                {asset.acquisitionDate ? new Date(asset.acquisitionDate).toLocaleDateString() : "Unknown date"} 
                {asset.acquisitionCost ? ` • $${asset.acquisitionCost.toFixed(2)}` : ""}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-1">Registered By</p>
              <p className="text-sm text-gray-900">{asset.createdBy.name} on {new Date(asset.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Media Card */}
        <div className="card p-6 border border-gray-200 shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gray-400" /> Media & Docs
          </h2>
          
          <div className="flex-1 flex flex-col gap-4">
            {photoUrl ? (
              <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center h-48">
                <img src={photoUrl} alt={asset.name} className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center h-48 text-gray-400">
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm">No photo uploaded</span>
              </div>
            )}

            {docUrl ? (
              <a href={docUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">Purchase Document</p>
                  <p className="text-xs text-gray-500">Click to view</p>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 text-gray-400">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 opacity-50" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">No document</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Tabs */}
      <div className="card border border-gray-200 shadow-sm">
        <div className="flex border-b border-gray-200">
          <button 
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "allocation" ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            onClick={() => setActiveTab("allocation")}
          >
            Allocation History
          </button>
          <button 
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "maintenance" ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            onClick={() => setActiveTab("maintenance")}
          >
            Maintenance History
          </button>
        </div>
        
        {activeTab === "allocation" && (
          <div>
            {allocationHistory.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
                  <ArrowLeftRight className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Allocation History</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  This asset hasn't been allocated to anyone yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Allocated To</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Allocated By</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Allocated On</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Returned On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allocationHistory.map(h => (
                      <tr key={h.id}>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{h.allocatedToName} <span className="text-xs text-gray-500 font-normal ml-1">({h.allocatedToType})</span></td>
                        <td className="px-6 py-3 text-sm text-gray-600">{h.allocator?.name || "System"}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${h.action?.includes("RETURNED") ? "bg-emerald-100 text-emerald-800" : h.action?.includes("TRANSFER") ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                            {h.action || "ALLOCATED"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">{new Date(h.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{h.returnedDate ? new Date(h.returnedDate).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "maintenance" && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Maintenance History</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              No maintenance records found. Maintenance module coming in future phases.
            </p>
          </div>
        )}
      </div>

      {showAllocateModal && (
        <AllocateModal 
          asset={asset} 
          onClose={() => setShowAllocateModal(false)} 
          onAllocated={() => {
            setShowAllocateModal(false);
            fetchAsset();
            fetchHistory();
          }}
        />
      )}
    </div>
  );
}

// Dummy icons for empty states
import { ArrowLeftRight, Settings } from "lucide-react";
