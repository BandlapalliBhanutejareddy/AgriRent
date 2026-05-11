'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit2, Trash2, Tractor, CheckCircle, XCircle, Search } from 'lucide-react';
import Link from 'next/link';

export default function EquipmentManagement() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');

  useEffect(() => {
    fetchMyEquipment();
  }, []);

  useEffect(() => {
    let filtered = equipment;
    if (search) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (category !== 'All Categories') {
      filtered = filtered.filter(item => item.category === category);
    }
    setFilteredEquipment(filtered);
  }, [search, category, equipment]);

  const fetchMyEquipment = async () => {
    try {
      const response = await api.get('/equipment/my');
      setEquipment(response.data);
      setFilteredEquipment(response.data);
    } catch (error) {
      console.error('Failed to fetch equipment', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    try {
      await api.delete(`/equipment/${id}`);
      setEquipment(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      alert('Failed to delete equipment');
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/equipment/${id}`, { isAvailable: !currentStatus });
      setEquipment(prev => 
        prev.map(e => e.id === id ? { ...e, isAvailable: !currentStatus } : e)
      );
    } catch (error) {
      alert('Failed to update availability');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
            <div className="h-8 bg-slate-200 rounded-lg w-48" />
            <div className="h-10 bg-slate-200 rounded-lg w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-white rounded-2xl border border-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Equipment Fleet</h2>
          <p className="text-slate-500 mt-1">Manage your rental inventory and track availability.</p>
        </div>
        <Link href="/dashboard/equipment/new" className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg font-bold">
          <Plus size={20} strokeWidth={3} />
          <span>Add Equipment</span>
        </Link>
      </div>

      {/* Filter/Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Search your fleet..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        <div className="flex gap-2">
            <select 
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
                <option>All Categories</option>
                <option value="TRACTOR">Tractor</option>
                <option value="HARVESTER">Harvester</option>
                <option value="IMPLEMENT">Implement</option>
            </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEquipment.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-5 bg-slate-50 rounded-full text-slate-300">
                    <Tractor size={48} />
                </div>
                <div className="max-w-xs mx-auto">
                    <h3 className="text-lg font-bold text-slate-900">
                      {search || category !== 'All Categories' ? 'No results found' : 'Your fleet is empty'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {search || category !== 'All Categories' ? 'Try adjusting your filters.' : 'Start earning by listing your first tractor or harvester today.'}
                    </p>
                </div>
                {!(search || category !== 'All Categories') && (
                  <button className="text-emerald-600 font-bold hover:underline">Learn how to list →</button>
                )}
            </div>
          </div>
        ) : (
          filteredEquipment.map((item) => (
            <div key={item.id} className="group bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="h-52 bg-slate-100 relative overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Tractor size={40} />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg ${item.isAvailable ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {item.isAvailable ? 'Live' : 'Hidden'}
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 line-clamp-1">{item.name}</h3>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-600 text-lg">₹{item.pricePerDay}</span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Per Day</p>
                  </div>
                </div>
                
                <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
                  <button 
                    onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                    className={`flex items-center space-x-2 text-xs font-bold uppercase tracking-widest transition-colors ${item.isAvailable ? 'text-red-500 hover:text-red-600' : 'text-emerald-600 hover:text-emerald-700'}`}
                  >
                    {item.isAvailable ? (
                        <>
                            <XCircle size={14} />
                            <span>Go Offline</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle size={14} />
                            <span>Go Online</span>
                        </>
                    )}
                  </button>
                  
                  <div className="flex space-x-2">
                    <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100">
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
