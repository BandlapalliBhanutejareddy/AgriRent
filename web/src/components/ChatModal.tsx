'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { X, Send, MessageSquare, Clock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatModalProps {
  bookingId: string | null;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  recipientName?: string;
}

export default function ChatModal({ bookingId, isOpen, onClose, title = 'Booking Chat', recipientName = 'Owner/Farmer' }: ChatModalProps) {
  const { user } = useStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchMessages() {
    if (!bookingId) return;
    try {
      const res = await api.get(`/chat/booking/${bookingId}`);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim() || !bookingId || sending) return;

    const textToSend = inputText;
    setInputText('');
    setSending(true);

    try {
      const res = await api.post(`/chat/booking/${bookingId}`, { text: textToSend });
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  }

  if (!isOpen || !bookingId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[550px] overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">{title}</h3>
                <p className="text-xs text-slate-500 font-medium">Conversation with {recipientName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <MessageSquare size={36} className="opacity-40" />
                <p className="text-xs font-semibold">No messages yet. Send a message to start the conversation!</p>
              </div>
            ) : (
              Array.from(new Map(messages.map((m: any) => [m.id, m])).values()).map((msg: any) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id || `${msg.senderId}-${msg.createdAt}`}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase">
                        {isMe ? 'You' : msg.sender?.name || 'User'}
                      </span>
                      <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                        <Clock size={8} /> {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed font-medium shadow-sm ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-150 dark:border-slate-700 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3">
            <input
              type="text"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
            >
              <Send size={14} /> Send
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
