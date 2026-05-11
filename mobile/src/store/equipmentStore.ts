import { create } from 'zustand';

interface EquipmentState {
  equipmentList: any[];
  searchQuery: string;
  categoryFilter: string | null;
  setEquipmentList: (list: any[]) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string | null) => void;
}

export const useEquipmentStore = create<EquipmentState>((set) => ({
  equipmentList: [],
  searchQuery: '',
  categoryFilter: null,
  setEquipmentList: (list) => set({ equipmentList: list }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
}));
