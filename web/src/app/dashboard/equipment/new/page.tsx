'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ArrowLeft, Save, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AddEquipment() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'TRACTOR',
    pricePerDay: '',
    description: '',
    location: '',
  });

  const isDirty = formData.name || formData.description || formData.pricePerDay;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'warning');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = null;
      
      // 1. Upload Image if present
      if (image) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', image);
        const uploadRes = await api.post('/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.url;
      }

      // 2. Create Equipment
      await api.post('/equipment', {
        ...formData,
        imageUrl,
        pricePerDay: Number(formData.pricePerDay),
      });
      
      showToast('Equipment listed successfully!', 'success');
      router.push('/dashboard/equipment');
    } catch (error: any) {
      showToast(error.message || 'Failed to add equipment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/equipment" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          <span className="font-medium">Back to Fleet</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-2xl font-bold text-slate-900">Add New Equipment</h1>
          <p className="text-slate-500 text-sm mt-1">Fill in the details below to list your machinery on the marketplace.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Equipment Image</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all overflow-hidden relative group">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    <p className="mb-2 text-sm text-slate-500"><span className="font-bold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-slate-400">WebP, PNG or JPG (MAX. 5MB)</p>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Equipment Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Mahindra Arjun 555 DI"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Category</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="TRACTOR">Tractor</option>
                <option value="HARVESTER">Harvester</option>
                <option value="IMPLEMENT">Implement</option>
                <option value="SEEDER">Seeder</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Price Per Day (₹)</label>
              <input
                required
                type="number"
                placeholder="e.g. 2500"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={formData.pricePerDay}
                onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Location</label>
              <input
                required
                type="text"
                placeholder="e.g. Nashik, Maharashtra"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
            <textarea
              rows={4}
              placeholder="Describe the condition, features, and terms of rental..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end space-x-4">
            <Link href="/dashboard/equipment" className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg font-bold disabled:bg-emerald-400"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>List Equipment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
