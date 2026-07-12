import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Plus, Pencil, X } from "lucide-react";

export default function DepartmentsTab() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", headId: "", parentId: "", status: "ACTIVE" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [deptRes, empRes] = await Promise.all([
        api.get("/departments"),
        api.get("/employees"),
      ]);
      setDepartments(deptRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", headId: "", parentId: "", status: "ACTIVE" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setForm({ name: dept.name, headId: dept.headId || "", parentId: dept.parentId || "", status: dept.status });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/departments/${editing.id}`, form);
      } else {
        await api.post("/departments", form);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (dept) => {
    try {
      await api.patch(`/departments/${dept.id}/status`, {
        status: dept.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{departments.length} department(s)</p>
        <button onClick={openCreate} className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      <div className="grid gap-4">
        {departments.map((dept) => (
          <div key={dept.id} className="card p-5 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                <span className={dept.status === "ACTIVE" ? "badge-active" : "badge-inactive"}>
                  {dept.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>Head: {dept.head?.name || "Not assigned"}</span>
                <span>Parent: {dept.parent?.name || "None"}</span>
                <span>Members: {dept._count?.members || 0}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(dept)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                <Pencil className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => toggleStatus(dept)}
                className={`btn-sm text-xs ${dept.status === "ACTIVE" ? "btn-danger" : "btn-primary"}`}
              >
                {dept.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
        {departments.length === 0 && (
          <div className="card p-8 text-center text-gray-500">No departments yet. Create one to get started.</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{editing ? "Edit Department" : "Create Department"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department Name</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department Head</label>
                <select className="input-field" value={form.headId} onChange={(e) => setForm({ ...form, headId: e.target.value })}>
                  <option value="">Select a head (optional)</option>
                  {employees.filter(emp => emp.status === "ACTIVE").map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} — {emp.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Department</label>
                <select className="input-field" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                  <option value="">None (top-level)</option>
                  {departments.filter((d) => d.id !== editing?.id).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
