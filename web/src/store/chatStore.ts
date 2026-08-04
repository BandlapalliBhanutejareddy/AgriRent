import { create } from 'zustand';

interface ChatState {
  messages: any[];
  setMessages: (messages: any[]) => void;
  addMessage: (message: any) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
}));
