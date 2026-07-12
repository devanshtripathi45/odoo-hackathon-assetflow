import { useState, useEffect } from "react";
import api from "../lib/api";
import { Check, X, ArrowLeftRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Allocation() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const canApprove = user?.role === "ADMIN" || user?.role === "ASSET_MANAGER";

  const fetchRequests = async () => {
    try {
      const res = await api.get("/allocations/requests");
      // If employee, only show their own requests. Admins see all.
      if (canApprove) {
        setRequests(res.data);
      } else {
        setRequests(res.data.filter(r => r.requesterId === user.id));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load transfer requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleAction = async (id, action) => {
    setProcessingId(id);
    setError("");
    try {
      await api.post(`/allocations/requests/${id}/${action}`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} request`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Allocations & Transfers</h1>
        <p className="text-gray-500 mt-1">Manage asset assignments and transfer requests</p>
      </div>

      {error && <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="card overflow-hidden border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-gray-400" /> Transfer Requests
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Asset</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Current Holder</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Requested By</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  {canApprove && <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.length === 0 ? (
                  <tr><td colSpan={canApprove ? "6" : "5"} className="px-6 py-8 text-center text-gray-500">No transfer requests found.</td></tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-brand-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{req.asset.name}</div>
                        <div className="text-xs text-brand-600 font-mono">{req.asset.assetTag}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {req.currentHolderName} <span className="text-xs text-gray-500 font-normal">({req.currentHolderType})</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{req.requester.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{req.reason || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          req.status === "REQUESTED" ? "bg-amber-100 text-amber-800" :
                          req.status === "RE_ALLOCATED" ? "bg-emerald-100 text-emerald-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {req.status.replace("_", " ")}
                        </span>
                      </td>
                      {canApprove && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {req.status === "REQUESTED" ? (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleAction(req.id, "reject")}
                                disabled={processingId === req.id}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <X className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleAction(req.id, "approve")}
                                disabled={processingId === req.id}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Processed</span>
                          )}
                        </td>
                      )}
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
