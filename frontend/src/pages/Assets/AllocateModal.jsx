import { useState, useEffect } from "react";
import api from "../../lib/api";
import { X } from "lucide-react";

export default function AllocateModal({ asset, onClose, onAllocated }) {
  const [allocationType, setAllocationType] = useState("EMPLOYEE");
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Conflict state
  const [conflictData, setConflictData] = useState(null);
  const [transferReason, setTransferReason] = useState("");

  useEffect(() => {
    // Fetch employees and departments
    Promise.all([
      api.get("/employees"),
      api.get("/departments")
    ]).then(([empRes, deptRes]) => {
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
      if (empRes.data.length > 0) setSelectedId(empRes.data[0].id);
    }).catch(err => console.error("Failed to load options", err));
  }, []);

  const handleAllocate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/allocations", {
        assetId: asset.id,
        allocatedToType: allocationType,
        allocatedToId: selectedId,
        expectedReturnDate: expectedReturnDate || null,
      });
      onAllocated();
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictData(err.response.data);
      } else {
        setError(err.response?.data?.error || "Failed to allocate asset");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTransfer = async () => {
    setError("");
    setLoading(true);
    try {
      await api.post("/allocations/requests", {
        assetId: asset.id,
        reason: transferReason
      });
      onAllocated(); // Request sent successfully, close and refresh
    } catch (err) {
      setError(err.response?.data?.error || "Failed to request transfer");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {conflictData ? "Asset Not Available" : `Allocate ${asset.assetTag}`}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          {conflictData ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="text-amber-800 font-semibold mb-1">Conflict Detected</h3>
                <p className="text-amber-700 text-sm">
                  {conflictData.error}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for Transfer (Optional)</label>
                <textarea
                  className="input-field min-h-[80px]"
                  placeholder="Why do you need this asset?"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button type="button" onClick={handleRequestTransfer} disabled={loading} className="btn-primary flex-1">
                  {loading ? "Requesting..." : "Request Transfer"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Allocate To</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="allocationType" 
                      value="EMPLOYEE" 
                      checked={allocationType === "EMPLOYEE"} 
                      onChange={() => { setAllocationType("EMPLOYEE"); setSelectedId(employees[0]?.id || ""); }}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700">Employee</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="allocationType" 
                      value="DEPARTMENT" 
                      checked={allocationType === "DEPARTMENT"} 
                      onChange={() => { setAllocationType("DEPARTMENT"); setSelectedId(departments[0]?.id || ""); }}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700">Department</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select {allocationType === "EMPLOYEE" ? "Employee" : "Department"}
                </label>
                <select 
                  className="input-field" 
                  value={selectedId} 
                  onChange={(e) => setSelectedId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select option...</option>
                  {allocationType === "EMPLOYEE" 
                    ? employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.email})</option>)
                    : departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected Return Date (Optional)</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={expectedReturnDate} 
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-gray-100">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading || !selectedId} className="btn-primary flex-1">
                  {loading ? "Allocating..." : "Allocate Asset"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
