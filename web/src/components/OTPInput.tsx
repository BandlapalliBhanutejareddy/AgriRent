import React, { useState, useRef, KeyboardEvent, ClipboardEvent, useEffect } from 'react';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  disabled?: boolean;
}

export default function OTPInput({ length = 6, onComplete, disabled = false }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!/^[0-9]*$/.test(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    // Auto-advance
    if (val && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    const currentOtp = newOtp.join('');
    if (currentOtp.length === length) {
      onComplete(currentOtp);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length).replace(/[^0-9]/g, '');
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus next empty or last
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputsRef.current[nextIndex]?.focus();

    if (newOtp.join('').length === length) {
      onComplete(newOtp.join(''));
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((value, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          value={value}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-xl font-black bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 transition-all text-slate-900 dark:text-white shadow-sm"
        />
      ))}
    </div>
  );
}
