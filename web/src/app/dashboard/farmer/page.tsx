'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Calendar, Tractor, Clock, CheckCircle, Search, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function FarmerDashboard() {
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

  const activeBookings = bookings.filter(b => b.status === 'ACTIVE' || b.status === 'ACCEPTED');
  const pendingBookings = bookings.filter(b => b.status === 'PENDING');

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-3xl border border-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Farmer Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your rentals and find new equipment for your farm.</p>
        </div>
        <Link 
          href="/dashboard/marketplace"
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-200"
        >
          <Search size={20} />
          Find Equipment
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-4">
              <CheckCircle size={22} />
           </div>
           <p className="text-sm text-slate-500 font-medium">Active Rentals</p>
           <p className="text-2xl font-bold text-slate-900 mt-1">{activeBookings.length}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
           <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit mb-4">
              <Clock size={22} />
           </div>
           <p className="text-sm text-slate-500 font-medium">Pending Requests</p>
           <p className="text-2xl font-bold text-slate-900 mt-1">{pendingBookings.length}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
           <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4">
              <Calendar size={22} />
           </div>
           <p className="text-sm text-slate-500 font-medium">Total Bookings</p>
           <p className="text-2xl font-bold text-slate-900 mt-1">{bookings.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900">Your Recent Bookings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="p-5">Equipment</th>
                <th className="p-5">Owner</th>
                <th className="p-5">Dates</th>
                <th className="p-5">Total Cost</th>
                <th className="p-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    No bookings found. <Link href="/dashboard/marketplace" className="text-emerald-600 font-bold">Start browsing equipment!</Link>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5">
                       <div className="font-bold text-slate-900">{booking.equipment?.name}</div>
                       <div className="text-xs text-slate-400 uppercase font-bold">{booking.equipment?.category}</div>
                    </td>
                    <td className="p-5">
                       <div className="font-bold text-slate-700">{booking.owner?.name}</div>
                       <div className="text-xs text-slate-500">{booking.owner?.phone}</div>
                    </td>
                    <td className="p-5 text-sm text-slate-600">
                       {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-5 font-bold text-slate-900">₹{booking.totalPrice.toLocaleString()}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${booking.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                          booking.status === 'ACCEPTED' || booking.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                          booking.status === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-100' : 
                          'bg-slate-50 text-slate-500'}`}
                      >
                        {booking.status}
                      </span>
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
