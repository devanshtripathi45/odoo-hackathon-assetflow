import { PackageSearch } from "lucide-react";

export default function Assets() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
        <p className="text-gray-500 mt-1">Manage your organization's assets</p>
      </div>
      <div className="card p-12 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <PackageSearch className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Asset Management</h2>
        <p className="text-gray-500">Coming in Phase 2 — Register, track, and manage all company assets.</p>
      </div>
    </div>
  );
}
