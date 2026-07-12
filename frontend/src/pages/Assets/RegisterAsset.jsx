import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../lib/api";
import { ArrowLeft, Upload, X } from "lucide-react";

export default function RegisterAsset() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const photoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    serialNumber: "",
    acquisitionDate: "",
    acquisitionCost: "",
    condition: "NEW",
    location: "",
    isBookable: false,
  });

  const [photo, setPhoto] = useState(null);
  const [document, setDocument] = useState(null);

  useEffect(() => {
    api.get("/assets/categories")
      .then((res) => {
        setCategories(res.data);
        if (res.data.length > 0) {
          setForm((f) => ({ ...f, categoryId: res.data[0].id }));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleDocumentChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDocument(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== "") {
          formData.append(key, form[key]);
        }
      });
      
      if (photo) formData.append("photo", photo);
      if (document) formData.append("document", document);

      await api.post("/assets", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      navigate("/assets");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to register asset");
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/assets" className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Register New Asset</h1>
          <p className="text-gray-500 text-sm mt-0.5">Add a new item to the company inventory</p>
        </div>
      </div>

      <div className="card p-8 border border-gray-200 shadow-sm">
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Asset Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                className="input-field"
                placeholder="e.g. MacBook Pro 16&quot;"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
              <select
                name="categoryId"
                className="input-field"
                value={form.categoryId}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Serial Number</label>
              <input
                type="text"
                name="serialNumber"
                className="input-field"
                placeholder="e.g. SN-12345678"
                value={form.serialNumber}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition</label>
              <select
                name="condition"
                className="input-field"
                value={form.condition}
                onChange={handleChange}
              >
                <option value="NEW">New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="DAMAGED">Damaged</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Acquisition Date</label>
              <input
                type="date"
                name="acquisitionDate"
                className="input-field"
                value={form.acquisitionDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Acquisition Cost ($)</label>
              <input
                type="number"
                name="acquisitionCost"
                step="0.01"
                min="0"
                className="input-field"
                placeholder="0.00"
                value={form.acquisitionCost}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input
                type="text"
                name="location"
                className="input-field"
                placeholder="e.g. Floor 3, Desk 12 or IT Storage"
                value={form.location}
                onChange={handleChange}
              />
            </div>
            
            <div className="col-span-2 flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <input
                type="checkbox"
                id="isBookable"
                name="isBookable"
                className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500 cursor-pointer"
                checked={form.isBookable}
                onChange={handleChange}
              />
              <label htmlFor="isBookable" className="text-sm font-medium text-gray-800 cursor-pointer select-none flex-1">
                Shared / Bookable Asset
                <p className="text-xs text-gray-500 font-normal mt-0.5">Allow employees to reserve this asset temporarily (e.g. pool cars, projectors)</p>
              </label>
            </div>
          </div>

          <hr className="border-gray-200" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Asset Photo</label>
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => photoInputRef.current?.click()}
                  className="btn-secondary btn-sm flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Choose File
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={photoInputRef} 
                  onChange={handlePhotoChange} 
                  className="hidden" 
                />
                {photo ? (
                  <div className="flex items-center gap-2 text-sm text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100">
                    <span className="truncate max-w-[120px]">{photo.name}</span>
                    <button type="button" onClick={() => setPhoto(null)} className="text-brand-500 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">No file chosen</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Purchase Document / Invoice</label>
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => documentInputRef.current?.click()}
                  className="btn-secondary btn-sm flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Choose File
                </button>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,image/*" 
                  ref={documentInputRef} 
                  onChange={handleDocumentChange} 
                  className="hidden" 
                />
                {document ? (
                  <div className="flex items-center gap-2 text-sm text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100">
                    <span className="truncate max-w-[120px]">{document.name}</span>
                    <button type="button" onClick={() => setDocument(null)} className="text-brand-500 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">No file chosen</span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <Link to="/assets" className="btn-secondary">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-primary min-w-[120px]">
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : "Register Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
