import React, { useState } from 'react';
import { X, Lock, HeartHandshake } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PrayerRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName?: string;
  roomName?: string;
}

export const PrayerRequestModal: React.FC<PrayerRequestModalProps> = ({
  isOpen,
  onClose,
  defaultName = '',
  roomName,
}) => {
  const { submitPrayerRequest } = useApp();
  const [name, setName] = useState(defaultName);
  const [requestText, setRequestText] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!requestText.trim() || requestText.trim().length < 5) {
      setError('Prayer request must be at least 5 characters');
      return;
    }

    submitPrayerRequest({
      participantName: name.trim(),
      request: requestText.trim(),
      isPrivate,
      roomName,
    });

    setRequestText('');
    setError('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prayer-request-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#17221D] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border-t sm:border border-[#E5E6E1] dark:border-[#26362F] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E6E1] dark:border-[#26362F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#203C32]/10 dark:bg-[#C9A35A]/10 text-[#203C32] dark:text-[#C9A35A] flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 id="prayer-request-title" className="text-lg font-bold text-[#16251F] dark:text-[#F8F7F3]">
                Submit Prayer Request
              </h2>
              <p className="text-xs text-[#68736D] dark:text-[#96A39D]">
                Our pastors and intercessors are standing with you
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-[#B94A48]/30 text-[#B94A48] dark:text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#16251F] dark:text-[#F8F7F3] uppercase tracking-wider mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sister Deborah"
              className="w-full px-4 py-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/50 dark:bg-[#101814] text-[#16251F] dark:text-[#F8F7F3] text-sm focus:outline-none focus:ring-2 focus:ring-[#203C32] dark:focus:ring-[#C9A35A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#16251F] dark:text-[#F8F7F3] uppercase tracking-wider mb-1.5">
              Prayer Request
            </label>
            <textarea
              rows={4}
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="Share what is on your heart or what you would like prayer for..."
              className="w-full px-4 py-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/50 dark:bg-[#101814] text-[#16251F] dark:text-[#F8F7F3] text-sm focus:outline-none focus:ring-2 focus:ring-[#203C32] dark:focus:ring-[#C9A35A] resize-none"
            />
          </div>

          {/* Privacy Toggle */}
          <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[#E5E6E1] dark:border-[#26362F] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-[#C9A35A] shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#16251F] dark:text-[#F8F7F3]">
                  Keep private to prayer leaders
                </p>
                <p className="text-[11px] text-[#68736D] dark:text-[#96A39D]">
                  Only authorized pastors and church elders will view this
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              id="privateToggle"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-5 h-5 accent-[#203C32] dark:accent-[#C9A35A] rounded-md cursor-pointer"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl font-medium text-sm text-[#68736D] dark:text-[#96A39D] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] shadow-md transition-all cursor-pointer"
            >
              Submit Prayer Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
