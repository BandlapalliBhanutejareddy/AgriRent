'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Calendar, IndianRupee, Tractor, Clock, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

export default function DashboardOverview() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      setBookings(prev => 
        prev.map(b => b.id === id ? { ...b, status } : b)
      );
    } catch (error) {
      alert('Failed to update booking status');
    }
  };

  const activeBookings = bookings.filter(b => b.status === 'ACTIVE' || b.status === 'ACCEPTED').length;
  const pendingRequests = bookings.filter(b => b.status === 'PENDING').length;
  const totalEarnings = bookings
    .filter(b => b.status === 'COMPLETED' || b.status === 'ACTIVE')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-2xl border border-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here's what's happening with your equipment today.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <button className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg shadow-sm">Last 30 Days</button>
          <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">All Time</button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <IndianRupee size={22} strokeWidth={2.5} />
            </div>
            <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold">
              <TrendingUp size={12} className="mr-1" /> +12%
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium">Est. Earnings</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">₹{totalEarnings.toLocaleString()}</p>
        </div>
        
        <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
              <Calendar size={22} strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium">Active Bookings</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{activeBookings}</p>
        </div>

        <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-amber-200 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
              <Clock size={22} strokeWidth={2.5} />
            </div>
            {pendingRequests > 0 && (
              <div className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded-lg text-xs font-bold animate-pulse">
                Action Required
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium">Pending Requests</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{pendingRequests}</p>
        </div>

        <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-purple-200 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
              <Tractor size={22} strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium">Total Trips</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{bookings.length}</p>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900">Recent Booking Requests</h3>
          <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="p-5 font-bold">Equipment</th>
                <th className="p-5 font-bold">Farmer Details</th>
                <th className="p-5 font-bold">Rental Dates</th>
                <th className="p-5 font-bold">Earnings</th>
                <th className="p-5 font-bold">Status</th>
                <th className="p-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-400">
                             <Clock size={32} />
                        </div>
                        <p className="text-slate-500 font-medium">No booking requests found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                    <td className="p-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold border border-emerald-100">
                             {booking.equipment?.name?.charAt(0) || 'T'}
                        </div>
                        <div>
                            <div className="font-bold text-slate-900">{booking.equipment?.name || 'Unknown'}</div>
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{booking.equipment?.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-slate-700">{booking.farmer?.name || 'Farmer'}</div>
                      <div className="text-xs text-slate-500">{booking.farmer?.phone}</div>
                    </td>
                    <td className="p-5">
                      <div className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg inline-block">
                        {new Date(booking.startDate).toLocaleDateString()} → {new Date(booking.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-slate-900">₹{booking.totalPrice.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Prepaid</div>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider
                        ${booking.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                          booking.status === 'ACCEPTED' || booking.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                          booking.status === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-100' : 
                          'bg-slate-50 text-slate-500 border border-slate-100'}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      {booking.status === 'PENDING' ? (
                        <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleUpdateStatus(booking.id, 'ACCEPTED')}
                            className="p-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                            title="Accept"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(booking.id, 'REJECTED')}
                            className="p-2 bg-white text-red-500 hover:bg-red-50 border border-red-100 rounded-lg transition-all"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      ) : (
                        <button className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">Details</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
