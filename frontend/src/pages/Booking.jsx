import { CalendarClock } from "lucide-react";

export default function Booking() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Booking</h1>
        <p className="text-gray-500 mt-1">Reserve shared assets and resources</p>
      </div>
      <div className="card p-12 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CalendarClock className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Resource Booking</h2>
        <p className="text-gray-500">Coming in Phase 2 — Book meeting rooms, vehicles, and shared assets.</p>
      </div>
    </div>
  );
}
