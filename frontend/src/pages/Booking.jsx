import { useState, useEffect } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { CalendarClock, AlertCircle, CheckCircle2, Clock } from "lucide-react";

export function getBookingStatusInfo(booking) {
  if (booking.isCancelled) return { label: "Cancelled", color: "bg-red-100 text-red-800" };
  const now = new Date();
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  if (now > end) return { label: "Completed", color: "bg-gray-200 text-gray-700" };
  if (now >= start && now <= end) return { label: "Ongoing", color: "bg-green-100 text-green-800" };
  return { label: "Upcoming", color: "bg-blue-100 text-blue-800" };
}

export default function Booking() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [isDepartment, setIsDepartment] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/bookings/bookable-assets")
      .then(res => {
        setResources(res.data);
        if (res.data.length > 0) setSelectedResource(res.data[0].id);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedResource || !date) return;
    fetchBookings();
  }, [selectedResource, date]);

  const fetchBookings = async () => {
    try {
      const res = await api.get(`/bookings/resource/${selectedResource}?date=${date}`);
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError("");
    setBookingSuccess("");
    setSubmitting(true);

    try {
      // Combine date and time
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);

      await api.post("/bookings", {
        assetId: selectedResource,
        date: date,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        purpose,
        isDepartment
      });

      setBookingSuccess("Resource booked successfully!");
      setStartTime("");
      setEndTime("");
      setPurpose("");
      fetchBookings(); // Refresh list
    } catch (err) {
      setBookingError(err.response?.data?.error || "Failed to book resource");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Resource Booking</h1>
        <p className="text-gray-500 mt-1">Book shared resources like meeting rooms, pool cars, and projectors</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-gray-400" /> New Booking
            </h2>

            {bookingError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}
            
            {bookingSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{bookingSuccess}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource</label>
                <select 
                  className="input-field" 
                  value={selectedResource} 
                  onChange={(e) => setSelectedResource(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a resource</option>
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.assetTag})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
                  <input 
                    type="time" 
                    className="input-field" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time</label>
                  <input 
                    type="time" 
                    className="input-field" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Purpose (Optional)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Client Meeting"
                  value={purpose} 
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>

              {user?.role === "DEPARTMENT_HEAD" && (
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isDepartment" 
                    checked={isDepartment}
                    onChange={(e) => setIsDepartment(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                  />
                  <label htmlFor="isDepartment" className="text-sm text-gray-700">Book on behalf of department</label>
                </div>
              )}

              <button type="submit" disabled={submitting || !selectedResource} className="btn-primary w-full mt-2">
                {submitting ? "Booking..." : "Book Resource"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Schedule Viewer */}
        <div className="lg:col-span-2">
          <div className="card border border-gray-200 shadow-sm overflow-hidden h-full min-h-[500px] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Schedule for {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
            </div>
            
            <div className="flex-1 p-6 bg-white overflow-y-auto">
              {bookings.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Clock className="w-12 h-12 mb-3 opacity-50" />
                  <p>No bookings for this date.</p>
                  <p className="text-sm mt-1">The resource is completely free.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => {
                    const status = getBookingStatusInfo(booking);
                    return (
                      <div key={booking.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-end w-24 flex-shrink-0 pt-1">
                          <span className="text-sm font-semibold text-gray-900">{formatTime(booking.startTime)}</span>
                          <span className="text-xs text-gray-500">to {formatTime(booking.endTime)}</span>
                        </div>
                        
                        <div className="w-1 bg-brand-200 rounded-full"></div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {booking.purpose || "Reserved"}
                              </h4>
                              <p className="text-sm text-gray-600 mt-0.5">
                                Booked by {booking.user.name} {booking.isDepartment ? "(Department)" : ""}
                              </p>
                            </div>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
