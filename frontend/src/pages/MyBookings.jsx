import { useState, useEffect } from "react";
import api from "../lib/api";
import { CalendarClock, XCircle } from "lucide-react";
import { getBookingStatusInfo } from "./Booking";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBookings = async () => {
    try {
      const res = await api.get("/bookings/my-bookings");
      setBookings(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch your bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await api.post(`/bookings/cancel/${id}`);
      fetchBookings(); // refresh
    } catch (err) {
      setError(err.response?.data?.error || "Failed to cancel booking");
    }
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500 mt-1">Manage your upcoming and past resource reservations</p>
      </div>

      {error && <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="card overflow-hidden border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-gray-400" /> Booking History
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Resource</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date & Time</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Purpose</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">You have no bookings.</td></tr>
              ) : (
                bookings.map((booking) => {
                  const status = getBookingStatusInfo(booking);
                  return (
                    <tr key={booking.id} className="hover:bg-brand-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{booking.asset.name}</div>
                        <div className="text-xs text-brand-600 font-mono">{booking.asset.assetTag}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Date(booking.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                        <div className="text-sm text-gray-500">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{booking.purpose || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {(status.label === "Upcoming" || status.label === "Ongoing") && (
                          <button 
                            onClick={() => handleCancel(booking.id)}
                            className="text-sm text-red-600 hover:text-red-800 flex items-center justify-end gap-1 ml-auto transition-colors"
                          >
                            <XCircle className="w-4 h-4" /> Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
