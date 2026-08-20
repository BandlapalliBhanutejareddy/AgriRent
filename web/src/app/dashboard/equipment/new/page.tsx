'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ArrowLeft, Save, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from "react-i18next";

export default function AddEquipment() {
    const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'TRACTOR',
    pricePerDay: '',
    description: '',
    location: '',
  });

  const isDirty = formData.title || formData.description || formData.pricePerDay;

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

    if (!formData.title || formData.title.trim().length < 3) {
      showToast('Machinery title must be at least 3 characters long', 'warning');
      setLoading(false);
      return;
    }

    if (!formData.pricePerDay || Number(formData.pricePerDay) <= 0) {
      showToast('Price per day must be a valid number greater than 0', 'warning');
      setLoading(false);
      return;
    }

    if (!formData.location || formData.location.trim().length < 2) {
      showToast('Please provide a valid location of at least 2 characters', 'warning');
      setLoading(false);
      return;
    }

    try {
      let imageUrl = '';
      
      // 1. Upload Image if present
      if (image) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', image);
        const uploadRes = await api.post('/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.data?.url || uploadRes.data.url;
      }

      // 2. Create Equipment
      const payload: any = {
        ...formData,
        pricePerDay: Number(formData.pricePerDay),
      };
      if (imageUrl) {
        payload.imageUrl = imageUrl;
      }
      
      await api.post('/equipment', payload);
      
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
          <span className="font-medium">{t('back_to_fleet')}</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-2xl font-bold text-slate-900">{t('add_new_equipment')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('fill_in_the_details_below_to_list_your_m')}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('equipment_image')}</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all overflow-hidden relative group">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    <p className="mb-2 text-sm text-slate-500"><span className="font-bold">{t('click_to_upload')}</span> {t('or_drag_and_drop')}</p>
                    <p className="text-xs text-slate-400">{t('webp_png_or_jpg_max_5mb')}</p>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('equipment_title')}</label>
              <input
                required
                type="text"
                placeholder={t('e_g_mahindra_arjun_555_di')}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-slate-50 placeholder-slate-500 dark:placeholder-slate-400 font-medium"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('category')}</label>
              <select
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-slate-50 font-medium"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="TRACTOR">{t('tractor')}</option>
                <option value="HARVESTER">{t('harvester')}</option>
                <option value="IMPLEMENT">{t('implement')}</option>
                <option value="SEEDER">{t('seeder')}</option>
                <option value="OTHER">{t('other')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('price_per_day')}</label>
              <input
                required
                type="number"
                placeholder={t('e_g_2500')}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-slate-50 placeholder-slate-500 dark:placeholder-slate-400 font-medium"
                value={formData.pricePerDay}
                onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('location')}</label>
              <input
                required
                type="text"
                placeholder={t('e_g_nashik_maharashtra')}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-slate-50 placeholder-slate-500 dark:placeholder-slate-400 font-medium"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('description')}</label>
            <textarea
              rows={4}
              placeholder={t('describe_the_condition_features_and_term')}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none text-slate-900 dark:text-slate-50 placeholder-slate-500 dark:placeholder-slate-400 font-medium"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end space-x-4">
            <Link href="/dashboard/equipment" className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all">
              {t('cancel')}</Link>
            <button
              type="submit"
              data-testid="create-equipment"
              disabled={loading}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg font-bold disabled:bg-emerald-400"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>{t('saving')}</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>{t('list_equipment')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
