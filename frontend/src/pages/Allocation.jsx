import { ArrowLeftRight } from "lucide-react";

export default function Allocation() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Allocation</h1>
        <p className="text-gray-500 mt-1">Assign and track asset allocations</p>
      </div>
      <div className="card p-12 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ArrowLeftRight className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Asset Allocation</h2>
        <p className="text-gray-500">Coming in Phase 2 — Allocate assets to employees and departments.</p>
      </div>
    </div>
  );
}
