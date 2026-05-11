import { create } from 'zustand';

interface BookingState {
  bookings: any[];
  activeBooking: any | null;
  setBookings: (bookings: any[]) => void;
  setActiveBooking: (booking: any | null) => void;
  updateBookingStatusOptimistic: (id: string, status: string) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  activeBooking: null,
  setBookings: (bookings) => set({ bookings }),
  setActiveBooking: (booking) => set({ activeBooking: booking }),
  updateBookingStatusOptimistic: (id, status) => set((state) => ({
    bookings: state.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
  })),
}));
