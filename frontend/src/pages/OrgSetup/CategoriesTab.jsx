import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Plus, Pencil, X, Trash2 } from "lucide-react";

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", customFields: [] });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", customFields: [] });
    setError("");
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    const fields = typeof cat.customFields === "string" ? JSON.parse(cat.customFields) : (cat.customFields || []);
    setForm({ name: cat.name, description: cat.description || "", customFields: fields });
    setError("");
    setShowModal(true);
  };

  const addField = () => {
    setForm({ ...form, customFields: [...form.customFields, { name: "", type: "text" }] });
  };

  const removeField = (idx) => {
    setForm({ ...form, customFields: form.customFields.filter((_, i) => i !== idx) });
  };

  const updateField = (idx, key, value) => {
    const fields = [...form.customFields];
    fields[idx] = { ...fields[idx], [key]: value };
    setForm({ ...form, customFields: fields });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { ...form, customFields: form.customFields.filter((f) => f.name.trim()) };
      if (editing) {
        await api.put(`/categories/${editing.id}`, payload);
      } else {
        await api.post("/categories", payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{categories.length} category(s)</p>
        <button onClick={openCreate} className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const fields = typeof cat.customFields === "string" ? JSON.parse(cat.customFields) : (cat.customFields || []);
          return (
            <div key={cat.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  {cat.description && <p className="text-sm text-gray-500 mt-0.5">{cat.description}</p>}
                </div>
                <button onClick={() => openEdit(cat)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              {fields.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase mb-2">Custom Fields</p>
                  <div className="flex flex-wrap gap-1.5">
                    {fields.map((f, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                        {f.name} <span className="ml-1 text-gray-400">({f.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {categories.length === 0 && (
          <div className="card p-8 text-center text-gray-500 col-span-full">No categories yet.</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 modal-content max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{editing ? "Edit Category" : "Create Category"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Name</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea className="input-field" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Custom Fields</label>
                  <button type="button" onClick={addField} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Field
                  </button>
                </div>
                <div className="space-y-2">
                  {form.customFields.map((field, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input className="input-field flex-1" placeholder="Field name" value={field.name} onChange={(e) => updateField(idx, "name", e.target.value)} />
                      <select className="input-field w-28" value={field.type} onChange={(e) => updateField(idx, "type", e.target.value)}>
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="boolean">Boolean</option>
                      </select>
                      <button type="button" onClick={() => removeField(idx)} className="p-2 hover:bg-red-50 rounded-lg text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
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
